import { AuditStructuredValues } from "../../entities/AuditEvent";

export const AUDIT_REDACTED_VALUE = "[REDACTED]";

const SENSITIVE_KEY_PATTERN =
  /(^|[_-])(password|passwordhash|password_hash|token|access_token|refresh_token|authorization|cookie|secret|api_key|apikey|private_key|mfa|totp)([_-]|$)/i;
const SENSITIVE_VALUE_PATTERNS = [
  /Bearer\s+\S+/i,
  /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:password|token|secret|api[_-]?key|authorization)\s*[:=]\s*\S+/i,
];

export function redactAuditText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value))
    ? AUDIT_REDACTED_VALUE
    : value;
}

export function redactAuditValues(
  values: AuditStructuredValues | undefined
): AuditStructuredValues | undefined {
  return values ? (redactValue(values, new WeakSet<object>()) as AuditStructuredValues) : undefined;
}

function redactValue(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === "string") {
    return redactAuditText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, seen));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    throw new Error("Circular audit values are not supported");
  }
  seen.add(value);

  const redacted = Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(normalizeKey(key))
        ? AUDIT_REDACTED_VALUE
        : redactValue(entry, seen),
    ])
  );
  seen.delete(value);
  return redacted;
}

function normalizeKey(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

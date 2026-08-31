import {
  configAcknowledgementSchema,
  verifyConfigDeliveryEnvelope,
  type ConfigAcknowledgement,
} from "../controller-sync/offline-critical-config.contract";
import type { AcknowledgedConfigIdentity } from "./runtime.contract";

export type ConfigReceiptRejectionCode =
  | "INVALID_ENVELOPE"
  | "SITE_MISMATCH"
  | "STALE_CONFIG_VERSION"
  | "VERSION_CHECKSUM_CONFLICT";

export interface ConfigReceiptResult {
  acknowledgement: ConfigAcknowledgement;
  accepted_config: AcknowledgedConfigIdentity | null;
}

export interface ConfigReceiptInput {
  controller_id: string;
  site_uuid: string;
  current_config: AcknowledgedConfigIdentity | null;
  envelope: unknown;
  acknowledged_at: string;
}

export function receiveConfigEnvelope(
  input: ConfigReceiptInput
): ConfigReceiptResult {
  let envelope;
  try {
    envelope = verifyConfigDeliveryEnvelope(input.envelope);
  } catch {
    return rejected(input, "INVALID_ENVELOPE");
  }

  if (envelope.bundle.site_uuid !== input.site_uuid) {
    return rejected(input, "SITE_MISMATCH");
  }

  const current = input.current_config;
  if (current && envelope.bundle.config_version < current.config_version) {
    return rejected(input, "STALE_CONFIG_VERSION");
  }

  if (
    current &&
    envelope.bundle.config_version === current.config_version &&
    envelope.checksum_sha256 !== current.checksum_sha256
  ) {
    return rejected(input, "VERSION_CHECKSUM_CONFLICT");
  }

  const acceptedConfig: AcknowledgedConfigIdentity = {
    site_uuid: envelope.bundle.site_uuid,
    config_version: envelope.bundle.config_version,
    checksum_sha256: envelope.checksum_sha256,
  };

  return {
    acknowledgement: configAcknowledgementSchema.parse({
      controller_id: input.controller_id,
      site_uuid: input.site_uuid,
      config_version: acceptedConfig.config_version,
      checksum_sha256: acceptedConfig.checksum_sha256,
      acknowledged_at: input.acknowledged_at,
      status: "APPLIED",
    }),
    accepted_config: acceptedConfig,
  };
}

function rejected(
  input: ConfigReceiptInput,
  code: ConfigReceiptRejectionCode
): ConfigReceiptResult {
  const envelope = safeEnvelopeIdentity(input.envelope);
  return {
    acknowledgement: configAcknowledgementSchema.parse({
      controller_id: input.controller_id,
      site_uuid: input.site_uuid,
      config_version:
        envelope?.config_version ?? input.current_config?.config_version ?? 1,
      checksum_sha256:
        envelope?.checksum_sha256 ??
        input.current_config?.checksum_sha256 ??
        "0".repeat(64),
      acknowledged_at: input.acknowledged_at,
      status: "REJECTED",
      rejection_code: code,
    }),
    accepted_config: null,
  };
}

function safeEnvelopeIdentity(
  input: unknown
): { config_version: number; checksum_sha256: string } | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  const bundle = record.bundle;
  const checksumSha256 = record.checksum_sha256;
  if (!bundle || typeof bundle !== "object") return null;
  const configVersion = (bundle as Record<string, unknown>).config_version;
  if (!Number.isInteger(configVersion) || (configVersion as number) <= 0) {
    return null;
  }
  if (
    typeof checksumSha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(checksumSha256)
  ) {
    return null;
  }
  return {
    config_version: configVersion as number,
    checksum_sha256: checksumSha256,
  };
}

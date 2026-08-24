export const PLATFORM_PRINCIPAL_TYPES = ["SYSTEM_OWNER"] as const;

export type PlatformPrincipalType = (typeof PLATFORM_PRINCIPAL_TYPES)[number];

export type PlatformPrincipalStatus = "active" | "disabled";

export interface SystemOwnerPrincipal {
  kind: "platform";
  type: "SYSTEM_OWNER";
  id: string;
  username: string;
}

export interface PlatformPrincipalRecord {
  id: string;
  principal_type: PlatformPrincipalType;
  username: string;
  status: PlatformPrincipalStatus;
  created_at: string;
  updated_at: string | null;
}

export interface PlatformPrincipalCredentialRecord extends PlatformPrincipalRecord {
  password_hash: string;
}

export type PlatformPrincipal = SystemOwnerPrincipal;

export function normalizePlatformUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isPlatformPrincipal(value: unknown): value is PlatformPrincipal {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PlatformPrincipal>;
  return (
    candidate.kind === "platform" &&
    candidate.type === "SYSTEM_OWNER" &&
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.username === "string" &&
    candidate.username.length > 0
  );
}

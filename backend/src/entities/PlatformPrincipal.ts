export const PLATFORM_PRINCIPAL_TYPES = ["SYSTEM_OWNER"] as const;

export type PlatformPrincipalType = (typeof PLATFORM_PRINCIPAL_TYPES)[number];

export interface SystemOwnerPrincipal {
  kind: "platform";
  type: "SYSTEM_OWNER";
  id: string;
  username: string;
}

export type PlatformPrincipal = SystemOwnerPrincipal;

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

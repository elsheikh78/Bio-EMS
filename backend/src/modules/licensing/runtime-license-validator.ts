import { compareHardwareFingerprint, type HardwareFingerprint } from "./hardware-fingerprint";
import { verifyLicenseCertificate, type SignedLicenseCertificate } from "./license-certificate";

export interface RuntimeLicenseContext {
  installationId: string;
  siteId: number;
  hardwareFingerprint: HardwareFingerprint;
  now?: Date;
}

export type RuntimeLicenseDecision =
  | { valid: true; mode: "LICENSED"; hardwareScore: number }
  | {
      valid: false;
      mode: "RESTRICTED";
      reason:
        "SIGNATURE" | "STATUS" | "NOT_STARTED" | "EXPIRED" | "INSTALLATION" | "SITE" | "HARDWARE";
      monitoringContinuity: true;
    };

export function validateRuntimeLicense(
  certificate: SignedLicenseCertificate,
  publicKeyPem: string,
  context: RuntimeLicenseContext
): RuntimeLicenseDecision {
  let claims;
  try {
    claims = verifyLicenseCertificate(certificate, publicKeyPem);
  } catch {
    return { valid: false, mode: "RESTRICTED", reason: "SIGNATURE", monitoringContinuity: true };
  }
  const now = context.now ?? new Date();
  if (claims.status !== "ACTIVE")
    return { valid: false, mode: "RESTRICTED", reason: "STATUS", monitoringContinuity: true };
  if (now < new Date(claims.startsAt))
    return { valid: false, mode: "RESTRICTED", reason: "NOT_STARTED", monitoringContinuity: true };
  if (claims.expiresAt && now > new Date(claims.expiresAt))
    return { valid: false, mode: "RESTRICTED", reason: "EXPIRED", monitoringContinuity: true };
  if (claims.installationId !== context.installationId)
    return { valid: false, mode: "RESTRICTED", reason: "INSTALLATION", monitoringContinuity: true };
  if (claims.siteId !== context.siteId)
    return { valid: false, mode: "RESTRICTED", reason: "SITE", monitoringContinuity: true };
  const hardware = compareHardwareFingerprint(
    claims.hardwareFingerprint,
    context.hardwareFingerprint
  );
  if (!hardware.matches)
    return { valid: false, mode: "RESTRICTED", reason: "HARDWARE", monitoringContinuity: true };
  return { valid: true, mode: "LICENSED", hardwareScore: hardware.score };
}

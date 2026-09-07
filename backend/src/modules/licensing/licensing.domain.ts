export const LICENSE_INSTALLATION_STATUSES = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "REVOKED",
  "RETIRED",
] as const;

export const LICENSE_STATUSES = [
  "DRAFT",
  "ISSUED",
  "ACTIVE",
  "SUSPENDED",
  "EXPIRED",
  "REVOKED",
  "SUPERSEDED",
] as const;

export const LICENSE_TYPES = ["TRIAL", "SUBSCRIPTION", "PERPETUAL"] as const;
export const UPDATE_ENTITLEMENTS = ["NONE", "FREE", "PAID"] as const;

export type LicenseInstallationStatus = (typeof LICENSE_INSTALLATION_STATUSES)[number];
export type LicenseStatus = (typeof LICENSE_STATUSES)[number];
export type LicenseType = (typeof LICENSE_TYPES)[number];
export type LicenseUpdateEntitlement = (typeof UPDATE_ENTITLEMENTS)[number];

export interface LicensingInstallationRecord {
  id: number;
  installationUuid: string;
  customerId: number;
  siteId: number;
  provisioningInstallationId: number | null;
  status: LicenseInstallationStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface SiteBoundLicenseRecord {
  id: number;
  licenseUuid: string;
  installationId: number;
  schemaVersion: number;
  licenseType: LicenseType;
  status: LicenseStatus;
  issuedAt: string | null;
  startsAt: string;
  expiresAt: string | null;
  maintenanceUntil: string | null;
  updateEntitlement: LicenseUpdateEntitlement;
  offlinePolicyJson: string;
  createdAt: string;
  createdBy: string;
}

export interface LicenseEntitlementRecord {
  id: number;
  licenseId: number;
  moduleCode: string;
  enabled: boolean;
  maximumGateways: number | null;
  maximumDevices: number | null;
  maximumSensors: number | null;
}

const allowedLicenseTransitions: Readonly<Record<LicenseStatus, readonly LicenseStatus[]>> = {
  DRAFT: ["ISSUED", "REVOKED"],
  ISSUED: ["ACTIVE", "REVOKED", "SUPERSEDED"],
  ACTIVE: ["SUSPENDED", "EXPIRED", "REVOKED", "SUPERSEDED"],
  SUSPENDED: ["ACTIVE", "EXPIRED", "REVOKED", "SUPERSEDED"],
  EXPIRED: ["SUPERSEDED"],
  REVOKED: [],
  SUPERSEDED: [],
};

export function canTransitionLicense(from: LicenseStatus, to: LicenseStatus): boolean {
  return allowedLicenseTransitions[from].includes(to);
}

export function assertLicenseTransition(from: LicenseStatus, to: LicenseStatus): void {
  if (!canTransitionLicense(from, to)) {
    throw new Error(`Invalid license status transition: ${from} -> ${to}`);
  }
}

import {
  installationContextSchema,
  type InstallationContext,
} from "./contracts";

// Explicit allowlist: never export the raw provisioning receipt or credentials.
export function installationIdentityExport(context: InstallationContext) {
  const identity = installationContextSchema.parse(context);
  return {
    schemaVersion: 1,
    product: "BIO-EMS",
    exportedAt: new Date().toISOString(),
    installationId: identity.installationId,
    source: identity.source,
    customer: {
      id: identity.customer.id,
      code: identity.customer.code,
      name: identity.customer.name,
    },
    site: {
      id: identity.site.id,
      code: identity.site.code,
      name: identity.site.name,
    },
  };
}

export function installationIdentityFileName(context: InstallationContext) {
  const { installationId } = installationContextSchema.parse(context);
  return `BIO-EMS-Installation-${installationId}.json`;
}

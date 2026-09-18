import "dotenv/config";
import { createProductionKeyProtector } from "../modules/licensing/key-protection";
import { provisionInstallationIdentity } from "../modules/licensing/installer-integration";

export function runProvisionInstallationIdentityCommand(
  environment: NodeJS.ProcessEnv = process.env
): number {
  try {
    const identityPath = environment.BIOEMS_INSTALLATION_IDENTITY_PATH;
    const receiptPath = environment.BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH;
    if (!identityPath || !receiptPath) throw new Error("Installer identity paths are required");

    const customerName = environment.BIOEMS_INSTALLATION_CUSTOMER_NAME;
    const customerCode = environment.BIOEMS_INSTALLATION_CUSTOMER_CODE;
    const siteName = environment.BIOEMS_INSTALLATION_SITE_NAME;
    const siteCode = environment.BIOEMS_INSTALLATION_SITE_CODE;
    const suppliedMetadata = [customerName, customerCode, siteName, siteCode].some(
      (value) => value !== undefined
    );
    if (
      suppliedMetadata &&
      (!customerName || !customerCode || !siteName || !siteCode)
    ) {
      throw new Error("Complete installer customer and site metadata is required");
    }

    const receipt = provisionInstallationIdentity({
      identityPath,
      receiptPath,
      protector: createProductionKeyProtector(environment),
      ...(suppliedMetadata
        ? {
            customerSite: {
              customerName: customerName!,
              customerCode: customerCode!,
              siteName: siteName!,
              siteCode: siteCode!,
              siteLocation: environment.BIOEMS_INSTALLATION_SITE_LOCATION || undefined,
              contactName: environment.BIOEMS_INSTALLATION_CONTACT_NAME || undefined,
              contactEmail: environment.BIOEMS_INSTALLATION_CONTACT_EMAIL || undefined,
              contactPhone: environment.BIOEMS_INSTALLATION_CONTACT_PHONE || undefined,
            },
          }
        : {}),
    });
    console.log(`Created unactivated installation identity ${receipt.installationId}`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(`Installation identity provisioning failed: ${message}`);
    return 1;
  }
}

if (require.main === module) process.exitCode = runProvisionInstallationIdentityCommand();

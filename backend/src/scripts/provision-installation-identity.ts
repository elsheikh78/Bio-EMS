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
    const receipt = provisionInstallationIdentity({
      identityPath,
      receiptPath,
      protector: createProductionKeyProtector(environment),
    });
    console.log(`Created unactivated installation identity ${receipt.installationId}`);
    return 0;
  } catch {
    console.error("Installation identity provisioning failed");
    return 1;
  }
}

if (require.main === module) process.exitCode = runProvisionInstallationIdentityCommand();

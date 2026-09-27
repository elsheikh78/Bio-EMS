import "dotenv/config";
import { repairInstallationProvisioningReceipt } from "../modules/installation/installation-receipt-repair.service";

export function runInstallationProvisioningReceiptRepair(
  environment: NodeJS.ProcessEnv = process.env,
): number {
  try {
    const sqlitePath = environment.BIOEMS_SQLITE_PATH;
    const identityPath = environment.BIOEMS_INSTALLATION_IDENTITY_PATH;
    const receiptPath =
      environment.BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH;

    if (!sqlitePath || !identityPath || !receiptPath) {
      throw new Error(
        "SQLite, installation identity, and provisioning receipt paths are required",
      );
    }

    const result = repairInstallationProvisioningReceipt({
      sqlitePath,
      identityPath,
      receiptPath,
    });

    console.log(
      `Installation provisioning receipt metadata: ${result.state} ${result.installationId}`,
    );
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(
      `Installation provisioning receipt metadata repair failed: ${message}`,
    );
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = runInstallationProvisioningReceiptRepair();
}

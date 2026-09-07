import "dotenv/config";
import { generateLicenseSigningKey } from "../modules/licensing/signing-key-operations";

export function runGenerateLicenseSigningKeyCommand(
  environment: NodeJS.ProcessEnv = process.env
): number {
  try {
    const outputDirectory = environment.BIOEMS_SIGNING_KEY_OUTPUT_DIRECTORY;
    const keyId = environment.BIOEMS_SIGNING_KEY_ID;
    if (!outputDirectory || !keyId) throw new Error("Signing key output and ID are required");
    const result = generateLicenseSigningKey(outputDirectory, keyId);
    console.log(`Created signing key ${result.keyId}; private material was not printed`);
    return 0;
  } catch {
    console.error("License signing key generation failed");
    return 1;
  }
}

if (require.main === module) process.exitCode = runGenerateLicenseSigningKeyCommand();

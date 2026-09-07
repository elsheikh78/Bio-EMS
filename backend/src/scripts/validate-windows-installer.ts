import { resolve } from "node:path";
import { readAndValidateWindowsInstallerPackage } from "../deployment/windows-installer-package";

export function runValidateWindowsInstallerCommand(
  environment: NodeJS.ProcessEnv = process.env
): number {
  const stagingDirectory = environment.BIOEMS_INSTALLER_STAGING_DIR;
  if (!stagingDirectory) {
    console.error("BIO-EMS Windows installer validation: STAGING_DIRECTORY_REQUIRED");
    return 1;
  }
  const result = readAndValidateWindowsInstallerPackage(resolve(stagingDirectory));
  if (result.ready) {
    console.log("BIO-EMS Windows installer validation: PASS");
    return 0;
  }
  for (const issue of result.issues) {
    console.error(
      `BIO-EMS Windows installer validation: ${issue.code}${issue.artifactId ? `:${issue.artifactId}` : ""}`
    );
  }
  return 1;
}

if (require.main === module) process.exitCode = runValidateWindowsInstallerCommand();

import { readFileSync } from "node:fs";
import dotenv from "dotenv";

export function loadOwnerImportEnvironment(
  environment: NodeJS.ProcessEnv,
  targetEnvironment: NodeJS.ProcessEnv = process.env
): void {
  const environmentFile = environment.BIOEMS_ENV_FILE?.trim();

  if (environmentFile) {
    let parsed: Record<string, string>;
    try {
      parsed = dotenv.parse(readFileSync(environmentFile));
    } catch {
      throw new Error("BIO-EMS protected service environment could not be loaded");
    }

    for (const [name, value] of Object.entries(parsed)) {
      environment[name] = value;
      targetEnvironment[name] = value;
    }
  }

  const sqlitePath = (
    environmentFile
      ? environment.BIOEMS_SQLITE_PATH
      : environment.BIOEMS_SQLITE_PATH || targetEnvironment.BIOEMS_SQLITE_PATH
  )?.trim();

  if (!sqlitePath) {
    throw new Error("BIO-EMS SQLite path is unavailable in the protected service environment");
  }

  environment.BIOEMS_SQLITE_PATH = sqlitePath;
  targetEnvironment.BIOEMS_SQLITE_PATH = sqlitePath;
}

export function describeOwnerImportError(error: unknown): string {
  if (!(error instanceof Error)) return "unknown failure";
  const message = error.message.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  return message ? message.slice(0, 512) : "unknown failure";
}

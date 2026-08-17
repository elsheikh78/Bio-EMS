import path from "node:path";

export function resolveSqlitePath(
  environment: NodeJS.ProcessEnv,
  workingDirectory: string
): string {
  const configured = environment.BIOEMS_SQLITE_PATH?.trim();
  return configured
    ? path.resolve(workingDirectory, configured)
    : path.join(workingDirectory, "database", "bioems.db");
}

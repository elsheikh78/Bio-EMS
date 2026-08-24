import "dotenv/config";
import type Database from "better-sqlite3";
import {
  bootstrapSystemOwner,
  BootstrapSystemOwnerError,
  readBootstrapSystemOwnerEnvironment,
} from "../services/system-owner-bootstrap.service";

export async function runBootstrapSystemOwnerCommand(
  environment: NodeJS.ProcessEnv = process.env
): Promise<number> {
  let database: Database.Database | undefined;

  try {
    const input = readBootstrapSystemOwnerEnvironment(environment);
    const [{ sqlite }, { createTables }, { runMigrations }, { PlatformPrincipalRepository }] =
      await Promise.all([
        import("../../database/sqlite/client"),
        import("../../database/sqlite/schema"),
        import("../../database/sqlite/migration-runner"),
        import("../repositories/platform-principal.repository"),
      ]);

    database = sqlite;
    createTables(database);
    runMigrations(database);
    await bootstrapSystemOwner(input, {
      platformPrincipalRepository: new PlatformPrincipalRepository(database),
      logger: { info: (message) => console.log(message) },
    });
    return 0;
  } catch (error) {
    console.error(
      error instanceof BootstrapSystemOwnerError ? error.message : "System owner bootstrap failed"
    );
    return 1;
  } finally {
    database?.close();
  }
}

if (require.main === module) {
  void runBootstrapSystemOwnerCommand().then((exitCode) => {
    process.exitCode = exitCode;
  });
}

import "dotenv/config";
import type Database from "better-sqlite3";
import {
  bootstrapAdmin,
  BootstrapAdminError,
  readBootstrapAdminEnvironment,
} from "../services/admin-bootstrap.service";

export async function runBootstrapAdminCommand(
  environment: NodeJS.ProcessEnv = process.env
): Promise<number> {
  let database: Database.Database | undefined;

  try {
    const input = readBootstrapAdminEnvironment(environment);
    const [{ sqlite }, { createTables }, { runMigrations }, { UserRepository }] = await Promise.all(
      [
        import("../../database/sqlite/client"),
        import("../../database/sqlite/schema"),
        import("../../database/sqlite/migration-runner"),
        import("../repositories/user.repository"),
      ]
    );

    database = sqlite;
    createTables(database);
    runMigrations(database);
    await bootstrapAdmin(input, {
      userRepository: new UserRepository(database),
      logger: { info: (message) => console.log(message) },
    });
    return 0;
  } catch (error) {
    console.error(
      error instanceof BootstrapAdminError ? error.message : "Administrator bootstrap failed"
    );
    return 1;
  } finally {
    database?.close();
  }
}

if (require.main === module) {
  void runBootstrapAdminCommand().then((exitCode) => {
    process.exitCode = exitCode;
  });
}

import Database from "better-sqlite3";
import { sqlite } from "../../../../database/sqlite/client";
import { LastActiveAdminError, UserRepository } from "../../user.repository";

export interface ConcurrentAdminAttempt {
  connection: "first" | "second";
  result: "updated" | "busy" | "last-admin";
}

interface WorkerInput {
  filename: string;
  userId: number;
}

let input: WorkerInput;
let database: Database.Database;
let repository: UserRepository;

process.on(
  "message",
  (message: { type: "initialize"; filename: string; userId: number } | { type: "start" }) => {
    if (message.type === "initialize") {
      input = message;
      database = new Database(input.filename);
      database.pragma("busy_timeout = 100");
      repository = new UserRepository(database);
      process.send!({ type: "ready" });
    } else executeDemotion();
  }
);

function executeDemotion(): void {
  let result: ConcurrentAdminAttempt["result"];
  try {
    repository.updateProfileAndRole(input.userId, { role: "OPERATOR" });
    result = "updated";
  } catch (error) {
    if (error instanceof LastActiveAdminError) result = "last-admin";
    else if (
      error instanceof Database.SqliteError &&
      (error.code === "SQLITE_BUSY" || error.code === "SQLITE_LOCKED")
    ) {
      result = "busy";
    } else throw error;
  } finally {
    database.close();
    sqlite.close();
  }

  process.send!(
    {
      connection: input.userId === 1 ? "first" : "second",
      result,
    } satisfies ConcurrentAdminAttempt,
    () => process.disconnect?.()
  );
}

import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Worker } from "node:worker_threads";
import { afterEach, describe, expect, it } from "vitest";
import { migration003 } from "../../../database/sqlite/migrations/003_create_users";

const hash = `$2b$12$${"A".repeat(53)}`;
const temporaryDirectories: string[] = [];

describe("last-active-ADMIN atomicity across SQLite connections", () => {
  afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("never lets two conflicting demotions remove every active ADMIN", async () => {
    const directory = mkdtempSync(join(tmpdir(), "bio-ems-admin-atomicity-"));
    temporaryDirectories.push(directory);
    const filename = join(directory, "users.sqlite");
    const setup = new Database(filename);
    migration003.up(setup);
    const insert = setup.prepare(
      "INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, 'ADMIN', 'active')"
    );
    const firstId = Number(insert.run("first-admin", hash).lastInsertRowid);
    const secondId = Number(insert.run("second-admin", hash).lastInsertRowid);
    setup.close();

    const coordination = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2);
    const firstAttempt = runConflictingDemotion(filename, firstId, coordination);
    const secondAttempt = runConflictingDemotion(filename, secondId, coordination);
    const signal = new Int32Array(coordination);
    while (Atomics.load(signal, 0) < 2) {
      Atomics.wait(signal, 0, Atomics.load(signal, 0), 5_000);
    }
    Atomics.store(signal, 1, 1);
    Atomics.notify(signal, 1, 2);
    const attempts = await Promise.all([firstAttempt, secondAttempt]);

    const verify = new Database(filename, { readonly: true });
    const activeAdmins = verify
      .prepare("SELECT id FROM users WHERE role = 'ADMIN' AND status = 'active' ORDER BY id")
      .all() as Array<{ id: number }>;
    verify.close();

    expect(attempts.filter((result) => result === "updated")).toHaveLength(1);
    expect(attempts.filter((result) => result === "busy" || result === "last-admin")).toHaveLength(
      1
    );
    expect(activeAdmins).toHaveLength(1);
  });
});

function runConflictingDemotion(
  filename: string,
  userId: number,
  coordination: SharedArrayBuffer
): Promise<"updated" | "busy" | "last-admin"> {
  const modulePath = require.resolve("better-sqlite3");
  const workerSource = `
    const { parentPort, workerData } = require("node:worker_threads");
    const Database = require(workerData.modulePath);
    const signal = new Int32Array(workerData.coordination);
    const database = new Database(workerData.filename);
    database.pragma("busy_timeout = 100");
    let result;
    try {
      database.exec("BEGIN");
      const row = database.prepare(
        "SELECT COUNT(*) AS count FROM users WHERE role = 'ADMIN' AND status = 'active' AND id <> ?"
      ).get(workerData.userId);
      Atomics.add(signal, 0, 1);
      Atomics.notify(signal, 0);
      Atomics.wait(signal, 1, 0);
      if (row.count === 0) {
        database.exec("ROLLBACK");
        result = "last-admin";
      } else {
        database.prepare("UPDATE users SET role = 'OPERATOR' WHERE id = ?").run(workerData.userId);
        database.exec("COMMIT");
        result = "updated";
      }
    } catch (error) {
      if (database.inTransaction) database.exec("ROLLBACK");
      if (error && (error.code === "SQLITE_BUSY" || error.code === "SQLITE_LOCKED")) result = "busy";
      else throw error;
    } finally {
      database.close();
    }
    parentPort.postMessage(result);
  `;

  return new Promise((resolve, reject) => {
    const worker = new Worker(workerSource, {
      eval: true,
      workerData: { filename, userId, coordination, modulePath },
    });
    worker.once("message", resolve);
    worker.once("error", reject);
    worker.once("exit", (code) => {
      if (code !== 0) reject(new Error(`Atomicity worker exited with code ${code}`));
    });
  });
}

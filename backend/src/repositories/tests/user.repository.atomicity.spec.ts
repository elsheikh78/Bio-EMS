import Database from "better-sqlite3";
import { fork } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { migration003 } from "../../../database/sqlite/migrations/003_create_users";
import type { ConcurrentAdminAttempt } from "./fixtures/user-repository.worker";

const hash = `$2b$12$${"A".repeat(53)}`;
const temporaryDirectories: string[] = [];

describe("last-active-ADMIN atomicity across SQLite connections", () => {
  afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("executes conflicting demotions through two production UserRepository instances", async () => {
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

    const firstWorker = createRepositoryWorker(filename, firstId);
    const secondWorker = createRepositoryWorker(filename, secondId);
    await Promise.all([firstWorker.ready, secondWorker.ready]);
    firstWorker.start();
    secondWorker.start();
    const attempts = await Promise.all([firstWorker.result, secondWorker.result]);

    const verify = new Database(filename, { readonly: true });
    const finalUsers = verify
      .prepare("SELECT id, role, status FROM users ORDER BY id")
      .all() as Array<{ id: number; role: string; status: string }>;
    verify.close();

    expect(attempts.map(({ connection }) => connection).sort()).toEqual(["first", "second"]);
    expect([
      ["busy", "updated"],
      ["last-admin", "updated"],
    ]).toContainEqual(attempts.map(({ result }) => result).sort());
    expect(finalUsers).toHaveLength(2);
    expect(
      finalUsers.filter(({ role, status }) => role === "ADMIN" && status === "active")
    ).toHaveLength(1);
    expect(
      finalUsers.filter(({ role, status }) => role === "OPERATOR" && status === "active")
    ).toHaveLength(1);
  }, 20_000);
});

interface RepositoryWorker {
  ready: Promise<void>;
  result: Promise<ConcurrentAdminAttempt>;
  start: () => void;
}

function createRepositoryWorker(filename: string, userId: number): RepositoryWorker {
  const fixture = join(__dirname, "fixtures", "user-repository.worker.ts");
  const tsNodeRegister = require.resolve("ts-node/register");
  const worker = fork(fixture, [], {
    execArgv: ["--require", tsNodeRegister],
    stdio: ["ignore", "ignore", "pipe", "ipc"],
  });
  let standardError = "";
  worker.stderr!.on("data", (chunk) => {
    standardError += String(chunk);
  });

  let markReady!: () => void;
  let rejectReady!: (error: Error) => void;
  const ready = new Promise<void>((resolve, reject) => {
    markReady = resolve;
    rejectReady = reject;
  });
  const result = new Promise<ConcurrentAdminAttempt>((resolve, reject) => {
    worker.on("message", (message: { type: "ready" } | ConcurrentAdminAttempt) => {
      if ("type" in message) markReady();
      else resolve(message);
    });
    worker.once("error", (error) => {
      rejectReady(error);
      reject(error);
    });
    worker.once("exit", (code) => {
      if (code !== 0) {
        const error = new Error(`Atomicity worker exited with code ${code}: ${standardError}`);
        rejectReady(error);
        reject(error);
      }
    });
  });

  worker.send({ type: "initialize", filename, userId });
  return { ready, result, start: () => worker.send({ type: "start" }) };
}

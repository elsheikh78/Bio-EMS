import bcrypt from "bcrypt";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration009 } from "../../../database/sqlite/migrations/009_create_platform_principals";
import { PlatformPrincipalRepository } from "../../repositories/platform-principal.repository";
import {
  bootstrapSystemOwner,
  BootstrapSystemOwnerError,
  readBootstrapSystemOwnerEnvironment,
} from "../system-owner-bootstrap.service";

const VALID_PASSWORD = "SecureOwnerPassword1";

describe("secure SYSTEM_OWNER bootstrap", () => {
  let database: Database.Database;
  let repository: PlatformPrincipalRepository;
  let messages: string[];

  beforeEach(() => {
    database = new Database(":memory:");
    migration009.up(database);
    repository = new PlatformPrincipalRepository(database);
    messages = [];
  });

  afterEach(() => database.close());

  it("creates one normalized active SYSTEM_OWNER with a bcrypt hash", async () => {
    const id = await bootstrapSystemOwner(
      { username: " Platform.Owner ", password: VALID_PASSWORD },
      {
        platformPrincipalRepository: repository,
        logger: { info: (message) => messages.push(message) },
        generateId: () => "system-owner-id",
      }
    );

    expect(id).toBe("system-owner-id");
    expect(repository.findById(id)).toMatchObject({
      id,
      principal_type: "SYSTEM_OWNER",
      username: "platform.owner",
      status: "active",
    });
    expect(repository.findById(id)).not.toHaveProperty("password_hash");

    const stored = database
      .prepare("SELECT password_hash FROM platform_principals WHERE id = ?")
      .get(id) as { password_hash: string };
    expect(stored.password_hash).not.toBe(VALID_PASSWORD);
    await expect(bcrypt.compare(VALID_PASSWORD, stored.password_hash)).resolves.toBe(true);
    expect(messages).toEqual(["System owner created"]);
    expect(messages.join(" ")).not.toMatch(/SecureOwnerPassword1|\$2[aby]\$/);
  });

  it("fails safely on repeated execution without overwriting the owner", async () => {
    const dependencies = {
      platformPrincipalRepository: repository,
      logger: { info: (message: string) => messages.push(message) },
      generateId: () => "system-owner-id",
    };
    await bootstrapSystemOwner(
      { username: "platform-owner", password: VALID_PASSWORD },
      dependencies
    );
    const before = database.prepare("SELECT * FROM platform_principals").get();

    await expect(
      bootstrapSystemOwner(
        { username: "other-owner", password: "DifferentOwnerPassword2" },
        dependencies
      )
    ).rejects.toEqual(new BootstrapSystemOwnerError());

    expect(database.prepare("SELECT * FROM platform_principals").get()).toEqual(before);
    expect(database.prepare("SELECT COUNT(*) AS count FROM platform_principals").get()).toEqual({
      count: 1,
    });
    expect(messages).toEqual(["System owner created"]);
  });

  it.each([
    {},
    { BIOEMS_BOOTSTRAP_SYSTEM_OWNER_USERNAME: "platform-owner" },
    { BIOEMS_BOOTSTRAP_SYSTEM_OWNER_PASSWORD: VALID_PASSWORD },
  ])("rejects missing required environment without exposing input", (environment) => {
    expect(() => readBootstrapSystemOwnerEnvironment(environment)).toThrowError(
      "System owner bootstrap failed"
    );
  });

  it("reads the controlled environment without changing the password", () => {
    expect(
      readBootstrapSystemOwnerEnvironment({
        BIOEMS_BOOTSTRAP_SYSTEM_OWNER_USERNAME: " Platform.Owner ",
        BIOEMS_BOOTSTRAP_SYSTEM_OWNER_PASSWORD: ` ${VALID_PASSWORD} `,
      })
    ).toEqual({
      username: " Platform.Owner ",
      password: ` ${VALID_PASSWORD} `,
    });
  });

  it("leaves no partial principal and emits no success log after invalid input", async () => {
    await expect(
      bootstrapSystemOwner(
        { username: "invalid owner", password: VALID_PASSWORD },
        {
          platformPrincipalRepository: repository,
          logger: { info: (message) => messages.push(message) },
        }
      )
    ).rejects.toEqual(new BootstrapSystemOwnerError());

    expect(database.prepare("SELECT COUNT(*) AS count FROM platform_principals").get()).toEqual({
      count: 0,
    });
    expect(messages).toEqual([]);
  });
});

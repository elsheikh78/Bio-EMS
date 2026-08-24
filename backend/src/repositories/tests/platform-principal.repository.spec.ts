import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration009 } from "../../../database/sqlite/migrations/009_create_platform_principals";
import { PlatformPrincipalRepository } from "../platform-principal.repository";

const VALID_BCRYPT_HASH = "$2b$12$a4qNLowNiYMqjgUx2Pa8D.ubXSEImfhQDmrsw.MYU80cl5Ge4FijK";

describe("PlatformPrincipalRepository", () => {
  let database: Database.Database;
  let repository: PlatformPrincipalRepository;

  beforeEach(() => {
    database = new Database(":memory:");
    migration009.up(database);
    repository = new PlatformPrincipalRepository(database);
  });

  afterEach(() => database.close());

  it("stores SYSTEM_OWNER outside the customer users table", () => {
    const owner = repository.createSystemOwner({
      id: "system-owner",
      username: "Platform.Owner",
      passwordHash: VALID_BCRYPT_HASH,
    });

    expect(owner).toEqual(
      expect.objectContaining({
        id: "system-owner",
        principal_type: "SYSTEM_OWNER",
        username: "platform.owner",
        status: "active",
      })
    );
    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'")
        .get()
    ).toBeUndefined();
  });

  it("enforces a single SYSTEM_OWNER record", () => {
    repository.createSystemOwner({
      id: "system-owner",
      username: "platform-owner",
      passwordHash: VALID_BCRYPT_HASH,
    });

    expect(() =>
      repository.createSystemOwner({
        id: "another-owner",
        username: "another-owner",
        passwordHash: VALID_BCRYPT_HASH,
      })
    ).toThrow("SYSTEM_OWNER already exists");
  });

  it("rejects non-bcrypt credential material", () => {
    expect(() =>
      repository.createSystemOwner({
        id: "system-owner",
        username: "platform-owner",
        passwordHash: "plaintext-password",
      })
    ).toThrow("Invalid bcrypt password hash");
  });

  it("finds owner credentials through normalized platform username", () => {
    repository.createSystemOwner({
      id: "system-owner",
      username: "platform-owner",
      passwordHash: VALID_BCRYPT_HASH,
    });

    expect(repository.findCredentialsByUsername(" PLATFORM-OWNER ")).toEqual(
      expect.objectContaining({
        id: "system-owner",
        principal_type: "SYSTEM_OWNER",
        username: "platform-owner",
      })
    );
  });
});

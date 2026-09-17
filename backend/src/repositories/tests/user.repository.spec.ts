import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration003 } from "../../../database/sqlite/migrations/003_create_users";
import { migration028 } from "../../../database/sqlite/migrations/028_create_password_recovery_domain";
import { UserRepository } from "../user.repository";

const VALID_BCRYPT_HASH = `$2b$12$${"A".repeat(53)}`;
const SECOND_VALID_BCRYPT_HASH = `$2a$13$${"B".repeat(53)}`;

describe("UserRepository", () => {
  let database: Database.Database;
  let repository: UserRepository;

  beforeEach(() => {
    database = new Database(":memory:");
    migration003.up(database);
    migration028.up(database);
    repository = new UserRepository(database);
  });

  afterEach(() => database.close());

  it("normalizes username and persists the approved active User defaults", () => {
    const id = repository.create({
      username: "  Admin.User  ",
      email: "admin@example.com",
      passwordHash: VALID_BCRYPT_HASH,
      role: "ADMIN",
    });

    expect(repository.findByUsername(" ADMIN.USER ")).toMatchObject({
      id,
      username: "admin.user",
      email: "admin@example.com",
      role: "ADMIN",
      status: "active",
      password_change_required: 0,
    });
  });

  it("updates password hashes and the forced-change state without returning the hash", () => {
    const id = repository.create({
      username: "operator",
      email: null,
      passwordHash: VALID_BCRYPT_HASH,
      role: "OPERATOR",
    });

    expect(repository.updatePasswordHash(id, SECOND_VALID_BCRYPT_HASH, true)).toBe(true);
    expect(repository.findById(id)).toMatchObject({ password_change_required: 1 });
    expect(repository.findByUsernameWithCredential("operator")?.password_hash).toBe(
      SECOND_VALID_BCRYPT_HASH
    );

    expect(repository.clearPasswordChangeRequired(id)).toBe(true);
    expect(repository.findById(id)).toMatchObject({ password_change_required: 0 });
  });
});

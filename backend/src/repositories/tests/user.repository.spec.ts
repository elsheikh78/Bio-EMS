import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration003 } from "../../../database/sqlite/migrations/003_create_users";
import { UserRepository } from "../user.repository";

const VALID_BCRYPT_HASH = `$2b$12$${"A".repeat(53)}`;
const SECOND_VALID_BCRYPT_HASH = `$2a$13$${"B".repeat(53)}`;

describe("UserRepository", () => {
  let database: Database.Database;
  let repository: UserRepository;

  beforeEach(() => {
    database = new Database(":memory:");
    migration003.up(database);
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
    });
    expect(repository.findByUsername(" ADMIN.USER ")).not.toHaveProperty("password_hash");
  });

  it.each(["ADMIN", "OPERATOR", "VIEWER"] as const)("accepts the approved %s role", (role) => {
    repository.create({
      username: `user-${role.toLowerCase()}`,
      passwordHash: VALID_BCRYPT_HASH,
      role,
    });

    expect(repository.findByUsername(`user-${role.toLowerCase()}`)?.role).toBe(role);
  });

  it("enforces uniqueness on the normalized username", () => {
    repository.create({
      username: "operator.one",
      passwordHash: VALID_BCRYPT_HASH,
      role: "OPERATOR",
    });

    expect(() =>
      repository.create({
        username: " OPERATOR.ONE ",
        passwordHash: SECOND_VALID_BCRYPT_HASH,
        role: "VIEWER",
      })
    ).toThrowError(expect.objectContaining({ code: "SQLITE_CONSTRAINT_UNIQUE" }));
  });

  it.each(["ab", "a".repeat(65), "user name", "user@name", "ümlaut"])(
    "rejects an invalid normalized username: %s",
    (username) => {
      expect(() =>
        repository.create({
          username,
          passwordHash: VALID_BCRYPT_HASH,
          role: "VIEWER",
        })
      ).toThrowError(expect.objectContaining({ code: "SQLITE_CONSTRAINT_CHECK" }));
    }
  );

  it.each(["abc", "a".repeat(64)])(
    "accepts a username at the %s-character boundary",
    (username) => {
      const id = repository.create({ username, passwordHash: VALID_BCRYPT_HASH, role: "VIEWER" });

      expect(repository.findByUsername(username)?.id).toBe(id);
    }
  );

  it("rejects roles and statuses outside the approved values", () => {
    expect(() =>
      repository.create({
        username: "invalid-role",
        passwordHash: VALID_BCRYPT_HASH,
        role: "OWNER" as "ADMIN",
      })
    ).toThrowError(expect.objectContaining({ code: "SQLITE_CONSTRAINT_CHECK" }));

    expect(() =>
      repository.create({
        username: "invalid-status",
        passwordHash: VALID_BCRYPT_HASH,
        role: "VIEWER",
        status: "pending" as "active",
      })
    ).toThrowError(expect.objectContaining({ code: "SQLITE_CONSTRAINT_CHECK" }));
  });

  it.each(["active", "disabled"] as const)("accepts the approved %s status", (status) => {
    repository.create({
      username: `status-${status}`,
      passwordHash: VALID_BCRYPT_HASH,
      role: "VIEWER",
      status,
    });

    expect(repository.findByUsername(`status-${status}`)?.status).toBe(status);
  });

  it.each([
    ["omitted", undefined],
    ["null", null],
    ["empty", ""],
  ])("persists an %s optional email consistently", (_case, email) => {
    repository.create({
      username: `email-${_case}`,
      email,
      passwordHash: VALID_BCRYPT_HASH,
      role: "VIEWER",
    });

    expect(repository.findByUsername(`email-${_case}`)?.email).toBe(email ?? null);
  });

  it.each([
    "",
    "PlaintextPassword1",
    "$2b$12$malformed",
    `$2b$11$${"A".repeat(53)}`,
    `$2x$12$${"A".repeat(53)}`,
  ])("rejects a non-compliant password hash", (passwordHash) => {
    expect(() =>
      repository.create({ username: "hash-user", passwordHash, role: "VIEWER" })
    ).toThrowError("Invalid bcrypt password hash");
  });

  it("returns only the numeric identifier from create", () => {
    const result = repository.create({
      username: "created-user",
      passwordHash: VALID_BCRYPT_HASH,
      role: "VIEWER",
    });

    expect(result).toBeTypeOf("number");
  });

  it("returns sanitized User rows without password hashes", () => {
    repository.create({
      username: "viewer.one",
      passwordHash: VALID_BCRYPT_HASH,
      role: "VIEWER",
      status: "disabled",
    });

    const users = repository.getAll();

    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({ username: "viewer.one", role: "VIEWER", status: "disabled" });
    expect(users[0]).not.toHaveProperty("password_hash");
  });

  it("returns a sanitized User from findByUsername", () => {
    repository.create({
      username: "lookup-user",
      passwordHash: VALID_BCRYPT_HASH,
      role: "VIEWER",
    });

    expect(repository.findByUsername(" LOOKUP-USER ")).not.toHaveProperty("password_hash");
  });

  it("finds a User by ID without exposing the password hash", () => {
    const id = repository.create({
      username: "id-lookup",
      passwordHash: VALID_BCRYPT_HASH,
      role: "OPERATOR",
    });

    expect(repository.findById(id)).toMatchObject({ id, username: "id-lookup", role: "OPERATOR" });
    expect(repository.findById(id)).not.toHaveProperty("password_hash");
    expect(repository.findById(id + 1)).toBeUndefined();
  });

  it("limits credential lookup to the internal authentication record", () => {
    repository.create({
      username: "auth-user",
      passwordHash: VALID_BCRYPT_HASH,
      role: "VIEWER",
    });

    expect(repository.findCredentialsByUsername(" AUTH-USER ")).toMatchObject({
      username: "auth-user",
      password_hash: VALID_BCRYPT_HASH,
    });
    expect(repository.findByUsername("auth-user")).not.toHaveProperty("password_hash");
  });

  it("updates email and role without exposing credentials", () => {
    const id = createUser("editable-admin", "ADMIN");
    createUser("backup-admin", "ADMIN");

    expect(
      repository.updateProfileAndRole(id, { email: "new@example.com", role: "OPERATOR" })
    ).toMatchObject({ id, email: "new@example.com", role: "OPERATOR" });
    expect(repository.findById(id)).not.toHaveProperty("password_hash");
  });

  it("rolls back demotion of the last active ADMIN", () => {
    const id = createUser("only-admin", "ADMIN");

    expect(() => repository.updateProfileAndRole(id, { role: "VIEWER" })).toThrowError(
      "Last active administrator"
    );
    expect(repository.findById(id)).toMatchObject({ role: "ADMIN", status: "active" });
  });

  it("rolls back disabling the last active ADMIN", () => {
    const id = createUser("only-admin", "ADMIN");

    expect(() => repository.updateStatus(id, "disabled")).toThrowError("Last active administrator");
    expect(repository.findById(id)).toMatchObject({ role: "ADMIN", status: "active" });
  });

  it("allows demotion and disablement when another active ADMIN remains", () => {
    const demoted = createUser("demoted-admin", "ADMIN");
    const disabled = createUser("disabled-admin", "ADMIN");
    createUser("remaining-admin", "ADMIN");

    expect(repository.updateProfileAndRole(demoted, { role: "OPERATOR" })?.role).toBe("OPERATOR");
    expect(repository.updateStatus(disabled, "disabled")?.status).toBe("disabled");
  });

  it("updates a password hash and preserves sanitized output", () => {
    const id = createUser("password-user", "VIEWER");

    expect(repository.updatePasswordHash(id, SECOND_VALID_BCRYPT_HASH)).not.toHaveProperty(
      "password_hash"
    );
    expect(repository.findCredentialsByUsername("password-user")?.password_hash).toBe(
      SECOND_VALID_BCRYPT_HASH
    );
  });

  it("returns undefined for missing update targets", () => {
    expect(repository.updateProfileAndRole(999, { role: "VIEWER" })).toBeUndefined();
    expect(repository.updateStatus(999, "disabled")).toBeUndefined();
    expect(repository.updatePasswordHash(999, SECOND_VALID_BCRYPT_HASH)).toBeUndefined();
  });

  function createUser(username: string, role: "ADMIN" | "OPERATOR" | "VIEWER"): number {
    return repository.create({ username, passwordHash: VALID_BCRYPT_HASH, role });
  }
});

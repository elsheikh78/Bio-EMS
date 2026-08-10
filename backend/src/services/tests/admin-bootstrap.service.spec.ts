import bcrypt from "bcrypt";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration003 } from "../../../database/sqlite/migrations/003_create_users";
import { UserRepository } from "../../repositories/user.repository";
import {
  bootstrapAdmin,
  BootstrapAdminError,
  readBootstrapAdminEnvironment,
} from "../admin-bootstrap.service";

const VALID_PASSWORD = "SecurePassword1";

describe("secure ADMIN bootstrap", () => {
  let database: Database.Database;
  let repository: UserRepository;
  let messages: string[];

  beforeEach(() => {
    database = new Database(":memory:");
    migration003.up(database);
    repository = new UserRepository(database);
    messages = [];
  });

  afterEach(() => database.close());

  it("creates the first normalized active ADMIN with a bcrypt hash", async () => {
    const id = await bootstrapAdmin(
      {
        username: "  Primary.Admin  ",
        password: VALID_PASSWORD,
        email: "admin@example.com",
      },
      { userRepository: repository, logger: { info: (message) => messages.push(message) } }
    );

    expect(repository.findByUsername("primary.admin")).toMatchObject({
      id,
      username: "primary.admin",
      email: "admin@example.com",
      role: "ADMIN",
      status: "active",
    });
    expect(repository.findByUsername("primary.admin")).not.toHaveProperty("password_hash");

    const stored = database.prepare("SELECT password_hash FROM users WHERE id = ?").get(id) as {
      password_hash: string;
    };
    expect(stored.password_hash).not.toBe(VALID_PASSWORD);
    await expect(bcrypt.compare(VALID_PASSWORD, stored.password_hash)).resolves.toBe(true);
    expect(messages).toEqual(["Bootstrap administrator created"]);
    expect(messages.join(" ")).not.toContain(VALID_PASSWORD);
    expect(messages.join(" ")).not.toContain(stored.password_hash);
  });

  it("stores null when the optional email is omitted", async () => {
    await bootstrapAdmin(
      { username: "admin", password: VALID_PASSWORD },
      { userRepository: repository, logger: { info: (message) => messages.push(message) } }
    );

    expect(repository.findByUsername("admin")?.email).toBeNull();
  });

  it("fails safely on repeated execution without overwriting the existing User", async () => {
    const dependencies = {
      userRepository: repository,
      logger: { info: (message: string) => messages.push(message) },
    };
    const id = await bootstrapAdmin({ username: "admin", password: VALID_PASSWORD }, dependencies);
    const before = database.prepare("SELECT * FROM users WHERE id = ?").get(id);

    await expect(
      bootstrapAdmin({ username: "admin", password: "DifferentPassword2" }, dependencies)
    ).rejects.toEqual(new BootstrapAdminError());

    expect(database.prepare("SELECT * FROM users WHERE id = ?").get(id)).toEqual(before);
    expect(database.prepare("SELECT COUNT(*) AS count FROM users").get()).toEqual({ count: 1 });
  });

  it("does not create another ADMIN when any User already exists", async () => {
    repository.create({
      username: "existing-user",
      passwordHash: await bcrypt.hash(VALID_PASSWORD, 12),
      role: "VIEWER",
    });

    await expect(
      bootstrapAdmin(
        { username: "different-admin", password: VALID_PASSWORD },
        { userRepository: repository, logger: { info: (message) => messages.push(message) } }
      )
    ).rejects.toEqual(new BootstrapAdminError());
    expect(database.prepare("SELECT COUNT(*) AS count FROM users").get()).toEqual({ count: 1 });
  });

  it.each([
    {},
    { BIOEMS_BOOTSTRAP_ADMIN_USERNAME: "admin" },
    { BIOEMS_BOOTSTRAP_ADMIN_PASSWORD: VALID_PASSWORD },
  ])("rejects missing required environment without exposing input", (environment) => {
    expect(() => readBootstrapAdminEnvironment(environment)).toThrowError(
      "Administrator bootstrap failed"
    );
  });

  it("reads approved environment variables without changing the password", () => {
    expect(
      readBootstrapAdminEnvironment({
        BIOEMS_BOOTSTRAP_ADMIN_USERNAME: " Admin ",
        BIOEMS_BOOTSTRAP_ADMIN_PASSWORD: ` ${VALID_PASSWORD} `,
        BIOEMS_BOOTSTRAP_ADMIN_EMAIL: "admin@example.com",
      })
    ).toEqual({
      username: " Admin ",
      password: ` ${VALID_PASSWORD} `,
      email: "admin@example.com",
    });
  });

  it("leaves no partial User and emits no success log after invalid input", async () => {
    await expect(
      bootstrapAdmin(
        { username: "invalid user", password: VALID_PASSWORD },
        { userRepository: repository, logger: { info: (message) => messages.push(message) } }
      )
    ).rejects.toEqual(new BootstrapAdminError());

    expect(database.prepare("SELECT COUNT(*) AS count FROM users").get()).toEqual({ count: 0 });
    expect(messages).toEqual([]);
  });

  it("does not expose a weak password through errors or logs", async () => {
    const password = "weak";

    await expect(
      bootstrapAdmin(
        { username: "admin", password },
        { userRepository: repository, logger: { info: (message) => messages.push(message) } }
      )
    ).rejects.toEqual(new BootstrapAdminError());

    expect(messages.join(" ")).not.toContain(password);
    expect(database.prepare("SELECT COUNT(*) AS count FROM users").get()).toEqual({ count: 0 });
  });
});

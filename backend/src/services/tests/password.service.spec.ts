import bcrypt from "bcrypt";
import { describe, expect, it, vi } from "vitest";
import {
  BCRYPT_COST,
  hashPassword,
  PasswordPolicyError,
  verifyPassword,
} from "../password.service";

const VALID_PASSWORD = "SecurePassword1";

describe("password service", () => {
  it("creates salted bcrypt hashes at the approved cost", async () => {
    const first = await hashPassword(VALID_PASSWORD);
    const second = await hashPassword(VALID_PASSWORD);

    expect(first).toMatch(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/);
    expect(bcrypt.getRounds(first)).toBeGreaterThanOrEqual(BCRYPT_COST);
    expect(second).not.toBe(first);
    expect(first).not.toContain(VALID_PASSWORD);
  });

  it("verifies the correct password and rejects the wrong password", async () => {
    const passwordHash = await hashPassword(VALID_PASSWORD);

    await expect(verifyPassword(VALID_PASSWORD, passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("WrongPassword1", passwordHash)).resolves.toBe(false);
  });

  it("verifies legacy weak passwords without applying creation complexity rules", async () => {
    const weakPassword = "x";
    const passwordHash = await bcrypt.hash(weakPassword, BCRYPT_COST);

    await expect(verifyPassword(weakPassword, passwordHash)).resolves.toBe(true);
    await expect(verifyPassword(`${"A".repeat(71)}a1`, passwordHash)).resolves.toBe(false);
  });

  it.each([
    "",
    "Short1A",
    "alllowercase1",
    "ALLUPPERCASE1",
    "NoNumberPassword",
    `${"A".repeat(71)}a1`,
    `${"😀".repeat(8)}Aa1`,
  ])("rejects a password outside the approved policy", async (password) => {
    await expect(hashPassword(password)).rejects.toBeInstanceOf(PasswordPolicyError);
  });

  it("accepts passwords at the approved length and UTF-8 byte boundaries", async () => {
    await expect(hashPassword("Abcdefghij1K")).resolves.toMatch(/^\$2[aby]\$/);
    await expect(hashPassword(`${"A".repeat(70)}a1`)).resolves.toMatch(/^\$2[aby]\$/);
  });

  it("does not trim or otherwise modify password input", async () => {
    const password = " SecurePassword1 ";
    const passwordHash = await hashPassword(password);

    await expect(verifyPassword(password, passwordHash)).resolves.toBe(true);
    await expect(verifyPassword(password.trim(), passwordHash)).resolves.toBe(false);
  });

  it.each(["", "plaintext", "$2b$12$malformed", `$2b$11$${"A".repeat(53)}`])(
    "rejects malformed or non-compliant hashes safely",
    async (passwordHash) => {
      await expect(verifyPassword(VALID_PASSWORD, passwordHash)).resolves.toBe(false);
    }
  );

  it("does not log passwords or hashes", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const passwordHash = await hashPassword(VALID_PASSWORD);
    await verifyPassword(VALID_PASSWORD, passwordHash);

    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    log.mockRestore();
    error.mockRestore();
  });
});

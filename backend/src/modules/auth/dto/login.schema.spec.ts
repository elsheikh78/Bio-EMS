import { describe, expect, it } from "vitest";
import { loginSchema } from "./login.schema";

describe("Login request schema", () => {
  it("normalizes username and preserves password byte-for-byte", () => {
    expect(loginSchema.parse({ username: " Admin.User ", password: " weak password " })).toEqual({
      username: "admin.user",
      password: " weak password ",
    });
  });

  it.each(["ab", "a".repeat(65), "invalid user", "user@example"])(
    "rejects an invalid username",
    (username) => {
      expect(loginSchema.safeParse({ username, password: "password" }).success).toBe(false);
    }
  );

  it.each([
    {},
    { username: "admin" },
    { password: "password" },
    { username: 1, password: "password" },
    { username: "admin", password: 1 },
    { username: "admin", password: "password", unknown: true },
  ])("rejects missing, malformed, or unknown fields", (input) => {
    expect(loginSchema.safeParse(input).success).toBe(false);
  });

  it("accepts weak non-empty passwords within 72 UTF-8 bytes", () => {
    expect(loginSchema.parse({ username: "admin", password: "x" }).password).toBe("x");
  });

  it("enforces empty and UTF-8 byte limits", () => {
    expect(loginSchema.safeParse({ username: "admin", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ username: "admin", password: "😀".repeat(18) }).success).toBe(
      true
    );
    expect(
      loginSchema.safeParse({ username: "admin", password: `${"😀".repeat(18)}a` }).success
    ).toBe(false);
  });
});

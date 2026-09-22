import { describe, expect, it } from "vitest";
import { platformLoginSchema } from "./platform-login.schema";

describe("platform login schema", () => {
  it("accepts a six-digit authenticator code", () => {
    expect(
      platformLoginSchema.safeParse({
        username: "system-owner",
        password: "OwnerPassword2026",
        code: "123456",
      }).success
    ).toBe(true);
  });

  it.each(["12345", "1234567", "12a456", "\\dddddd"])(
    "rejects invalid authenticator code %s",
    (code) => {
      expect(
        platformLoginSchema.safeParse({
          username: "system-owner",
          password: "OwnerPassword2026",
          code,
        }).success
      ).toBe(false);
    }
  );
});

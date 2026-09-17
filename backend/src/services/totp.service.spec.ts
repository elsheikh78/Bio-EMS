import { describe, expect, it } from "vitest";
import { buildTotpUri, generateTotpCode, generateTotpSecret, verifyTotpCode } from "./totp.service";

describe("TOTP service", () => {
  it("generates RFC 6238 compatible time-based codes", () => {
    const secret = "JBSWY3DPEHPK3PXP";
    const at = new Date("2026-09-14T12:00:00.000Z");
    const code = generateTotpCode(secret, at);
    expect(code).toMatch(/^\d{6}$/);
    expect(verifyTotpCode(secret, code, at, 0)).toBe(true);
    expect(verifyTotpCode(secret, code, new Date(at.getTime() + 60_000), 0)).toBe(false);
  });

  it("creates high-entropy secrets and a standard enrollment URI", () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(buildTotpUri(secret, "system-owner")).toContain("otpauth://totp/BIO-EMS%3Asystem-owner");
  });

  it("rejects malformed codes without throwing", () => {
    expect(verifyTotpCode("JBSWY3DPEHPK3PXP", "12-456")).toBe(false);
  });
});

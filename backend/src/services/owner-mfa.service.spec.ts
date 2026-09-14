import { randomBytes } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { decryptMfaSecret } from "./owner-mfa-crypto.service";
import {
  OwnerMfaRepository,
  OwnerMfaService,
  OwnerMfaState,
} from "./owner-mfa.service";
import { generateTotpCode } from "./totp.service";

function fixture() {
  const state: OwnerMfaState = {
    username: "system-owner",
    mfa_secret_encrypted: null,
    mfa_enabled_at: null,
  };
  const repository: OwnerMfaRepository = {
    findMfaState: vi.fn(() => ({ ...state })),
    beginMfaEnrollment: vi.fn((_id, encrypted) => {
      if (state.mfa_secret_encrypted) return false;
      state.mfa_secret_encrypted = encrypted;
      return true;
    }),
    enableMfa: vi.fn(() => {
      if (!state.mfa_secret_encrypted || state.mfa_enabled_at) return false;
      state.mfa_enabled_at = "2026-09-14T12:00:00.000Z";
      return true;
    }),
  };
  const key = randomBytes(32);
  const now = new Date("2026-09-14T12:00:00.000Z");
  const secret = "JBSWY3DPEHPK3PXP";
  const service = new OwnerMfaService(repository, key, () => now, () => secret);
  return { state, repository, key, now, secret, service };
}

describe("OwnerMfaService", () => {
  it("stores only an encrypted secret and returns one-time enrollment material", () => {
    const { state, key, secret, service } = fixture();
    const enrollment = service.beginEnrollment("owner");

    expect(enrollment.secret).toBe(secret);
    expect(enrollment.otpauthUri).toContain("otpauth://totp/");
    expect(state.mfa_secret_encrypted).not.toContain(secret);
    expect(decryptMfaSecret(state.mfa_secret_encrypted!, key)).toBe(secret);
  });

  it("does not enable MFA until a valid current TOTP code is confirmed", () => {
    const { state, repository, now, secret, service } = fixture();
    service.beginEnrollment("owner");

    expect(() => service.confirmEnrollment("owner", "000000")).toThrow(
      /Invalid MFA verification code/
    );
    expect(repository.enableMfa).not.toHaveBeenCalled();

    service.confirmEnrollment("owner", generateTotpCode(secret, now));
    expect(state.mfa_enabled_at).toBeTruthy();
    expect(repository.enableMfa).toHaveBeenCalledTimes(1);
  });

  it("prevents replacement or replay of enrollment after a secret exists", () => {
    const { service } = fixture();
    service.beginEnrollment("owner");

    expect(() => service.beginEnrollment("owner")).toThrow(/unavailable/);
    service.confirmEnrollment(
      "owner",
      generateTotpCode("JBSWY3DPEHPK3PXP", new Date("2026-09-14T12:00:00.000Z"))
    );
    expect(() => service.confirmEnrollment("owner", "123456")).toThrow(/unavailable/);
  });

  it("verifies login codes only after MFA activation", () => {
    const { state, now, secret, service } = fixture();
    service.beginEnrollment("owner");
    const code = generateTotpCode(secret, now);

    expect(service.verifyLoginCode(state, code)).toBe(false);
    service.confirmEnrollment("owner", code);
    expect(service.verifyLoginCode(state, code)).toBe(true);
  });
});

import { describe, expect, it, vi } from "vitest";
import { hashPassword } from "../password.service";
import { PlatformAuthService } from "../platform-auth.service";

const tokenIssuer = {
  issueAccessToken: vi.fn(() => ({ accessToken: "platform-token", expiresIn: 900 })),
  issueMfaEnrollmentToken: vi.fn(() => ({
    enrollmentToken: "enrollment-token",
    expiresIn: 300,
  })),
};

describe("platform authentication service", () => {
  it("returns only a short-lived enrollment token before owner MFA activation", async () => {
    const passwordHash = await hashPassword("OwnerPassword1");
    const repository = {
      findCredentialsByUsername: vi.fn(() => ({
        id: "system-owner",
        principal_type: "SYSTEM_OWNER" as const,
        username: "platform-owner",
        password_hash: passwordHash,
        status: "active" as const,
        created_at: "2026-08-24T00:00:00.000Z",
        updated_at: null,
      })),
    };

    const response = await new PlatformAuthService(repository, tokenIssuer).login({
      username: "platform-owner",
      password: "OwnerPassword1",
    });

    expect(response).toEqual({
      mfa_enrollment_required: true,
      enrollment_token: "enrollment-token",
      token_type: "bearer",
      expires_in: 300,
    });
    expect(tokenIssuer.issueMfaEnrollmentToken).toHaveBeenCalledWith({
      kind: "platform",
      type: "SYSTEM_OWNER",
      id: "system-owner",
      username: "platform-owner",
    });
    expect(tokenIssuer.issueAccessToken).not.toHaveBeenCalled();
  });

  it.each([
    ["missing principal", undefined],
    [
      "disabled principal",
      {
        id: "system-owner",
        principal_type: "SYSTEM_OWNER" as const,
        username: "platform-owner",
        password_hash: "$2b$12$a4qNLowNiYMqjgUx2Pa8D.ubXSEImfhQDmrsw.MYU80cl5Ge4FijK",
        status: "disabled" as const,
        created_at: "2026-08-24T00:00:00.000Z",
        updated_at: null,
      },
    ],
  ])("rejects %s without issuing a token", async (_case, credentials) => {
    const repository = { findCredentialsByUsername: vi.fn(() => credentials) };
    const issuer = {
      issueAccessToken: vi.fn(() => ({ accessToken: "x", expiresIn: 900 })),
      issueMfaEnrollmentToken: vi.fn(() => ({
        enrollmentToken: "enrollment-token",
        expiresIn: 300,
      })),
    };

    await expect(
      new PlatformAuthService(repository, issuer).login({
        username: "platform-owner",
        password: "WrongPassword1",
      })
    ).rejects.toMatchObject({ statusCode: 401, code: "INVALID_CREDENTIALS" });
    expect(issuer.issueAccessToken).not.toHaveBeenCalled();
  });

  it("rejects an invalid password without leaking credential state", async () => {
    const passwordHash = await hashPassword("OwnerPassword1");
    const repository = {
      findCredentialsByUsername: vi.fn(() => ({
        id: "system-owner",
        principal_type: "SYSTEM_OWNER" as const,
        username: "platform-owner",
        password_hash: passwordHash,
        status: "active" as const,
        created_at: "2026-08-24T00:00:00.000Z",
        updated_at: null,
      })),
    };
    const issuer = {
      issueAccessToken: vi.fn(() => ({ accessToken: "x", expiresIn: 900 })),
      issueMfaEnrollmentToken: vi.fn(() => ({
        enrollmentToken: "enrollment-token",
        expiresIn: 300,
      })),
    };

    await expect(
      new PlatformAuthService(repository, issuer).login({
        username: "platform-owner",
        password: "WrongPassword1",
      })
    ).rejects.toMatchObject({ statusCode: 401, code: "INVALID_CREDENTIALS" });
    expect(issuer.issueAccessToken).not.toHaveBeenCalled();
  });
  it("rejects a locked owner and records failures without issuing a token", async () => {
    const passwordHash = await hashPassword("OwnerPassword1");
    const recordFailedLogin = vi.fn();
    const repository = {
      findCredentialsByUsername: vi.fn(() => ({
        id: "system-owner",
        principal_type: "SYSTEM_OWNER" as const,
        username: "platform-owner",
        password_hash: passwordHash,
        status: "active" as const,
        created_at: "2026-08-24T00:00:00.000Z",
        updated_at: null,
        locked_until: "2026-09-14T12:15:00.000Z",
      })),
      recordFailedLogin,
    };
    const issuer = {
      issueAccessToken: vi.fn(() => ({ accessToken: "x", expiresIn: 900 })),
      issueMfaEnrollmentToken: vi.fn(() => ({
        enrollmentToken: "enrollment-token",
        expiresIn: 300,
      })),
    };

    await expect(
      new PlatformAuthService(repository, issuer, () => new Date("2026-09-14T12:00:00.000Z")).login(
        { username: "platform-owner", password: "OwnerPassword1" }
      )
    ).rejects.toMatchObject({ statusCode: 401, code: "INVALID_CREDENTIALS" });
    expect(recordFailedLogin).not.toHaveBeenCalled();
    expect(issuer.issueAccessToken).not.toHaveBeenCalled();
  });

  it("clears accumulated failures after successful authentication", async () => {
    const passwordHash = await hashPassword("OwnerPassword1");
    const clearFailedLogins = vi.fn();
    const repository = {
      findCredentialsByUsername: vi.fn(() => ({
        id: "system-owner",
        principal_type: "SYSTEM_OWNER" as const,
        username: "platform-owner",
        password_hash: passwordHash,
        status: "active" as const,
        created_at: "2026-08-24T00:00:00.000Z",
        updated_at: null,
        failed_login_count: 2,
        locked_until: null,
      })),
      clearFailedLogins,
    };

    await new PlatformAuthService(repository, tokenIssuer).login({
      username: "platform-owner",
      password: "OwnerPassword1",
    });

    expect(clearFailedLogins).toHaveBeenCalledWith("system-owner", expect.any(Date));
  });
  it("persists the issued token in a matching revocable session", async () => {
    const passwordHash = await hashPassword("OwnerPassword1");
    const repository = {
      findCredentialsByUsername: vi.fn(() => ({
        id: "system-owner",
        principal_type: "SYSTEM_OWNER" as const,
        username: "platform-owner",
        password_hash: passwordHash,
        status: "active" as const,
        created_at: "2026-08-24T00:00:00.000Z",
        updated_at: null,
        mfa_secret_encrypted: "v1.encrypted",
        mfa_enabled_at: "2026-09-14T11:00:00.000Z",
      })),
    };
    const sessions = { create: vi.fn(() => ({ id: "session-id" })) };
    const mfa = { verifyLoginCode: vi.fn(() => true) };
    const now = new Date("2026-09-14T12:00:00.000Z");

    await new PlatformAuthService(repository, tokenIssuer, () => now, sessions, mfa).login(
      { username: "platform-owner", password: "OwnerPassword1", code: "123456" },
      { ipAddress: "127.0.0.1", userAgent: "test" }
    );

    expect(sessions.create).toHaveBeenCalledWith(
      "system-owner",
      "platform-token",
      new Date("2026-09-14T12:15:00.000Z"),
      { ipAddress: "127.0.0.1", userAgent: "test" },
      expect.any(String)
    );
  });
  it("requires a valid TOTP code after owner MFA activation", async () => {
    const passwordHash = await hashPassword("OwnerPassword1");
    const recordFailedLogin = vi.fn();
    const clearFailedLogins = vi.fn();
    const repository = {
      findCredentialsByUsername: vi.fn(() => ({
        id: "system-owner",
        principal_type: "SYSTEM_OWNER" as const,
        username: "platform-owner",
        password_hash: passwordHash,
        status: "active" as const,
        created_at: "2026-08-24T00:00:00.000Z",
        updated_at: null,
        mfa_secret_encrypted: "v1.encrypted",
        mfa_enabled_at: "2026-09-14T11:00:00.000Z",
      })),
      recordFailedLogin,
      clearFailedLogins,
    };
    const issuer = {
      issueAccessToken: vi.fn(() => ({ accessToken: "x", expiresIn: 900 })),
      issueMfaEnrollmentToken: vi.fn(() => ({
        enrollmentToken: "enrollment-token",
        expiresIn: 300,
      })),
    };
    const mfa = { verifyLoginCode: vi.fn((_state: unknown, code: string) => code === "123456") };
    const service = new PlatformAuthService(repository, issuer, () => new Date(), undefined, mfa);

    await expect(
      service.login({ username: "platform-owner", password: "OwnerPassword1" })
    ).rejects.toMatchObject({ statusCode: 401, code: "OWNER_MFA_REQUIRED" });
    await expect(
      service.login({
        username: "platform-owner",
        password: "OwnerPassword1",
        code: "000000",
      })
    ).rejects.toMatchObject({ statusCode: 401, code: "OWNER_MFA_REQUIRED" });
    expect(issuer.issueAccessToken).not.toHaveBeenCalled();
    expect(recordFailedLogin).toHaveBeenCalledTimes(2);

    await expect(
      service.login({
        username: "platform-owner",
        password: "OwnerPassword1",
        code: "123456",
      })
    ).resolves.toMatchObject({ access_token: "x" });
    expect(clearFailedLogins).toHaveBeenCalled();
  });
});

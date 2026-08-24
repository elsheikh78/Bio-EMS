import { describe, expect, it, vi } from "vitest";
import { hashPassword } from "../password.service";
import { PlatformAuthService } from "../platform-auth.service";

const tokenIssuer = {
  issueAccessToken: vi.fn(() => ({ accessToken: "platform-token", expiresIn: 900 })),
};

describe("platform authentication service", () => {
  it("authenticates an active SYSTEM_OWNER and returns a platform principal", async () => {
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
      access_token: "platform-token",
      token_type: "bearer",
      expires_in: 900,
      principal: {
        kind: "platform",
        type: "SYSTEM_OWNER",
        id: "system-owner",
        username: "platform-owner",
      },
    });
    expect(tokenIssuer.issueAccessToken).toHaveBeenCalledWith(response.principal);
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
    const issuer = { issueAccessToken: vi.fn(() => ({ accessToken: "x", expiresIn: 900 })) };

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
    const issuer = { issueAccessToken: vi.fn(() => ({ accessToken: "x", expiresIn: 900 })) };

    await expect(
      new PlatformAuthService(repository, issuer).login({
        username: "platform-owner",
        password: "WrongPassword1",
      })
    ).rejects.toMatchObject({ statusCode: 401, code: "INVALID_CREDENTIALS" });
    expect(issuer.issueAccessToken).not.toHaveBeenCalled();
  });
});

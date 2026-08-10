import bcrypt from "bcrypt";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../errors/app-error";
import { UserCredentialRecord } from "../../entities/User";
import { AuthService, AuthUserRepository, AccessTokenIssuer } from "../auth.service";

const PASSWORD = "CurrentPassword1";
let passwordHash: string;

const activeUser = (): UserCredentialRecord => ({
  id: 1,
  username: "admin",
  email: null,
  password_hash: passwordHash,
  role: "ADMIN",
  status: "active",
  created_at: "2026-08-10 00:00:00",
  updated_at: null,
});

describe("AuthService Login", () => {
  const findCredentialsByUsername = vi.fn<AuthUserRepository["findCredentialsByUsername"]>();
  const issueAccessToken = vi.fn<AccessTokenIssuer["issueAccessToken"]>();
  const service = new AuthService({ findCredentialsByUsername }, { issueAccessToken });

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(PASSWORD, 12);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    issueAccessToken.mockReturnValue({ accessToken: "signed-token", expiresIn: 1800 });
  });

  it("returns the approved sanitized contract for an active User", async () => {
    findCredentialsByUsername.mockReturnValue(activeUser());

    await expect(service.login({ username: "admin", password: PASSWORD })).resolves.toEqual({
      access_token: "signed-token",
      token_type: "bearer",
      expires_in: 1800,
      user: { id: 1, username: "admin", role: "ADMIN" },
    });
    expect(findCredentialsByUsername).toHaveBeenCalledWith("admin");
    expect(issueAccessToken).toHaveBeenCalledWith(1);
  });

  it.each([
    ["unknown username", undefined, PASSWORD],
    ["wrong password", activeUser(), "WrongPassword1"],
    ["inactive User", { ...activeUser(), status: "disabled" as const }, PASSWORD],
  ])("uses one generic failure for %s", async (_case, credentials, password) => {
    findCredentialsByUsername.mockReturnValue(credentials);

    const failure = service.login({ username: "admin", password });
    await expect(failure).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
      message: "Invalid credentials",
    } satisfies Partial<AppError>);
    expect(issueAccessToken).not.toHaveBeenCalled();
  });

  it("performs a bcrypt comparison for an unknown username", async () => {
    const compare = vi.spyOn(bcrypt, "compare");
    findCredentialsByUsername.mockReturnValue(undefined);

    await expect(service.login({ username: "missing", password: "x" })).rejects.toBeInstanceOf(
      AppError
    );
    expect(compare).toHaveBeenCalledTimes(1);
    compare.mockRestore();
  });

  it("does not log credentials, hashes, tokens, or secrets", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    findCredentialsByUsername.mockReturnValue(activeUser());

    const response = await service.login({ username: "admin", password: PASSWORD });

    expect(response).not.toHaveProperty("password_hash");
    expect(response.user).not.toHaveProperty("password_hash");
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    log.mockRestore();
    error.mockRestore();
  });
});

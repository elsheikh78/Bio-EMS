import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const findByUsername = vi.fn();
const updatePasswordHash = vi.fn();
const hashPassword = vi.fn();
const recordAudit = vi.fn();

vi.mock("../../database/sqlite/client", () => ({ sqlite: {} }));
vi.mock("../repositories/user.repository", () => ({
  UserRepository: vi.fn().mockImplementation(() => ({
    findByUsername,
    updatePasswordHash,
  })),
}));
vi.mock("../repositories/audit-event.repository", () => ({
  AuditEventRepository: vi.fn(),
}));
vi.mock("../services/audit-event.service", () => ({
  AuditEventService: vi.fn().mockImplementation(() => ({ record: recordAudit })),
}));
vi.mock("../services/password.service", () => ({ hashPassword }));

import { recoverAdminPassword } from "./recover-admin-password";

describe("local ADMIN password recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findByUsername.mockReturnValue({
      id: 7,
      username: "admin",
      role: "ADMIN",
      status: "active",
    });
    hashPassword.mockResolvedValue("$2b$12$recoveryhash");
    updatePasswordHash.mockReturnValue({ id: 7 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("forces a password change and records a secret-free audit event", async () => {
    const password = "TemporaryRecovery1";

    await recoverAdminPassword({
      BIOEMS_RECOVERY_ADMIN_USERNAME: "admin",
      BIOEMS_RECOVERY_ADMIN_PASSWORD: password,
    });

    expect(hashPassword).toHaveBeenCalledWith(password);
    expect(updatePasswordHash).toHaveBeenCalledWith(7, "$2b$12$recoveryhash", true);
    expect(recordAudit).toHaveBeenCalledTimes(1);

    const event = recordAudit.mock.calls[0]?.[0];
    expect(event).toMatchObject({
      action: "ADMIN_PASSWORD_RECOVERY",
      target: { type: "USER", id: "7" },
      result: "SUCCESS",
      requestContext: { source: "LOCAL_ADMIN_RECOVERY" },
    });
    expect(JSON.stringify(event)).not.toContain(password);
    expect(JSON.stringify(event)).not.toContain("$2b$12$recoveryhash");
  });

  it("rejects missing recovery credentials before hashing", async () => {
    await expect(
      recoverAdminPassword({ BIOEMS_RECOVERY_ADMIN_USERNAME: "admin" })
    ).rejects.toThrow("Administrator recovery credentials are required");
    expect(hashPassword).not.toHaveBeenCalled();
    expect(updatePasswordHash).not.toHaveBeenCalled();
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it("rejects non-admin, disabled, or unknown accounts", async () => {
    for (const account of [
      { id: 8, username: "operator", role: "OPERATOR", status: "active" },
      { id: 7, username: "admin", role: "ADMIN", status: "disabled" },
      undefined,
    ]) {
      findByUsername.mockReturnValueOnce(account);
      await expect(
        recoverAdminPassword({
          BIOEMS_RECOVERY_ADMIN_USERNAME: "admin",
          BIOEMS_RECOVERY_ADMIN_PASSWORD: "TemporaryRecovery1",
        })
      ).rejects.toThrow("Active administrator account was not found");
    }

    expect(hashPassword).not.toHaveBeenCalled();
    expect(updatePasswordHash).not.toHaveBeenCalled();
    expect(recordAudit).not.toHaveBeenCalled();
  });
});

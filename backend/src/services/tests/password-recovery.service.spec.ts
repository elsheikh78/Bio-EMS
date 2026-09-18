import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../../entities/User";
import type {
  PasswordRecoveryRepository,
  PasswordRecoveryRequest,
} from "../../repositories/password-recovery.repository";
import type { UserRepository } from "../../repositories/user.repository";
import { PasswordRecoveryService } from "../password-recovery.service";

vi.mock("../../../database/sqlite/client", () => ({
  sqlite: {
    transaction: (work: () => unknown) => () => work(),
  },
}));

const REQUEST_ID = "11111111-1111-4111-8111-111111111111";
const NEW_PASSWORD = "NewPassword1!";

const user = (overrides: Partial<User> = {}): User => ({
  id: 7,
  username: "operator",
  email: null,
  role: "OPERATOR",
  status: "active",
  password_change_required: 0,
  created_at: "2026-09-17 00:00:00",
  updated_at: null,
  ...overrides,
});

const request = (overrides: Partial<PasswordRecoveryRequest> = {}): PasswordRecoveryRequest => ({
  request_id: REQUEST_ID,
  principal_type: "USER",
  principal_id: 7,
  username_hint: "operator",
  installation_id: null,
  challenge_hash: "must-never-leave-service",
  status: "PENDING",
  requested_at: "2026-09-17 00:00:00",
  expires_at: "2099-09-17 00:30:00",
  approved_at: null,
  consumed_at: null,
  ...overrides,
});

describe("PasswordRecoveryService customer recovery", () => {
  const users = {
    findByUsername: vi.fn(),
    findById: vi.fn(),
    updatePasswordHash: vi.fn(),
    findCredentialsByUsername: vi.fn(),
  };
  const recovery = {
    createUserRequest: vi.fn(),
    recordAudit: vi.fn(),
    listPendingUserRequests: vi.fn(),
    findPendingUserRequest: vi.fn(),
    consume: vi.fn(),
  };
  const service = new PasswordRecoveryService(
    users as unknown as UserRepository,
    recovery as unknown as PasswordRecoveryRepository
  );

  beforeEach(() => {
    vi.clearAllMocks();
    recovery.createUserRequest.mockReturnValue(REQUEST_ID);
    recovery.consume.mockReturnValue(true);
  });

  it("returns only safe pending recovery request fields", () => {
    recovery.listPendingUserRequests.mockReturnValue([request()]);

    const result = service.listPendingCustomerRecoveryRequests();

    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty("challenge_hash");
    expect(result[0]).toMatchObject({
      request_id: REQUEST_ID,
      principal_type: "USER",
      principal_id: 7,
      username_hint: "operator",
      status: "PENDING",
    });
  });

  it("records a customer recovery request for an active non-admin user", () => {
    users.findByUsername.mockReturnValue(user());

    expect(service.requestCustomerRecovery(" Operator ")).toMatchObject({ accepted: true });
    expect(users.findByUsername).toHaveBeenCalledWith("operator");
    expect(recovery.createUserRequest).toHaveBeenCalledWith(
      expect.objectContaining({ principalId: 7, usernameHint: "operator" })
    );
    expect(recovery.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "PASSWORD_RECOVERY_REQUESTED",
        requestId: REQUEST_ID,
        principalType: "USER",
        principalId: 7,
        actorType: "PUBLIC",
        outcome: "SUCCESS",
      })
    );
  });

  it.each([
    ["missing account", undefined],
    ["disabled account", user({ status: "disabled" })],
    ["admin account", user({ role: "ADMIN" })],
  ])("keeps forgot-password generic and creates no request for %s", (_case, account) => {
    users.findByUsername.mockReturnValue(account);

    expect(service.requestCustomerRecovery("operator")).toMatchObject({ accepted: true });
    expect(recovery.createUserRequest).not.toHaveBeenCalled();
    expect(recovery.recordAudit).not.toHaveBeenCalled();
  });

  it("resets the selected active non-admin user, forces password change, consumes and audits", async () => {
    recovery.findPendingUserRequest.mockReturnValue(request());
    users.findById.mockReturnValue(user());
    users.updatePasswordHash.mockReturnValue(user({ password_change_required: 1 }));

    await expect(
      service.resetCustomerPasswordFromRecoveryRequest(REQUEST_ID, NEW_PASSWORD, 3)
    ).resolves.toEqual({ request_id: REQUEST_ID, principal_id: 7, status: "CONSUMED" });

    expect(users.updatePasswordHash).toHaveBeenCalledWith(
      7,
      expect.stringMatching(/^\$2[aby]\$12\$/),
      true
    );
    expect(recovery.consume).toHaveBeenCalledWith(REQUEST_ID);
    expect(recovery.recordAudit).toHaveBeenCalledWith({
      eventType: "PASSWORD_RECOVERY_CONSUMED",
      requestId: REQUEST_ID,
      principalType: "USER",
      principalId: 7,
      actorType: "ADMIN",
      actorId: "3",
      outcome: "SUCCESS",
    });
  });

  it("rejects a request that is not active", async () => {
    recovery.findPendingUserRequest.mockReturnValue(undefined);

    await expect(
      service.resetCustomerPasswordFromRecoveryRequest(REQUEST_ID, NEW_PASSWORD, 3)
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "PASSWORD_RECOVERY_REQUEST_NOT_FOUND",
    });
    expect(users.updatePasswordHash).not.toHaveBeenCalled();
    expect(recovery.consume).not.toHaveBeenCalled();
  });

  it("rejects ADMIN targets from customer-admin recovery", async () => {
    recovery.findPendingUserRequest.mockReturnValue(request());
    users.findById.mockReturnValue(user({ role: "ADMIN" }));

    await expect(
      service.resetCustomerPasswordFromRecoveryRequest(REQUEST_ID, NEW_PASSWORD, 3)
    ).rejects.toMatchObject({ statusCode: 403, code: "ADMIN_MANAGED_BY_SYSTEM_OWNER" });
    expect(users.updatePasswordHash).not.toHaveBeenCalled();
    expect(recovery.consume).not.toHaveBeenCalled();
  });

  it("rejects disabled targets", async () => {
    recovery.findPendingUserRequest.mockReturnValue(request());
    users.findById.mockReturnValue(user({ status: "disabled" }));

    await expect(
      service.resetCustomerPasswordFromRecoveryRequest(REQUEST_ID, NEW_PASSWORD, 3)
    ).rejects.toMatchObject({ statusCode: 409, code: "USER_NOT_ACTIVE" });
    expect(users.updatePasswordHash).not.toHaveBeenCalled();
    expect(recovery.consume).not.toHaveBeenCalled();
  });

  it("does not put the password or password hash into recovery audit data", async () => {
    recovery.findPendingUserRequest.mockReturnValue(request());
    users.findById.mockReturnValue(user());
    users.updatePasswordHash.mockReturnValue(user({ password_change_required: 1 }));

    await service.resetCustomerPasswordFromRecoveryRequest(REQUEST_ID, NEW_PASSWORD, 3);

    const auditPayload = JSON.stringify(recovery.recordAudit.mock.calls.at(-1)?.[0]);
    expect(auditPayload).not.toContain(NEW_PASSWORD);
    expect(auditPayload).not.toContain("password_hash");
    expect(auditPayload).not.toContain("$2");
  });
});

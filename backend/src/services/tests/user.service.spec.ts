import { describe, expect, it, vi } from "vitest";
import { AuditActorSnapshot, AuditEvent, AuditEventInput } from "../../entities/AuditEvent";
import { User } from "../../entities/User";
import { LastActiveAdminError, UserRepository } from "../../repositories/user.repository";
import { UserService } from "../user.service";

const actor: AuditActorSnapshot = {
  kind: "CUSTOMER_USER",
  id: "1",
  username: "admin",
  role: "ADMIN",
};
const requestContext = { source: "USER_MANAGEMENT_API" } as const;

const user = (overrides: Partial<User> = {}): User => ({
  id: 2,
  username: "target",
  email: null,
  role: "VIEWER",
  status: "active",
  created_at: "2026-01-01",
  updated_at: null,
  ...overrides,
});

function dependencies() {
  const repository = {
    getAll: vi.fn(() => [user()]),
    create: vi.fn(() => 2),
    findById: vi.fn(() => user()),
    updateProfileAndRole: vi.fn(() => user({ role: "OPERATOR" })),
    updateStatus: vi.fn(() => user({ status: "disabled" })),
    updatePasswordHash: vi.fn(() => user()),
  };
  const record = vi.fn<(event: AuditEventInput) => AuditEvent>((event) => event as AuditEvent);
  return {
    repository,
    record,
    service: new UserService({
      repository: repository as unknown as UserRepository,
      auditService: { record },
      runInTransaction: (operation) => operation(),
    }),
  };
}

describe("UserService audit integration", () => {
  it("rejects and audits any self role change before persistence", () => {
    const { repository, record, service } = dependencies();

    expect(() => service.updateUser(actor, 1, { role: "VIEWER" }, requestContext)).toThrowError(
      expect.objectContaining({ code: "SELF_ROLE_CHANGE_FORBIDDEN" })
    );
    expect(repository.updateProfileAndRole).not.toHaveBeenCalled();
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "USER.PROFILE_UPDATED",
        result: "FAILED",
        reason: "SELF_ROLE_CHANGE_FORBIDDEN",
      })
    );
  });

  it("rejects and audits self disablement before persistence", () => {
    const { repository, record, service } = dependencies();

    expect(() =>
      service.updateStatus(actor, 1, { status: "disabled" }, requestContext)
    ).toThrowError(expect.objectContaining({ code: "SELF_DISABLE_FORBIDDEN" }));
    expect(repository.updateStatus).not.toHaveBeenCalled();
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ result: "FAILED", reason: "SELF_DISABLE_FORBIDDEN" })
    );
  });

  it.each([
    ["demotion", "updateProfileAndRole", () => ({ role: "VIEWER" as const })],
    ["disablement", "updateStatus", () => ({ status: "disabled" as const })],
  ] as const)("maps and audits transactional last-ADMIN %s protection", (_, method, input) => {
    const { repository, record, service } = dependencies();
    repository[method].mockImplementation(() => {
      throw new LastActiveAdminError();
    });

    const operation =
      method === "updateStatus"
        ? () => service.updateStatus(actor, 2, input() as { status: "disabled" }, requestContext)
        : () => service.updateUser(actor, 2, input() as { role: "VIEWER" }, requestContext);
    expect(operation).toThrowError(expect.objectContaining({ code: "LAST_ACTIVE_ADMIN_REQUIRED" }));
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ result: "FAILED", reason: "LAST_ACTIVE_ADMIN_REQUIRED" })
    );
  });

  it("returns and audits USER_NOT_FOUND for missing targets", () => {
    const { repository, record, service } = dependencies();
    repository.findById.mockReturnValue(undefined as never);

    expect(() => service.updateUser(actor, 99, { email: null }, requestContext)).toThrowError(
      expect.objectContaining({ code: "USER_NOT_FOUND" })
    );
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { type: "USER", id: "99" },
        result: "FAILED",
        reason: "USER_NOT_FOUND",
      })
    );
  });

  it("records safe previous and new values for a successful profile/role change", () => {
    const { record, service } = dependencies();

    service.updateUser(actor, 2, { email: "new@example.com", role: "OPERATOR" }, requestContext);

    expect(record).toHaveBeenCalledWith({
      actor,
      action: "USER.PROFILE_UPDATED",
      target: { type: "USER", id: "2" },
      result: "SUCCESS",
      previousValues: { email: null, role: "VIEWER" },
      newValues: { email: null, role: "OPERATOR" },
      requestContext,
    });
  });

  it("records password action/result without password or hash values", async () => {
    const { record, service } = dependencies();

    await service.updatePassword(actor, 2, { password: "ReplacementPass1" }, requestContext);

    const event = record.mock.calls[0]?.[0];
    expect(event).toMatchObject({
      action: "USER.PASSWORD_UPDATED",
      target: { type: "USER", id: "2" },
      result: "SUCCESS",
    });
    expect(event).not.toHaveProperty("previousValues");
    expect(event).not.toHaveProperty("newValues");
    expect(JSON.stringify(event)).not.toMatch(/ReplacementPass1|\$2b\$/i);
  });
});

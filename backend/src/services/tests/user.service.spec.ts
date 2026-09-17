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
  password_change_required: 0,
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
    updatePasswordHash: vi.fn(() => user({ password_change_required: 1 })),
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

describe("UserService recovery behavior", () => {
  it("does not expose other ADMIN accounts to customer administrators", () => {
    const { repository, service } = dependencies();
    repository.getAll.mockReturnValue([
      user({ id: 1, username: "self", role: "ADMIN" }),
      user({ id: 2, username: "other", role: "ADMIN" }),
      user({ id: 3, username: "viewer", role: "VIEWER" }),
    ]);
    expect(service.listUsers(1)).toEqual([
      expect.objectContaining({ username: "self" }),
      expect.objectContaining({ username: "viewer" }),
    ]);
  });
  it("prevents customer ADMIN from creating another ADMIN", async () => {
    const { service } = dependencies();
    await expect(
      service.createUser(
        actor,
        { username: "newadmin", password: "StrongPassword1", role: "ADMIN" },
        requestContext
      )
    ).rejects.toMatchObject({ code: "ADMIN_MANAGED_BY_SYSTEM_OWNER" });
  });
  it("resets a non-admin password and requires change on next login", async () => {
    const { repository, record, service } = dependencies();
    await service.updatePassword(actor, 2, { password: "TemporaryPassword1" }, requestContext);
    expect(repository.updatePasswordHash).toHaveBeenCalledWith(2, expect.any(String), true);
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "USER.PASSWORD_RESET",
        result: "SUCCESS",
      })
    );
    const successEvent = record.mock.calls.find(([event]) => event.result === "SUCCESS")?.[0];
    expect(successEvent).not.toHaveProperty("newValues");
  });
  it("prevents customer ADMIN from resetting another ADMIN password", async () => {
    const { repository, service } = dependencies();
    repository.findById.mockReturnValue(user({ role: "ADMIN" }));
    await expect(
      service.updatePassword(actor, 2, { password: "TemporaryPassword1" }, requestContext)
    ).rejects.toMatchObject({ code: "ADMIN_MANAGED_BY_SYSTEM_OWNER" });
  });
  it("maps last-active-admin repository protection", () => {
    const { repository, service } = dependencies();
    repository.findById.mockReturnValue(user({ id: 2, role: "VIEWER" }));
    repository.updateStatus.mockImplementation(() => {
      throw new LastActiveAdminError();
    });

    let thrown: unknown;
    try {
      service.updateStatus(actor, 2, { status: "disabled" }, requestContext);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({ code: "LAST_ACTIVE_ADMIN_REQUIRED" });
  });
});

import { describe, expect, it, vi } from "vitest";
import { User } from "../../entities/User";
import { LastActiveAdminError, UserRepository } from "../../repositories/user.repository";
import { UserService } from "../user.service";

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

function repositoryMock() {
  return {
    getAll: vi.fn(() => [user()]),
    create: vi.fn(() => 2),
    findById: vi.fn(() => user()),
    updateProfileAndRole: vi.fn(() => user({ role: "OPERATOR" })),
    updateStatus: vi.fn(() => user({ status: "disabled" })),
    updatePasswordHash: vi.fn(() => user()),
  };
}

describe("UserService", () => {
  it("rejects any self role change before persistence", () => {
    const repository = repositoryMock();
    const service = new UserService(repository as unknown as UserRepository);

    expect(() => service.updateUser(2, 2, { role: "ADMIN" })).toThrowError(
      expect.objectContaining({ code: "SELF_ROLE_CHANGE_FORBIDDEN" })
    );
    expect(repository.updateProfileAndRole).not.toHaveBeenCalled();
  });

  it("rejects self disablement before persistence", () => {
    const repository = repositoryMock();
    const service = new UserService(repository as unknown as UserRepository);

    expect(() => service.updateStatus(2, 2, { status: "disabled" })).toThrowError(
      expect.objectContaining({ code: "SELF_DISABLE_FORBIDDEN" })
    );
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it("maps transactional last-ADMIN protection to a stable conflict", () => {
    const repository = repositoryMock();
    repository.updateStatus.mockImplementation(() => {
      throw new LastActiveAdminError();
    });
    const service = new UserService(repository as unknown as UserRepository);

    expect(() => service.updateStatus(1, 2, { status: "disabled" })).toThrowError(
      expect.objectContaining({ code: "LAST_ACTIVE_ADMIN_REQUIRED" })
    );
  });

  it("returns USER_NOT_FOUND for missing targets", () => {
    const repository = repositoryMock();
    repository.updateProfileAndRole.mockReturnValue(undefined as never);
    const service = new UserService(repository as unknown as UserRepository);

    expect(() => service.updateUser(1, 99, { email: null })).toThrowError(
      expect.objectContaining({ code: "USER_NOT_FOUND" })
    );
  });
});

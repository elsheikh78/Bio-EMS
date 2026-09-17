import { describe, expect, it, vi } from "vitest";
import { createAdministrationApi } from "./api";
const user = {
  id: 1,
  username: "admin",
  email: null,
  role: "ADMIN",
  status: "active",
  created_at: "2026-08-24T00:00:00Z",
  updated_at: null,
};
describe("administration API", () => {
  it("maps user lifecycle requests without credentials in paths", async () => {
    const request = vi.fn().mockResolvedValue(user);
    const api = createAdministrationApi(request);
    await api.createUser({
      username: "viewer",
      password: "Secret1234",
      role: "VIEWER",
    });
    await api.updateUser(2, { role: "OPERATOR" });
    await api.updateUserStatus(2, "disabled");
    await api.updateUserPassword(2, "NewSecret1234");
    expect(request.mock.calls.map(([path]) => String(path))).toEqual([
      "/users",
      "/users/2",
      "/users/2/status",
      "/users/2/password",
    ]);
    expect(
      request.mock.calls.map(([path]) => String(path)).join(" "),
    ).not.toContain("Secret");
  });
  it("maps password recovery list and reset without putting the password in the path", async () => {
    const requestId = "123e4567-e89b-42d3-a456-426614174000";
    const password = "TemporaryRecovery1";
    const request = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({
        request_id: requestId,
        principal_id: 7,
        status: "CONSUMED",
      });
    const api = createAdministrationApi(request);

    await api.listPasswordRecoveryRequests();
    await api.resetPasswordRecoveryRequest(requestId, password);

    expect(request).toHaveBeenNthCalledWith(1, "/users/password-recovery/requests");
    expect(request).toHaveBeenNthCalledWith(
      2,
      `/users/password-recovery/requests/${requestId}/reset`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      },
    );
    expect(request.mock.calls.map(([path]) => String(path)).join(" ")).not.toContain(password);
  });
  it("requires explicit Site scope for Audit Log", async () => {
    const request = vi.fn().mockResolvedValue({ events: [] });
    await createAdministrationApi(request).listAuditEvents(7);
    expect(request).toHaveBeenCalledWith("/audit-events?site_id=7&limit=100");
  });
});

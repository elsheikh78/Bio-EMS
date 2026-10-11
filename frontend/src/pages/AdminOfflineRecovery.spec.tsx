import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminOfflineRecovery } from "./AdminOfflineRecovery";
const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../api/client", () => ({ apiRequest: request }));
const recoveryToken = "a".repeat(43);
const grant = {
  recoveryToken,
  expiresAt: "2026-10-11T15:00:00.000Z",
  username: "admin",
};
function choosePermit() {
  const file = new File(['{"claims":{}}'], "permit.json", {
    type: "application/json",
  });
  Object.defineProperty(file, "text", {
    value: () => Promise.resolve('{"claims":{}}'),
  });
  fireEvent.change(document.querySelector('input[type="file"]')!, {
    target: { files: [file] },
  });
}
beforeEach(() => request.mockReset());
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("offline ADMIN recovery UI", () => {
  it("reveals password entry only after server verification, then consumes without logging in", async () => {
    request
      .mockResolvedValueOnce(grant)
      .mockResolvedValueOnce({ success: true });
    render(<AdminOfflineRecovery language="en" />);
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
    choosePermit();
    fireEvent.click(screen.getByRole("button", { name: "Verify permit" }));
    fireEvent.change(await screen.findByLabelText("New password"), {
      target: { value: "ReplacementPass2!" },
    });
    expect(
      screen.getByRole("button", { name: "Save new password" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "ReplacementPass2!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
    await screen.findByText(/Password set. Return to sign in/);
    expect(request).toHaveBeenLastCalledWith("/auth/admin-recovery/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recoveryToken, newPassword: "ReplacementPass2!" }),
    });
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
    expect(request.mock.calls.some(([path]) => path === "/auth/login")).toBe(
      false,
    );
    expect(localStorage.getItem("recoveryToken")).toBeNull();
  });
  it("keeps password entry hidden on rejected permits in Arabic", async () => {
    request.mockRejectedValue(new Error("expired"));
    render(<AdminOfflineRecovery language="ar" />);
    choosePermit();
    fireEvent.click(screen.getByRole("button", { name: "التحقق من التصريح" }));
    await screen.findByRole("alert");
    expect(
      screen.queryByLabelText("كلمة المرور الجديدة"),
    ).not.toBeInTheDocument();
  });
  it("exports a request JSON with no account eligibility assertion", async () => {
    request.mockResolvedValue({
      schemaVersion: 1,
      purpose: "CUSTOMER_ADMIN_RECOVERY_REQUEST",
      requestId: "11111111-1111-4111-8111-111111111111",
      installationId: "22222222-2222-4222-8222-222222222222",
      username: "admin",
      customerName: "Customer",
      customerCode: "C1",
      siteName: "Site",
      siteCode: "S1",
      challenge: "b".repeat(43),
      requestedAt: "2026-10-11T12:00:00.000Z",
      expiresAt: "2026-10-12T12:00:00.000Z",
    });
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob:request"),
      revokeObjectURL: vi.fn(),
    });
    let filename = "";
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      filename = this.download;
    });
    render(<AdminOfflineRecovery language="en" />);
    fireEvent.change(screen.getByLabelText("ADMIN username"), {
      target: { value: "admin" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Export recovery request" }),
    );
    await screen.findByText(/This does not confirm the account exists/);
    expect(filename).toContain("BIO-EMS-Admin-Recovery-Request-");
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(
        "/auth/admin-recovery/request",
        expect.any(Object),
      ),
    );
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SystemOwnerFeatureSettingsPage } from "./SystemOwnerFeatureSettingsPage";
const { request, apiClient } = vi.hoisted(() => {
  const request = vi.fn();
  return { request, apiClient: { request } };
});
vi.mock("../platform-auth/usePlatformAuthentication", () => ({
  usePlatformAuthentication: () => ({ apiClient }),
}));
vi.mock("../localization/useLocalization", () => ({
  useLocalization: () => ({ language: "en" }),
}));
describe("owner feature settings", () => {
  beforeEach(() => {
    request.mockReset();
    request.mockImplementation(
      async (path: string, options?: { method?: string }) => {
        if (path === "/feature-settings")
          return { controllers: [], alarms: [] };
        if (options?.method === "PUT")
          return { revision: 1, policy: { reports: false, backups: true } };
        return { revision: 0, policy: { reports: true, backups: true } };
      },
    );
  });
  it("requires a reason and sends a revision-checked protected update", async () => {
    render(
      <MemoryRouter>
        <SystemOwnerFeatureSettingsPage />
      </MemoryRouter>,
    );
    const reports = await screen.findByRole("switch", { name: "Reports" });
    const save = screen.getByRole("button", { name: "Save settings" });
    expect(save).toBeDisabled();
    fireEvent.click(reports);
    fireEvent.change(screen.getByLabelText(/Reason/), {
      target: { value: "Maintenance window" },
    });
    fireEvent.click(save);
    await screen.findByText("Platform settings applied");
    const call = request.mock.calls.find(
      ([, options]) => options?.method === "PUT",
    );
    expect(call?.[1].auth).toBe("protected");
    expect(JSON.parse(call?.[1].body)).toEqual({
      expectedRevision: 0,
      reason: "Maintenance window",
      policy: { reports: false, backups: true },
    });
  });
  it("shows a failed save without claiming that settings were applied", async () => {
    render(
      <MemoryRouter>
        <SystemOwnerFeatureSettingsPage />
      </MemoryRouter>,
    );
    await screen.findByRole("switch", { name: "Reports" });
    fireEvent.change(screen.getByLabelText(/Reason/), {
      target: { value: "Change settings" },
    });
    request.mockRejectedValueOnce(new Error("revision conflict"));
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
    await screen.findByText(/Save failed/);
    expect(
      screen.queryByText("Platform settings applied"),
    ).not.toBeInTheDocument();
  });
});

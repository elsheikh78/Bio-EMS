import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AdminMainNetworkSettingsPage,
  OwnerMainNetworkSettingsPage,
} from "./MainNetworkSettingsPage";
const mocks = vi.hoisted(() => {
  const request =
    vi.fn<
      (
        path: string,
        options?: { method?: string; body?: string; auth?: string },
      ) => Promise<unknown>
    >();
  return { request, apiClient: { request }, role: "ADMIN" };
});
vi.mock("../auth/useAuthentication", () => ({
  useAuthentication: () => ({
    user: { role: mocks.role },
    protectedRequest: mocks.request,
  }),
}));
vi.mock("../platform-auth/usePlatformAuthentication", () => ({
  usePlatformAuthentication: () => ({ apiClient: mocks.apiClient }),
}));
vi.mock("../localization/useLocalization", () => ({
  useLocalization: () => ({ language: "en" }),
}));
const state = {
  revision: 4,
  appliedRevision: 3,
  policy: {
    ethernet: true,
    wifi: true,
    bluetooth: true,
    centralBatteryInstalled: false,
  },
  ssid: "Old",
  passwordConfigured: true,
  networkSettingsVersion: 1,
  transport: "ethernet",
  receivedAt: null,
  policyError: null,
};
async function choose() {
  fireEvent.mouseDown(await screen.findByLabelText("Main controller"));
  fireEvent.click(await screen.findByRole("option", { name: "SITE / MAIN" }));
  await screen.findByText(/Saved \/ device-confirmed revision/);
}
describe("Main network page", () => {
  beforeEach(() => {
    mocks.role = "ADMIN";
    mocks.request.mockReset();
    mocks.request.mockImplementation(
      (path: string, options?: { method?: string }) =>
        Promise.resolve(
          options?.method === "PUT"
            ? { ...state, revision: 5 }
            : path.endsWith("settings")
              ? { controllers: [{ id: "binding", name: "MAIN", site: "SITE" }] }
              : state,
        ),
    );
  });
  it.each(["VIEWER", "OPERATOR"])(
    "does not load or display controls for %s",
    (role) => {
      mocks.role = role;
      render(
        <MemoryRouter>
          <AdminMainNetworkSettingsPage />
        </MemoryRouter>,
      );
      expect(screen.getByText(/Admin only/)).toBeVisible();
      expect(mocks.request).not.toHaveBeenCalled();
    },
  );
  it("shows an explicit empty state without requiring COM or flashing", async () => {
    mocks.request.mockResolvedValue({ controllers: [] });
    render(
      <MemoryRouter>
        <AdminMainNetworkSettingsPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/No active bound Main/)).toBeVisible();
    expect(screen.queryByText("Flash & Bind")).not.toBeInTheDocument();
  });
  it("saves network changes with the loaded revision and clears the entered password", async () => {
    render(
      <MemoryRouter>
        <AdminMainNetworkSettingsPage />
      </MemoryRouter>,
    );
    await choose();
    expect(
      screen.getByRole("switch", {
        name: "Central backup battery installed (optional)",
      }),
    ).not.toBeChecked();
    fireEvent.click(
      screen.getByRole("switch", { name: "Enter / replace Wi-Fi credentials" }),
    );
    fireEvent.change(screen.getByLabelText("Wi-Fi SSID"), {
      target: { value: "New Office" },
    });
    fireEvent.change(screen.getByLabelText("New Wi-Fi password"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByLabelText(/Change reason/), {
      target: { value: "Move router" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Save and await device confirmation",
      }),
    );
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(
        "/network-settings/binding",
        expect.objectContaining({ method: "PUT" }),
      ),
    );
    const put = mocks.request.mock.calls.find(([, o]) => o?.method === "PUT");
    expect(JSON.parse(put?.[1]?.body ?? "{}")).toMatchObject({
      expectedRevision: 4,
      wifiCredentials: { ssid: "New Office", password: "new-password" },
      centralBatteryInstalled: false,
    });
    await screen.findByText(/Saved; awaiting device confirmation/);
    expect(
      screen.queryByLabelText("New Wi-Fi password"),
    ).not.toBeInTheDocument();
  });
  it("uses the independent owner token and owner endpoint", async () => {
    render(
      <MemoryRouter>
        <OwnerMainNetworkSettingsPage />
      </MemoryRouter>,
    );
    await choose();
    expect(mocks.request).toHaveBeenCalledWith(
      "/owner-network-settings/binding",
      { auth: "protected" },
    );
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalizationProvider } from "../localization/LocalizationProvider";
import { CommissioningPage } from "./CommissioningPage";
import { SystemOwnerInstallationsPage } from "./SystemOwnerInstallationsPage";

vi.mock("../installations/queries", () => ({
  useCreateInstallation: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useInstallationAction: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useInstallationContext: () => ({
    data: {
      installationId: "11111111-1111-4111-8111-111111111111",
      source: "INSTALLER_PROVISIONING_RECEIPT",
      customer: { id: 1, code: "BIO-EGYPT", name: "Bio Egypt" },
      site: {
        id: 1,
        code: "elmanial-001",
        name: "El Manial",
        location: null,
        timezone: "Africa/Cairo",
      },
    },
    isPending: false,
    isError: false,
  }),
  useInstallations: () => ({ data: [] }),
  useIssueDevicePairingCode: () => ({
    isPending: false,
    isError: false,
    mutateAsync: vi.fn(),
  }),
  useReviseInstallation: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

const protectedRequest = vi.fn();
vi.mock("../auth/useAuthentication", () => ({
  useAuthentication: () => ({
    protectedRequest,
    user: { id: 1, role: "ADMIN", username: "admin" },
  }),
}));

vi.mock("../monitoredAreas/queries", () => ({
  useSites: () => ({ data: [{ id: 1, name: "Cairo" }] }),
}));

describe("P8 Arabic localization", () => {
  beforeEach(() => {
    protectedRequest.mockImplementation((path: string) => {
      if (path === "/sites/1/commissioning-readiness") {
        return Promise.resolve({
          ready: true,
          summary: {
            blockedSensors: 0,
            readySensors: 1,
            totalSensors: 1,
            totalDevices: 1,
            onlineDevices: 1,
            blockedDevices: 0,
          },
          devices: [
            {
              deviceId: "D001",
              communicationStatus: "ONLINE",
              lastSeenAt: "2026-09-27T16:50:00.000Z",
              ready: true,
              blockers: [],
            },
          ],
          items: [],
        });
      }
      if (path === "/installations/site/1/acceptance-state") {
        return Promise.resolve({
          siteId: 1,
          siteCode: "elmanial-001",
          siteName: "Cairo",
          installation: {
            uuid: "11111111-1111-4111-8111-111111111111",
            status: "CUSTOMER_ACCEPTANCE_PENDING",
            latestRevision: 1,
            acceptanceEnabled: true,
            technicalCommissioning: {
              decision: "ACCEPT",
              decidedAt: "2026-09-27T16:45:00.000Z",
            },
            customerAcceptance: null,
          },
        });
      }
      return Promise.resolve({});
    });
  });

  it("renders the installation lifecycle actions in Arabic RTL", () => {
    render(
      <LocalizationProvider language="ar">
        <MemoryRouter>
          <SystemOwnerInstallationsPage />
        </MemoryRouter>
      </LocalizationProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "تهيئة التركيب" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "إنشاء مسودة التركيب" }),
    ).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
  });

  it("renders customer acceptance and readiness in Arabic", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <LocalizationProvider language="ar">
          <CommissioningPage />
        </LocalizationProvider>
      </QueryClientProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "استلام العميل للموقع" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "قبول التركيب" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "رفض / تسجيل مشكلة" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("أدلة الموقع جاهزة لاستلام العميل."),
    ).toBeInTheDocument();
  });
});

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
  useInstallations: () => ({ data: [] }),
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
    protectedRequest.mockResolvedValue({
      ready: true,
      summary: { blockedSensors: 0, readySensors: 1, totalSensors: 1 },
      items: [],
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
      screen.getByRole("button", { name: "إنشاء مسودة محكومة" }),
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
      screen.getByRole("heading", { name: "قبول العميل للتركيب" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "قبول" })).toBeInTheDocument();
    expect(
      await screen.findByText(/متطلبات تهيئة البرنامج جاهزة/),
    ).toBeInTheDocument();
  });
});

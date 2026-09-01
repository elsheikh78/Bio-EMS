import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLocalization } from "../localization/useLocalization";
import {
  useCreatePlatformCustomer,
  usePlatformOperationsOverview,
} from "../platform-operations/queries";
import { SystemOwnerCustomerFleetPage } from "./SystemOwnerCustomerFleetPage";

vi.mock("../localization/useLocalization", () => ({
  useLocalization: vi.fn(),
}));
vi.mock("../platform-operations/queries", () => ({
  usePlatformOperationsOverview: vi.fn(),
  useCreatePlatformCustomer: vi.fn(),
}));

const overviewHook = vi.mocked(usePlatformOperationsOverview);
const createHook = vi.mocked(useCreatePlatformCustomer);
const localizationHook = vi.mocked(useLocalization);
const createCustomer = vi.fn();
const refetch = vi.fn();

const overview = {
  customers: [
    {
      id: 1,
      code: "BIO-EGYPT",
      name: "BIO EGYPT",
      status: "ACTIVE" as const,
      createdAt: "2026-09-01T12:00:00Z",
      createdBy: "owner#1",
    },
  ],
  sites: [
    {
      id: 7,
      code: "OCT",
      name: "6th October",
      location: "Giza",
      timezone: "Africa/Cairo",
      active: 1,
    },
  ],
  licenses: [
    {
      id: 2,
      customerId: 1,
      siteId: 7,
      licenseKeyReference: "LIC-001",
      edition: "PILOT",
      status: "ACTIVE" as const,
      startsAt: "2026-09-01T12:00:00Z",
      expiresAt: null,
      updateEntitlement: "FREE" as const,
    },
  ],
  serviceEvents: [],
  commercialEvents: [
    {
      id: 3,
      eventType: "CUSTOMER_CREATED",
      entityType: "CUSTOMER",
      entityId: 1,
      occurredAt: "2026-09-01T12:00:00Z",
      actorIdentity: "owner#1",
    },
  ],
};

function renderPage(path = "/system-owner/customers") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="system-owner/customers"
          element={<SystemOwnerCustomerFleetPage />}
        />
        <Route
          path="system-owner/customers/:customerId"
          element={<SystemOwnerCustomerFleetPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SYSTEM_OWNER customer fleet", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localizationHook.mockReturnValue({ language: "en" } as ReturnType<
      typeof useLocalization
    >);
    overviewHook.mockReturnValue({
      data: overview,
      isPending: false,
      isError: false,
      refetch,
    } as unknown as ReturnType<typeof usePlatformOperationsOverview>);
    createHook.mockReturnValue({
      mutateAsync: createCustomer,
      isPending: false,
    } as unknown as ReturnType<typeof useCreatePlatformCustomer>);
  });

  it("shows customer fleet without exposing unauthorized lifecycle updates", () => {
    renderPage();
    expect(screen.getByText("BIO EGYPT")).toBeInTheDocument();
    expect(
      screen.getByText(
        /current backend contract authorizes customer creation only/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /edit/i }),
    ).not.toBeInTheDocument();
  });

  it("shows linked Site identity and commercial provenance on customer detail", () => {
    renderPage("/system-owner/customers/1");
    expect(screen.getByText(/OCT — 6th October — Giza/)).toBeInTheDocument();
    expect(screen.getByText(/CUSTOMER_CREATED.*owner#1/)).toBeInTheDocument();
    expect(screen.getByText(/Recorded by: owner#1/)).toBeInTheDocument();
  });

  it("creates only the backend-authorized customer record", async () => {
    createCustomer.mockResolvedValue({ success: true, id: 2 });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Add customer" }));
    const codeInput = await screen.findByRole("textbox", { name: "Code" });
    const nameInput = await screen.findByRole("textbox", { name: "Name" });
    fireEvent.change(codeInput, {
      target: { value: "ACME" },
    });
    fireEvent.change(nameInput, {
      target: { value: "ACME Pharma" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create customer" }));

    await waitFor(() =>
      expect(createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "ACME",
          name: "ACME Pharma",
          status: "ACTIVE",
        }),
      ),
    );
    expect(createCustomer.mock.calls[0]?.[0]).not.toHaveProperty(
      "actorIdentity",
    );
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLocalization } from "../localization/useLocalization";
import { usePlatformOperationsOverview } from "../platform-operations/queries";
import { SystemOwnerCustomerAdminsPage } from "./SystemOwnerCustomerAdminsPage";

vi.mock("../localization/useLocalization", () => ({
  useLocalization: vi.fn(),
}));
vi.mock("../platform-operations/queries", () => ({
  usePlatformOperationsOverview: vi.fn(),
}));
vi.mock("../platform-operations/CustomerAdminsPanel", () => ({
  CustomerAdminsPanel: ({ customerId }: { customerId: number }) => (
    <div>ADMIN panel for {customerId}</div>
  ),
}));

const localization = vi.mocked(useLocalization);
const overview = vi.mocked(usePlatformOperationsOverview);

const data = {
  customers: [
    {
      id: 1,
      code: "BIO-EGYPT",
      name: "BIO EGYPT",
      status: "ACTIVE",
      createdAt: "2026-09-15T00:00:00Z",
      createdBy: "owner",
    },
  ],
};

describe("SYSTEM_OWNER customer ADMIN page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localization.mockReturnValue({ language: "en" } as ReturnType<
      typeof useLocalization
    >);
    overview.mockReturnValue({
      data,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof usePlatformOperationsOverview>);
  });

  it("exposes a customer selector and opens the selected ADMIN panel", () => {
    render(
      <MemoryRouter>
        <SystemOwnerCustomerAdminsPage />
      </MemoryRouter>,
    );

    fireEvent.mouseDown(screen.getByLabelText("Customer"));
    fireEvent.click(
      screen.getByRole("option", { name: "BIO-EGYPT — BIO EGYPT" }),
    );
    expect(screen.getByText("ADMIN panel for 1")).toBeInTheDocument();
  });

  it("directs the owner to create a customer when the fleet is empty", () => {
    localization.mockReturnValue({ language: "ar" } as ReturnType<
      typeof useLocalization
    >);
    overview.mockReturnValue({
      data: { customers: [] },
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof usePlatformOperationsOverview>);

    render(
      <MemoryRouter>
        <SystemOwnerCustomerAdminsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("أنشئ العميل أولًا قبل إضافة حساب Admin."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "فتح العملاء والمواقع" }),
    ).toHaveAttribute("href", "/system-owner/customers");
  });
});

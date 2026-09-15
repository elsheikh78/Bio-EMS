import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLocalization } from "../localization/useLocalization";
import { CustomerAdminsPanel } from "./CustomerAdminsPanel";
import {
  useCreateCustomerAdmin,
  useCustomerAdmins,
  useCustomerAdminStatus,
  useResetCustomerAdminPassword,
} from "./customerAdmins";

vi.mock("../localization/useLocalization", () => ({
  useLocalization: vi.fn(),
}));
vi.mock("./customerAdmins", () => ({
  useCustomerAdmins: vi.fn(),
  useCreateCustomerAdmin: vi.fn(),
  useCustomerAdminStatus: vi.fn(),
  useResetCustomerAdminPassword: vi.fn(),
}));

const localization = vi.mocked(useLocalization);
const admins = vi.mocked(useCustomerAdmins);
const create = vi.mocked(useCreateCustomerAdmin);
const status = vi.mocked(useCustomerAdminStatus);
const reset = vi.mocked(useResetCustomerAdminPassword);
const createAdmin = vi.fn();
const updateStatus = vi.fn();
const resetPassword = vi.fn();

describe("SYSTEM_OWNER customer ADMIN panel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localization.mockReturnValue({ language: "en" } as ReturnType<
      typeof useLocalization
    >);
    admins.mockReturnValue({
      data: [
        {
          id: 4,
          username: "customer-admin",
          email: "admin@example.com",
          role: "ADMIN",
          status: "active",
          created_at: "2026-09-15T00:00:00Z",
          updated_at: "2026-09-15T00:00:00Z",
        },
      ],
    } as ReturnType<typeof useCustomerAdmins>);
    create.mockReturnValue({
      mutateAsync: createAdmin,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreateCustomerAdmin>);
    status.mockReturnValue({
      mutateAsync: updateStatus,
      isPending: false,
    } as unknown as ReturnType<typeof useCustomerAdminStatus>);
    reset.mockReturnValue({
      mutateAsync: resetPassword,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useResetCustomerAdminPassword>);
  });

  it("creates, disables, and resets an ADMIN for the selected customer", async () => {
    createAdmin.mockResolvedValue({});
    updateStatus.mockResolvedValue({});
    resetPassword.mockResolvedValue({});
    render(<CustomerAdminsPanel customerId={12} />);

    fireEvent.change(screen.getByLabelText(/Username/), {
      target: { value: "new-admin" },
    });
    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Initial password/), {
      target: { value: "StrongPassword1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add ADMIN" }));
    await waitFor(() =>
      expect(createAdmin).toHaveBeenCalledWith({
        username: "new-admin",
        email: "new@example.com",
        password: "StrongPassword1",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Disable" }));
    expect(updateStatus).toHaveBeenCalledWith({
      userId: 4,
      status: "disabled",
    });

    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));
    fireEvent.change(screen.getByLabelText(/New password/), {
      target: { value: "ReplacementPassword1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
    await waitFor(() =>
      expect(resetPassword).toHaveBeenCalledWith({
        userId: 4,
        password: "ReplacementPassword1",
      }),
    );
  });

  it("renders the administration workflow in Arabic", () => {
    localization.mockReturnValue({ language: "ar" } as ReturnType<
      typeof useLocalization
    >);
    render(<CustomerAdminsPanel customerId={12} />);

    expect(screen.getByText("حسابات Admin الخاصة بالعميل")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "إضافة Admin" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تعطيل" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "إعادة تعيين كلمة المرور" }),
    ).toBeInTheDocument();
  });
});

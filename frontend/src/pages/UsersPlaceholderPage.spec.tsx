import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useAuditEvents,
  useCreateUser,
  useManagedUsers,
  useUpdateUser,
  useUpdateUserPassword,
  useUpdateUserStatus,
} from "../administration/queries";
import { useSites } from "../monitoredAreas/queries";
import { UsersPlaceholderPage } from "./UsersPlaceholderPage";
vi.mock("../administration/queries", () => ({
  useAuditEvents: vi.fn(),
  useCreateUser: vi.fn(),
  useManagedUsers: vi.fn(),
  useUpdateUser: vi.fn(),
  useUpdateUserPassword: vi.fn(),
  useUpdateUserStatus: vi.fn(),
}));
vi.mock("../monitoredAreas/queries", () => ({ useSites: vi.fn() }));
const managed = vi.mocked(useManagedUsers),
  createHook = vi.mocked(useCreateUser),
  updateHook = vi.mocked(useUpdateUser),
  passwordHook = vi.mocked(useUpdateUserPassword),
  statusHook = vi.mocked(useUpdateUserStatus),
  audit = vi.mocked(useAuditEvents),
  sites = vi.mocked(useSites);
const createUser = vi.fn(),
  updateUser = vi.fn(),
  changePassword = vi.fn(),
  changeStatus = vi.fn();
const user = {
  id: 1,
  username: "admin",
  email: "admin@example.com",
  role: "ADMIN" as const,
  status: "active" as const,
  created_at: "2026-08-24T00:00:00Z",
  updated_at: null,
};
describe("Users & Audit Log", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    managed.mockReturnValue({
      data: [user],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useManagedUsers>);
    createHook.mockReturnValue({
      mutateAsync: createUser,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreateUser>);
    updateHook.mockReturnValue({
      mutateAsync: updateUser,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useUpdateUser>);
    passwordHook.mockReturnValue({
      mutateAsync: changePassword,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useUpdateUserPassword>);
    statusHook.mockReturnValue({
      mutateAsync: changeStatus,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useUpdateUserStatus>);
    sites.mockReturnValue({
      data: [{ id: 7, code: "CAI", name: "Cairo" }],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useSites>);
    audit.mockReturnValue({
      data: [
        {
          id: "event-1",
          createdAt: "2026-08-24T00:00:00Z",
          actor: {
            kind: "CUSTOMER_USER",
            id: "1",
            username: "admin",
            role: "ADMIN",
          },
          action: "USER.CREATED",
          target: { type: "USER", id: "2" },
          siteId: 7,
          result: "SUCCESS",
          requestContext: { source: "USER_MANAGEMENT_API" },
          previousValues: { password: "must-not-render" },
        },
      ],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAuditEvents>);
  });
  it("renders users and safe Audit summary", () => {
    render(<UsersPlaceholderPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Users & Audit Log",
    );
    expect(screen.getByText("USER.CREATED")).toBeInTheDocument();
    expect(screen.queryByText("must-not-render")).not.toBeInTheDocument();
    expect(audit).toHaveBeenCalledWith(7);
  });
  it("creates a normalized user", async () => {
    createUser.mockResolvedValue(user);
    render(<UsersPlaceholderPage />);
    fireEvent.click(screen.getByRole("button", { name: "Add user" }));
    fireEvent.change(screen.getByLabelText(/Username/), {
      target: { value: " Viewer.One " },
    });
    fireEvent.change(screen.getByLabelText(/Initial password/), {
      target: { value: "Secret1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save user" }));
    await waitFor(() =>
      expect(createUser).toHaveBeenCalledWith({
        username: "viewer.one",
        email: null,
        role: "VIEWER",
        password: "Secret1234",
      }),
    );
  });
  it("changes status through dedicated mutation", () => {
    render(<UsersPlaceholderPage />);
    fireEvent.click(screen.getByRole("button", { name: "Disable" }));
    expect(changeStatus).toHaveBeenCalledWith({ id: 1, status: "disabled" });
  });
  it("changes password without displaying its value", async () => {
    changePassword.mockResolvedValue(user);
    render(<UsersPlaceholderPage />);
    fireEvent.click(screen.getByRole("button", { name: "Password admin" }));
    fireEvent.change(screen.getByLabelText(/New password/), {
      target: { value: "NewSecret1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    await waitFor(() =>
      expect(changePassword).toHaveBeenCalledWith({
        id: 1,
        password: "NewSecret1234",
      }),
    );
    expect(screen.queryByText("NewSecret1234")).not.toBeInTheDocument();
  });
  it("shows recoverable user and Audit errors", () => {
    const userRetry = vi.fn(),
      auditRetry = vi.fn();
    managed.mockReturnValue({
      isPending: false,
      isError: true,
      refetch: userRetry,
    } as unknown as ReturnType<typeof useManagedUsers>);
    audit.mockReturnValue({
      isPending: false,
      isError: true,
      refetch: auditRetry,
    } as unknown as ReturnType<typeof useAuditEvents>);
    render(<UsersPlaceholderPage />);
    screen
      .getAllByRole("button", { name: "Retry" })
      .forEach((button) => fireEvent.click(button));
    expect(userRetry).toHaveBeenCalledOnce();
    expect(auditRetry).toHaveBeenCalledOnce();
  });
});

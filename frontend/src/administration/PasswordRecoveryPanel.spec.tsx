import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  usePasswordRecoveryRequests,
  useResetPasswordRecoveryRequest,
} from "./queries";
import { PasswordRecoveryPanel } from "./PasswordRecoveryPanel";

vi.mock("./queries", () => ({
  usePasswordRecoveryRequests: vi.fn(),
  useResetPasswordRecoveryRequest: vi.fn(),
}));

const requests = vi.mocked(usePasswordRecoveryRequests);
const reset = vi.mocked(useResetPasswordRecoveryRequest);
const refetch = vi.fn();
const mutateAsync = vi.fn();

const recoveryRequest = {
  request_id: "123e4567-e89b-42d3-a456-426614174000",
  principal_type: "USER" as const,
  principal_id: 7,
  username_hint: "operator.one",
  installation_id: null,
  status: "PENDING" as const,
  requested_at: "2026-09-17T18:00:00.000Z",
  expires_at: "2026-09-17T18:30:00.000Z",
};

describe("PasswordRecoveryPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requests.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      refetch,
    } as unknown as ReturnType<typeof usePasswordRecoveryRequests>);
    reset.mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useResetPasswordRecoveryRequest>);
  });

  it("renders the empty pending-request state", () => {
    render(<PasswordRecoveryPanel />);
    expect(
      screen.getByText("No pending recovery requests."),
    ).toBeInTheDocument();
  });

  it("renders loading and retry states without exposing credentials", () => {
    requests.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch,
    } as unknown as ReturnType<typeof usePasswordRecoveryRequests>);
    const { rerender } = render(<PasswordRecoveryPanel />);
    expect(
      screen.getByLabelText("Loading recovery requests"),
    ).toBeInTheDocument();

    requests.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof usePasswordRecoveryRequests>);
    rerender(<PasswordRecoveryPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("opens reset dialog for a pending request and never displays the entered password", () => {
    requests.mockReturnValue({
      data: [recoveryRequest],
      isPending: false,
      isError: false,
      refetch,
    } as unknown as ReturnType<typeof usePasswordRecoveryRequests>);

    render(<PasswordRecoveryPanel />);
    expect(screen.getByText("operator.one")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));

    const password = "TemporaryRecovery1!";
    const input = screen.getByRole("textbox", { name: /Temporary password/ });
    fireEvent.change(input, { target: { value: password } });

    expect(input).toHaveAttribute("type", "password");
    expect(screen.queryByText(password)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /The new password is never displayed or returned by BIO-EMS/,
      ),
    ).toBeInTheDocument();
  });
});

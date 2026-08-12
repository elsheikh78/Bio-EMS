import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import {
  AuthenticationContext,
  AuthenticationFailure,
  type AuthenticationContextValue,
} from "../auth/AuthenticationContext";
import { LocalizationProvider } from "../localization/LocalizationProvider";
import { LoginPage } from "./LoginPage";

function renderLogin(overrides: Partial<AuthenticationContextValue> = {}) {
  const value: AuthenticationContextValue = {
    status: "unauthenticated",
    loginPending: false,
    login: vi.fn(),
    logout: vi.fn(),
    retryRestoration: vi.fn(),
    protectedRequest: vi.fn(),
    ...overrides,
  };
  render(
    <LocalizationProvider>
      <AuthenticationContext.Provider value={value}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthenticationContext.Provider>
    </LocalizationProvider>,
  );
  return value;
}

describe("accessible Login experience", () => {
  it("uses the approved field types, autocomplete values, and keyboard submission", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    renderLogin({ login });
    const user = userEvent.setup();
    const username = screen.getByRole("textbox", { name: "Username" });
    const password = screen.getByLabelText(/Password/);

    expect(username).toHaveAttribute("autocomplete", "username");
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    await user.type(username, "admin");
    await user.type(password, "password{Enter}");

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        username: "admin",
        password: "password",
      }),
    );
  });

  it("disables inputs and announces progress while submitting", () => {
    renderLogin({ loginPending: true });

    expect(screen.getByRole("textbox", { name: "Username" })).toBeDisabled();
    expect(screen.getByLabelText(/Password/)).toBeDisabled();
    expect(screen.getByRole("button", { name: "Signing in" })).toBeDisabled();
  });

  it("shows one generic localized credential error and moves focus to it", async () => {
    const login = vi
      .fn()
      .mockRejectedValue(new AuthenticationFailure("invalid-credentials"));
    renderLogin({ login });
    const user = userEvent.setup();

    await user.type(
      screen.getByRole("textbox", { name: "Username" }),
      "unknown",
    );
    await user.type(screen.getByLabelText(/Password/), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("The username or password is invalid.");
    await waitFor(() => expect(alert).toHaveFocus());
    expect(screen.queryByDisplayValue("wrong")).not.toBeInTheDocument();
  });
});

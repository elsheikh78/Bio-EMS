import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import {
  AuthenticationContext,
  AuthenticationFailure,
  type AuthenticationContextValue,
} from "../auth/AuthenticationContext";
import { LocalizationProvider } from "../localization/LocalizationProvider";
import { LoginPage } from "./LoginPage";

const admin = { id: 1, username: "admin", role: "ADMIN" } as const;

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderLogin(
  overrides: Partial<AuthenticationContextValue> = {},
  returnTo?: unknown,
) {
  const value: AuthenticationContextValue = {
    status: "unauthenticated",
    loginPending: false,
    login: vi.fn().mockResolvedValue(admin),
    logout: vi.fn(),
    retryRestoration: vi.fn(),
    protectedRequest: vi.fn(),
    ...overrides,
  };
  render(
    <LocalizationProvider>
      <AuthenticationContext.Provider value={value}>
        <MemoryRouter
          initialEntries={[{ pathname: "/login", state: { returnTo } }]}
        >
          <LoginPage />
          <LocationProbe />
        </MemoryRouter>
      </AuthenticationContext.Provider>
    </LocalizationProvider>,
  );
  return value;
}

describe("accessible Login experience", () => {
  it("places initial focus on the Login heading", async () => {
    renderLogin();

    const heading = screen.getByRole("heading", { name: "Sign in to BIO-EMS" });
    await waitFor(() => expect(heading).toHaveFocus());
  });

  it("uses the approved field types, autocomplete values, and keyboard submission", async () => {
    const login = vi.fn().mockResolvedValue(admin);
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

  it("returns to a known permitted internal route after Login", async () => {
    const login = vi.fn().mockResolvedValue(admin);
    renderLogin({ login }, "/users");
    const user = userEvent.setup();

    await user.type(screen.getByRole("textbox", { name: "Username" }), "admin");
    await user.type(screen.getByLabelText(/Password/), "password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/users"),
    );
    expect(screen.queryByText("password")).not.toBeInTheDocument();
  });

  it("falls back to the workspace for an unauthorized return target", async () => {
    const operator = { id: 2, username: "operator", role: "OPERATOR" } as const;
    renderLogin({ login: vi.fn().mockResolvedValue(operator) }, "/users");
    const user = userEvent.setup();

    await user.type(
      screen.getByRole("textbox", { name: "Username" }),
      "operator",
    );
    await user.type(screen.getByLabelText(/Password/), "password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/"),
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
    const username = screen.getByRole("textbox", { name: "Username" });
    const password = screen.getByLabelText(/Password/);

    await user.type(username, "unknown");
    await user.type(password, "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("The username or password is invalid.");
    expect(username).toHaveAttribute("aria-describedby", "login-error");
    expect(username).toHaveAttribute("aria-invalid", "true");
    expect(password).toHaveAttribute("aria-describedby", "login-error");
    expect(password).toHaveAttribute("aria-invalid", "true");
    await waitFor(() => expect(alert).toHaveFocus());
    expect(screen.queryByDisplayValue("wrong")).not.toBeInTheDocument();
  });

  it.each([
    ["validation", "Check the entered credentials and try again."],
    ["network", "The service could not be reached. Try again."],
    ["server", "The service could not complete sign in. Try again."],
    ["malformed-response", "The sign-in response could not be verified."],
    [
      "storage",
      "The session could not be stored securely in this browser tab.",
    ],
  ] as const)("announces a safe localized %s error", async (kind, message) => {
    renderLogin({
      login: vi.fn().mockRejectedValue(new AuthenticationFailure(kind)),
    });
    const user = userEvent.setup();

    await user.type(screen.getByRole("textbox", { name: "Username" }), "user");
    await user.type(screen.getByLabelText(/Password/), "password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });
});

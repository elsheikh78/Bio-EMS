import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthenticationContext,
  AuthenticationFailure,
  type AuthenticationContextValue,
} from "../auth/AuthenticationContext";
import { LocalizationProvider } from "../localization/LocalizationProvider";
import { LoginPage } from "./LoginPage";

const { recoveryRequest } = vi.hoisted(() => ({ recoveryRequest: vi.fn() }));
vi.mock("../api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/client")>()),
  apiRequest: recoveryRequest,
}));
beforeEach(() => recoveryRequest.mockReset());

const admin = { id: 1, username: "admin", role: "ADMIN" } as const;

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderLogin(
  overrides: Partial<AuthenticationContextValue> = {},
  returnTo?: unknown,
  language: "en" | "ar" = "en",
) {
  const value: AuthenticationContextValue = {
    status: "unauthenticated",
    loginPending: false,
    login: vi.fn().mockResolvedValue(admin),
    logout: vi.fn(),
    retryRestoration: vi.fn(),
    protectedRequest: vi.fn(),
    passwordChangeRequired: false,
    completePasswordChange: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  render(
    <LocalizationProvider language={language}>
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
  it("guides ADMIN to the company without submitting a recovery request", () => {
    const { login } = renderLogin();
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.click(
      screen.getByRole("button", { name: "I am a customer ADMIN" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "System Owner opens Customer ADMIN management",
    );
    expect(
      screen.queryByRole("textbox", { name: "Username" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Request password reset" }),
    ).not.toBeInTheDocument();
    fireEvent.submit(
      screen.getByRole("button", { name: "Back to sign in" }).closest("form")!,
    );
    expect(recoveryRequest).not.toHaveBeenCalled();
    expect(login).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Back to sign in" }));
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows the ADMIN support path in Arabic", () => {
    renderLogin({}, undefined, "ar");
    fireEvent.click(screen.getByRole("button", { name: "نسيت كلمة المرور؟" }));
    fireEvent.click(
      screen.getByRole("button", { name: "أنا Admin لدى العميل" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("لا يُرسل رابط تلقائي");
    expect(
      screen.queryByRole("button", { name: "طلب إعادة تعيين كلمة المرور" }),
    ).not.toBeInTheDocument();
    expect(recoveryRequest).not.toHaveBeenCalled();
  });

  it("retains generic Operator/Viewer recovery after switching from ADMIN", async () => {
    recoveryRequest.mockResolvedValue({ accepted: true });
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.click(
      screen.getByRole("button", { name: "I am a customer ADMIN" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "I am an Operator or Viewer" }),
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Username" }), {
      target: { value: "operator" },
    });
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Request password reset" })
        .closest("form")!,
    );
    await waitFor(() =>
      expect(recoveryRequest).toHaveBeenCalledWith("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "operator" }),
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ADMIN accounts must contact the company",
    );
  });

  it("places initial focus on the Login heading", async () => {
    renderLogin();

    const heading = screen.getByRole("heading", { name: "Sign in to BIO-EMS" });
    await waitFor(() => expect(heading).toHaveFocus());
  });

  it("uses the approved field types, autocomplete values, and keyboard submission", async () => {
    const login = vi.fn().mockResolvedValue(admin);
    renderLogin({ login });
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Sign in to BIO-EMS" }),
      ).toHaveFocus(),
    );
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
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Sign in to BIO-EMS" }),
      ).toHaveFocus(),
    );
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
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Sign in to BIO-EMS" }),
      ).toHaveFocus(),
    );
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
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Sign in to BIO-EMS" }),
      ).toHaveFocus(),
    );
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
    fireEvent.change(screen.getByRole("textbox", { name: "Username" }), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getByLabelText(/Password/), {
      target: { value: "password" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Sign in" }).closest("form")!,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });
});

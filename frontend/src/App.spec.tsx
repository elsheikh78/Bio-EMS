import { CssBaseline, ThemeProvider, useTheme } from "@mui/material";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { AppProviders } from "./app/AppProviders";
import {
  AuthenticationContext,
  type AuthenticationContextValue,
} from "./auth/AuthenticationContext";
import type { UserRole } from "./auth/contracts";
import { AUTHENTICATION_SESSION_KEY } from "./auth/sessionStorage";
import { LocalizationProvider } from "./localization/LocalizationProvider";
import { useLocalization } from "./localization/useLocalization";
import { createAppTheme } from "./theme/theme";

const users = {
  ADMIN: { id: 1, username: "admin", role: "ADMIN" },
  OPERATOR: { id: 2, username: "operator", role: "OPERATOR" },
  VIEWER: { id: 3, username: "viewer", role: "VIEWER" },
} as const;

function ProviderProbe() {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const localization = useLocalization();
  const location = useLocation();

  return (
    <output data-testid="provider-probe">
      {queryClient ? "query" : ""}:{theme.direction}:{localization.language}:
      {localization.direction}:{location.pathname}
    </output>
  );
}

function authenticationValue(
  role: UserRole,
  overrides: Partial<AuthenticationContextValue> = {},
): AuthenticationContextValue {
  return {
    status: "authenticated",
    user: users[role],
    loginPending: false,
    login: vi.fn(),
    logout: vi.fn(),
    retryRestoration: vi.fn(),
    protectedRequest: vi.fn(),
    ...overrides,
  };
}

function setDesktopViewport() {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: query.includes("min-width:900px"),
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
    })),
  );
}

function renderWithAuthentication(
  path: string,
  value: AuthenticationContextValue,
) {
  setDesktopViewport();

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider>
        <ThemeProvider theme={createAppTheme("ltr")}>
          <CssBaseline />
          <AuthenticationContext.Provider value={value}>
            <MemoryRouter initialEntries={[path]}>
              <App />
            </MemoryRouter>
          </AuthenticationContext.Provider>
        </ThemeProvider>
      </LocalizationProvider>
    </QueryClientProvider>,
  );
}

function renderApplication(path: string) {
  window.history.pushState({}, "", path);

  return render(
    <AppProviders>
      <ProviderProbe />
      <App />
    </AppProviders>,
  );
}

function storeSession(role: UserRole = "ADMIN") {
  window.sessionStorage.setItem(
    AUTHENTICATION_SESSION_KEY,
    JSON.stringify({
      version: 1,
      accessToken: "opaque-test-token",
      tokenType: "bearer",
      expiresAt: Date.now() + 60_000,
      user: users[role],
    }),
  );
}

function mockCurrentUser(role: UserRole = "ADMIN") {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com/api/v1");

  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ user: users[role] }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }),
  );
}

function mockLogin() {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com/api/v1");

  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        access_token: "opaque-login-token",
        token_type: "bearer",
        expires_in: 60,
        user: users.ADMIN,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    ),
  );
}

describe("authenticated application routing", () => {
  afterEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("redirects unauthenticated protected access to the localized Login route", async () => {
    renderApplication("/dashboard");

    expect(
      await screen.findByRole("heading", {
        name: "Sign in to BIO-EMS",
      }),
    ).toBeInTheDocument();

    expect(screen.queryByTestId("app-shell")).not.toBeInTheDocument();

    expect(screen.getByTestId("provider-probe")).toHaveTextContent(
      "query:ltr:en:ltr:/login",
    );
  });

  it("renders no protected shell while bootstrapping or restoration is blocked", async () => {
    const { rerender } = renderWithAuthentication(
      "/dashboard",
      authenticationValue("ADMIN", {
        status: "bootstrapping",
        user: undefined,
      }),
    );

    expect(screen.getByText("Verifying your session")).toBeInTheDocument();
    expect(screen.queryByTestId("app-shell")).not.toBeInTheDocument();

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    rerender(
      <QueryClientProvider client={queryClient}>
        <LocalizationProvider>
          <ThemeProvider theme={createAppTheme("ltr")}>
            <AuthenticationContext.Provider
              value={authenticationValue("ADMIN", {
                status: "restoration-error",
                user: undefined,
              })}
            >
              <MemoryRouter initialEntries={["/dashboard"]}>
                <App />
              </MemoryRouter>
            </AuthenticationContext.Provider>
          </ThemeProvider>
        </LocalizationProvider>
      </QueryClientProvider>,
    );

    const restorationHeading = screen.getByRole("heading", {
      name: "Session verification is temporarily unavailable",
    });

    expect(restorationHeading).toBeInTheDocument();

    await waitFor(() => expect(restorationHeading).toHaveFocus());

    expect(screen.queryByTestId("app-shell")).not.toBeInTheDocument();
  });

  it.each([
    ["/", "Operational workspace"],
    ["/dashboard", "Operational dashboard"],
    ["/monitored-areas", "Monitored Areas"],
    ["/alarms", "Alarms"],
    ["/devices", "Devices"],
    ["/configuration", "Configuration"],
    ["/users", "Users"],
  ])("renders the permitted ADMIN route %s", (path, heading) => {
    renderWithAuthentication(path, authenticationValue("ADMIN"));

    expect(
      screen.getByRole("heading", {
        name: heading,
      }),
    ).toBeInTheDocument();
  });

  it.each(["OPERATOR", "VIEWER"] as const)(
    "denies direct /users access for %s without rendering Not Found",
    async (role) => {
      renderWithAuthentication("/users", authenticationValue(role));

      const heading = screen.getByRole("heading", {
        name: "Not authorized",
      });

      expect(heading).toBeInTheDocument();

      await waitFor(() => expect(heading).toHaveFocus());

      expect(
        screen.queryByRole("heading", {
          name: "Page not found",
        }),
      ).not.toBeInTheDocument();

      expect(
        screen.queryByRole("link", {
          name: "Users",
        }),
      ).not.toBeInTheDocument();
    },
  );

  it("filters navigation from the centralized role permission matrix", () => {
    const { unmount } = renderWithAuthentication(
      "/dashboard",
      authenticationValue("ADMIN"),
    );

    expect(
      screen.getByRole("link", {
        name: "Users",
        hidden: true,
      }),
    ).toBeInTheDocument();

    unmount();

    renderWithAuthentication("/dashboard", authenticationValue("OPERATOR"));

    expect(
      screen.queryByRole("link", {
        name: "Users",
        hidden: true,
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Configuration",
        hidden: true,
      }),
    ).toBeInTheDocument();
  });

  it("redirects authenticated /login access and preserves the legacy foundation redirect", () => {
    const { unmount } = renderWithAuthentication(
      "/login",
      authenticationValue("ADMIN"),
    );

    expect(
      screen.getByRole("heading", {
        name: "Operational workspace",
      }),
    ).toBeInTheDocument();

    unmount();

    renderWithAuthentication("/foundation", authenticationValue("VIEWER"));

    expect(
      screen.getByRole("heading", {
        name: "Operational workspace",
      }),
    ).toBeInTheDocument();
  });

  it("renders unknown authenticated routes as Not Found inside the shell", () => {
    renderWithAuthentication("/missing", authenticationValue("ADMIN"));

    expect(
      screen.getByRole("heading", {
        name: "Page not found",
      }),
    ).toBeInTheDocument();

    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
  });

  it("does not allow Browser Back to reveal protected content after Logout", async () => {
    storeSession();
    mockCurrentUser();

    const user = userEvent.setup();

    renderApplication("/dashboard");

    expect(
      await screen.findByRole("heading", {
        name: "Operational dashboard",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Log out",
      }),
    );

    const loginHeading = await screen.findByRole("heading", {
      name: "Sign in to BIO-EMS",
    });

    expect(loginHeading).toBeInTheDocument();

    await waitFor(() => expect(loginHeading).toHaveFocus());

    window.history.back();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "Sign in to BIO-EMS",
        }),
      ).toBeInTheDocument();

      expect(screen.queryByText("Dashboard data")).not.toBeInTheDocument();
    });
  });

  it("moves focus to protected main content after successful Login", async () => {
    mockLogin();

    const user = userEvent.setup();

    renderApplication("/login");

    await screen.findByRole("heading", {
      name: "Sign in to BIO-EMS",
    });

    await user.type(
      screen.getByRole("textbox", {
        name: "Username",
      }),
      "admin",
    );

    await user.type(screen.getByLabelText(/Password/), "password");

    await user.click(
      screen.getByRole("button", {
        name: "Sign in",
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Operational workspace",
      }),
    ).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole("main")).toHaveFocus());
  });
});

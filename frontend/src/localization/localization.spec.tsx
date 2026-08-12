import { CssBaseline, ThemeProvider } from "@mui/material";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import {
  AuthenticationContext,
  type AuthenticationContextValue,
} from "../auth/AuthenticationContext";
import { AppNavigation } from "../components/AppNavigation";
import { FeaturePlaceholderPage } from "../pages/FeaturePlaceholderPage";
import { FoundationPage } from "../pages/FoundationPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ShellLandingPage } from "../pages/ShellLandingPage";
import { createAppTheme } from "../theme/theme";
import { LocalizationProvider } from "./LocalizationProvider";
import type {
  SupportedLanguage,
  TextDirection,
  TranslationResources,
} from "./resources";
import { englishResources } from "./resources";

const alternativeResources = {
  ...englishResources,
  foundation: {
    title: "Alternative foundation title",
    description: "Alternative foundation description",
    deferredDescription: "Alternative deferred description",
  },
  notFound: {
    title: "Alternative missing-page title",
    action: "Alternative return to workspace",
  },
  shell: {
    productName: "ALT-BIO-EMS",
    openNavigation: "Open alt navigation",
    primaryNavigation: "Alt primary navigation",
    skipToContent: "Skip to alt main content",
  },
  navigation: {
    workspace: "Alt Workspace",
    dashboard: "Alt Dashboard",
    monitoredAreas: "Alt Monitored Areas",
    alarms: "Alt Alarms",
    devices: "Alt Devices",
    configuration: "Alt Configuration",
    users: "Alt Users",
  },
  workspace: {
    title: "Alt workspace title",
    description: "Alt workspace description",
  },
  placeholders: {
    dashboard: {
      title: "Alt dashboard title",
      description: "Alt dashboard description",
    },
    monitoredAreas: {
      title: "Alt monitored areas title",
      description: "Alt monitored areas description",
    },
    alarms: {
      title: "Alt alarms title",
      description: "Alt alarms description",
    },
    devices: {
      title: "Alt devices title",
      description: "Alt devices description",
    },
    configuration: {
      title: "Alt configuration title",
      description: "Alt configuration description",
    },
    users: {
      title: "Alt users title",
      description: "Alt users description",
    },
  },
  errorBoundary: {
    title: "Alternative startup failure",
    reload: "Alternative reload action",
  },
} satisfies TranslationResources;

const futureLanguage: SupportedLanguage = "ar";
const futureDirection: TextDirection = "rtl";
const authenticatedAdmin = {
  status: "authenticated",
  user: { id: 1, username: "admin", role: "ADMIN" },
  loginPending: false,
  login: vi.fn(),
  logout: vi.fn(),
  retryRestoration: vi.fn(),
  protectedRequest: vi.fn(),
} satisfies AuthenticationContextValue;

function setDesktopViewport() {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 1200,
  });
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

function renderWithAlternativeResources(path: string) {
  setDesktopViewport();
  return render(
    <LocalizationProvider
      language={futureLanguage}
      direction={futureDirection}
      resources={alternativeResources}
    >
      <ThemeProvider theme={createAppTheme(futureDirection)}>
        <CssBaseline />
        <AuthenticationContext.Provider value={authenticatedAdmin}>
          <MemoryRouter initialEntries={[path]}>
            <App />
          </MemoryRouter>
        </AuthenticationContext.Provider>
      </ThemeProvider>
    </LocalizationProvider>,
  );
}

describe("localization contracts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("accepts future language, RTL direction, and independently translated text", () => {
    expect(futureLanguage).toBe("ar");
    expect(futureDirection).toBe("rtl");
    expect(alternativeResources.foundation.title).toBe(
      "Alternative foundation title",
    );
  });

  it("creates an RTL-aware Material UI theme", () => {
    expect(createAppTheme("rtl").direction).toBe("rtl");
  });

  it("renders foundation content through localization resources", () => {
    render(
      <LocalizationProvider
        language={futureLanguage}
        direction={futureDirection}
        resources={alternativeResources}
      >
        <FoundationPage />
      </LocalizationProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Alternative foundation title" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Alternative foundation description"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Alternative deferred description"),
    ).toBeInTheDocument();
  });

  it("renders not-found content through localization resources", () => {
    render(
      <MemoryRouter>
        <LocalizationProvider resources={alternativeResources}>
          <NotFoundPage />
        </LocalizationProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: "Alternative missing-page title",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Alternative return to workspace" }),
    ).toHaveAttribute("href", "/");
  });

  it("renders representative shell and page components with alternative resources", () => {
    renderWithAlternativeResources("/");

    expect(
      screen.getByRole("heading", { name: "Alt workspace title" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Alt primary navigation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Alt Dashboard" }),
    ).toBeInTheDocument();
  });

  it("renders an alternative placeholder route through the localization resources", () => {
    renderWithAlternativeResources("/dashboard");

    expect(
      screen.getByRole("heading", { name: "Alt dashboard title" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Alt dashboard description")).toBeInTheDocument();
  });

  it("renders the alternative shell landing page copy", () => {
    render(
      <LocalizationProvider
        language={futureLanguage}
        direction={futureDirection}
        resources={alternativeResources}
      >
        <ThemeProvider theme={createAppTheme(futureDirection)}>
          <CssBaseline />
          <ShellLandingPage />
        </ThemeProvider>
      </LocalizationProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Alt workspace title" }),
    ).toBeInTheDocument();
  });

  it("renders the alternative placeholder page copy", () => {
    render(
      <LocalizationProvider
        language={futureLanguage}
        direction={futureDirection}
        resources={alternativeResources}
      >
        <ThemeProvider theme={createAppTheme(futureDirection)}>
          <CssBaseline />
          <FeaturePlaceholderPage feature="alarms" />
        </ThemeProvider>
      </LocalizationProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Alt alarms title" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Alt alarms description")).toBeInTheDocument();
  });

  it("renders the navigation copy through localization resources", () => {
    render(
      <LocalizationProvider resources={alternativeResources}>
        <AuthenticationContext.Provider value={authenticatedAdmin}>
          <MemoryRouter>
            <AppNavigation label="Alt primary navigation" />
          </MemoryRouter>
        </AuthenticationContext.Provider>
      </LocalizationProvider>,
    );

    expect(
      screen.getByRole("navigation", { name: "Alt primary navigation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Alt Workspace" }),
    ).toBeInTheDocument();
  });
});

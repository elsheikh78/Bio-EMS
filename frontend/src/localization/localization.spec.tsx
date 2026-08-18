import { CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
    sensorsCalibration: "Alt Sensors & Calibration",
    configuration: "Alt Configuration",
    users: "Alt Users",
  },

  workspace: {
    title: "Alt workspace title",
    description: "Alt workspace description",
  },

  dashboard: {
    title: "Alt operational dashboard",
    description: "Alt operational dashboard description",
    refresh: "Alt refresh dashboard",
    refreshing: "Alt refreshing dashboard",

    summary: {
      totalSites: "Alt Sites",
      totalRooms: "Alt Monitored Areas",
      totalDevices: "Alt Devices",
      totalSensors: "Alt Sensors",
      activeAlarms: "Alt Active Alarms",
      offlineDevices: "Alt Offline Devices",
    },

    rooms: {
      title: "Alt monitored area status",
      description:
        "Alt current environmental status for monitored rooms and areas.",
      loading: "Alt loading monitored area status",
      error: "Alt monitored area status could not be loaded.",
      empty: "Alt no monitored area status is currently available.",
      online: "Alt Online",
      offline: "Alt Offline",
      temperature: "Alt Temperature",
      humidity: "Alt Relative Humidity",
      activeAlarms: "Alt Active Alarms",
      lastUpdate: "Alt Last Update",
      unavailable: "Alt Unavailable",

      status: {
        NORMAL: "Alt Normal",
        WARNING: "Alt Warning",
        CRITICAL: "Alt Critical",
        UNKNOWN: "Alt Unknown",
      },
    },

    latestTelemetry: {
      title: "Alt latest telemetry",
      description:
        "Alt most recent validated sensor readings across monitored areas.",
      loading: "Alt loading latest telemetry",
      error: "Alt latest telemetry could not be loaded.",
      empty: "Alt no latest telemetry is currently available.",
      site: "Alt Site",
      device: "Alt Device",
      time: "Alt Reading Time",
    },

    alarmStatistics: {
      title: "Alt alarm statistics",
      description:
        "Alt current alarm lifecycle and severity distribution across monitored areas.",
      loading: "Alt loading alarm statistics",
      error: "Alt alarm statistics could not be loaded.",

      lifecycle: {
        title: "Alt Lifecycle",
        active: "Alt Active",
        acknowledged: "Alt Acknowledged",
        recovered: "Alt Recovered",
      },

      severity: {
        title: "Alt Severity",
        critical: "Alt Critical",
        warning: "Alt Warning",
        info: "Alt Info",
      },
    },

    loading: "Alt loading dashboard summary",
    error: "Alt dashboard summary error",
    retry: "Alt retry",
  },

  monitoredAreas: {
    title: "Alt monitored areas operational title",
    description: "Alt monitored areas operational description",
    loading: "Alt loading monitored areas",
    error: "Alt monitored areas error",
    refresh: "Alt refresh monitored areas",
    refreshing: "Alt refreshing monitored areas",
    retry: "Alt retry monitored areas",
    noSites: "Alt no Sites configured",
    noAreas: "Alt no Monitored Areas configured",
    noSensors: "Alt no Sensors configured",

    site: {
      active: "Alt Active Site",
      inactive: "Alt Inactive Site",
    },

    area: {
      active: "Alt Active Area",
      inactive: "Alt Inactive Area",
    },

    sensor: {
      enabled: "Alt Enabled",
      disabled: "Alt Disabled",
      type: "Alt Sensor Type",
      unit: "Alt Unit",
      channel: "Alt Channel",

      thresholds: {
        title: "Alt configured thresholds",
        description: "Alt configuration-only threshold description",
        minValue: "Alt Minimum Value",
        warningLow: "Alt Warning Low",
        alarmLow: "Alt Alarm Low",
        warningHigh: "Alt Warning High",
        alarmHigh: "Alt Alarm High",
        maxValue: "Alt Maximum Value",
        notConfigured: "Alt Not Configured",
      },
    },
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

  user: {
    id: 1,
    username: "admin",
    role: "ADMIN",
  },

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

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
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
      </LocalizationProvider>
    </QueryClientProvider>,
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
      screen.getByRole("heading", {
        name: "Alternative foundation title",
      }),
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
      screen.getByRole("link", {
        name: "Alternative return to workspace",
      }),
    ).toHaveAttribute("href", "/");
  });

  it("renders representative shell and page components with alternative resources", () => {
    renderWithAlternativeResources("/");

    expect(
      screen.getByRole("heading", {
        name: "Alt workspace title",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("navigation", {
        name: "Alt primary navigation",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Alt Dashboard",
      }),
    ).toBeInTheDocument();
  });

  it("renders the operational dashboard through localization resources", () => {
    renderWithAlternativeResources("/dashboard");

    expect(
      screen.getByRole("heading", {
        name: "Alt operational dashboard",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Alt operational dashboard description"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Alt refresh dashboard",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Alt loading dashboard summary"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Alt monitored area status",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Alt loading monitored area status"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Alt latest telemetry",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Alt loading latest telemetry"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Alt alarm statistics",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Alt loading alarm statistics"),
    ).toBeInTheDocument();
  });

  it("renders the operational monitored areas page through localization resources", () => {
    renderWithAlternativeResources("/monitored-areas");

    expect(
      screen.getByRole("heading", {
        name: "Alt monitored areas operational title",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Alt monitored areas operational description"),
    ).toBeInTheDocument();

    expect(screen.getByText("Alt loading monitored areas")).toBeInTheDocument();
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
      screen.getByRole("heading", {
        name: "Alt workspace title",
      }),
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
      screen.getByRole("heading", {
        name: "Alt alarms title",
      }),
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
      screen.getByRole("navigation", {
        name: "Alt primary navigation",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Alt Workspace",
      }),
    ).toBeInTheDocument();
  });
});

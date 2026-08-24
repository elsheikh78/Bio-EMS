import type { Direction } from "@mui/material/styles";

export type SupportedLanguage = "en" | "ar";
export type TextDirection = Direction;

export interface TranslationResources {
  authentication: {
    loginTitle: string;
    username: string;
    password: string;
    signIn: string;
    signingIn: string;
    checkingSession: string;
    logout: string;
    retry: string;
    restorationTitle: string;
    restorationDescription: string;
    errors: {
      "invalid-credentials": string;
      validation: string;
      network: string;
      server: string;
      "malformed-response": string;
      storage: string;
    };
  };

  foundation: {
    title: string;
    description: string;
    deferredDescription: string;
  };

  notFound: {
    title: string;
    action: string;
  };

  notAuthorized: {
    title: string;
    description: string;
  };

  shell: {
    productName: string;
    openNavigation: string;
    primaryNavigation: string;
    skipToContent: string;
  };

  navigation: {
    workspace: string;
    dashboard: string;
    monitoredAreas: string;
    alarms: string;
    devices: string;
    sensorsCalibration: string;
    reports: string;
    configuration: string;
    users: string;
  };

  workspace: {
    title: string;
    description: string;
  };

  dashboard: {
    title: string;
    description: string;
    refresh: string;
    refreshing: string;

    summary: {
      totalSites: string;
      totalRooms: string;
      totalDevices: string;
      totalSensors: string;
      activeAlarms: string;
      offlineDevices: string;
    };

    operationalOverview?: {
      title: string;
      description: string;
      deviceTitle: string;
      deviceDescription: string;
      online: string;
      stale: string;
      offline: string;
      neverSeen: string;
      notOperational: string;
      statusEvidence: string;
      severityTitle: string;
      severityDescription: string;
      critical: string;
      warning: string;
      info: string;
      total: string;
      noData: string;
      trendUnavailable: string;
      partialData: string;
      panelUnavailable: string;
    };

    rooms: {
      title: string;
      description: string;
      loading: string;
      error: string;
      empty: string;
      online: string;
      offline: string;
      temperature: string;
      humidity: string;
      activeAlarms: string;
      lastUpdate: string;
      unavailable: string;

      status: {
        NORMAL: string;
        WARNING: string;
        CRITICAL: string;
        UNKNOWN: string;
      };
    };

    latestTelemetry: {
      title: string;
      description: string;
      loading: string;
      error: string;
      empty: string;
      site: string;
      device: string;
      time: string;
    };

    alarmStatistics: {
      title: string;
      description: string;
      loading: string;
      error: string;

      lifecycle: {
        title: string;
        active: string;
        acknowledged: string;
        recovered: string;
      };

      severity: {
        title: string;
        critical: string;
        warning: string;
        info: string;
      };
    };

    loading: string;
    error: string;
    retry: string;
  };

  monitoredAreas: {
    title: string;
    description: string;
    loading: string;
    error: string;
    refresh: string;
    refreshing: string;
    retry: string;
    noSites: string;
    noAreas: string;
    noSensors: string;

    site: {
      active: string;
      inactive: string;
    };

    area: {
      active: string;
      inactive: string;
    };

    sensor: {
      enabled: string;
      disabled: string;
      type: string;
      unit: string;
      channel: string;

      thresholds: {
        title: string;
        description: string;
        minValue: string;
        warningLow: string;
        alarmLow: string;
        warningHigh: string;
        alarmHigh: string;
        maxValue: string;
        notConfigured: string;
      };
    };
  };

  errorBoundary: {
    title: string;
    reload: string;
  };
}

export const englishResources = {
  authentication: {
    loginTitle: "Sign in to BIO-EMS",
    username: "Username",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in",
    checkingSession: "Verifying your session",
    logout: "Log out",
    retry: "Retry",

    restorationTitle: "Session verification is temporarily unavailable",

    restorationDescription:
      "Protected content remains hidden. Retry verification or log out.",

    errors: {
      "invalid-credentials": "The username or password is invalid.",

      validation: "Check the entered credentials and try again.",

      network: "The service could not be reached. Try again.",

      server: "The service could not complete sign in. Try again.",

      "malformed-response": "The sign-in response could not be verified.",

      storage: "The session could not be stored securely in this browser tab.",
    },
  },

  foundation: {
    title: "BIO-EMS frontend foundation",

    description:
      "Architecture and quality foundations are ready for feature development.",

    deferredDescription:
      "Operational screens, authentication, and the application shell are intentionally deferred to later Sprint 14 stories.",
  },

  notFound: {
    title: "Page not found",
    action: "Return to workspace",
  },

  notAuthorized: {
    title: "Not authorized",
    description: "Your current role does not permit access to this page.",
  },

  shell: {
    productName: "BIO-EMS",
    openNavigation: "Open primary navigation",
    primaryNavigation: "Primary navigation",
    skipToContent: "Skip to main content",
  },

  navigation: {
    workspace: "Workspace",
    dashboard: "Dashboard",
    monitoredAreas: "Monitored Areas",
    alarms: "Alarms",
    devices: "Devices",
    sensorsCalibration: "Sensors & Calibration",
    reports: "Reports",
    configuration: "Configuration",
    users: "Users",
  },

  workspace: {
    title: "Operational workspace",

    description:
      "Open the available operational and administration workflows for the current Site scope.",
  },

  dashboard: {
    title: "Operational dashboard",

    description:
      "Current monitoring coverage and operational health across BIO-EMS.",

    refresh: "Refresh dashboard",
    refreshing: "Refreshing dashboard",

    summary: {
      totalSites: "Sites",
      totalRooms: "Monitored areas",
      totalDevices: "Devices",
      totalSensors: "Sensors",
      activeAlarms: "Active alarms",
      offlineDevices: "Offline devices",
    },

    operationalOverview: {
      title: "Operational overview",
      description:
        "A current, evidence-based view of device health and alarm severity.",
      deviceTitle: "Device connectivity",
      deviceDescription:
        "Current authoritative communication and lifecycle distribution.",
      online: "Online",
      stale: "Stale",
      offline: "Offline",
      neverSeen: "Never seen",
      notOperational: "Not operational",
      statusEvidence:
        "Online, Stale, Offline, Never seen, and Not operational are reported independently.",
      severityTitle: "Alarm severity",
      severityDescription: "Current recorded alarm severity distribution.",
      critical: "Critical",
      warning: "Warning",
      info: "Information",
      total: "Total",
      noData: "No current records are available for this distribution.",
      trendUnavailable:
        "Historical trends will appear after a versioned time-range contract is released.",
      partialData:
        "Some operational panels are unavailable. Available evidence remains visible while the failed source is retried.",
      panelUnavailable: "This panel's current data source is unavailable.",
    },

    rooms: {
      title: "Monitored area status",

      description:
        "Current environmental status for monitored rooms and areas.",

      loading: "Loading monitored area status",

      error: "Monitored area status could not be loaded.",

      empty: "No monitored area status is currently available.",

      online: "Online",
      offline: "Offline",
      temperature: "Temperature",
      humidity: "Relative humidity",
      activeAlarms: "Active alarms",
      lastUpdate: "Last update",
      unavailable: "Unavailable",

      status: {
        NORMAL: "Normal",
        WARNING: "Warning",
        CRITICAL: "Critical",
        UNKNOWN: "Unknown",
      },
    },

    latestTelemetry: {
      title: "Latest telemetry",

      description:
        "Most recent validated sensor readings received across monitored areas.",

      loading: "Loading latest telemetry",

      error: "Latest telemetry could not be loaded.",

      empty: "No latest telemetry is currently available.",

      site: "Site",
      device: "Device",
      time: "Reading time",
    },

    alarmStatistics: {
      title: "Alarm statistics",

      description:
        "Current alarm lifecycle and severity distribution across monitored areas.",

      loading: "Loading alarm statistics",

      error: "Alarm statistics could not be loaded.",

      lifecycle: {
        title: "Lifecycle",
        active: "Active",
        acknowledged: "Acknowledged",
        recovered: "Recovered",
      },

      severity: {
        title: "Severity",
        critical: "Critical",
        warning: "Warning",
        info: "Info",
      },
    },

    loading: "Loading dashboard summary",

    error: "Dashboard summary could not be loaded.",

    retry: "Retry",
  },

  monitoredAreas: {
    title: "Monitored Areas",

    description:
      "Configured monitoring hierarchy across Sites, Monitored Areas, and Sensors.",

    loading: "Loading monitored areas",

    error: "Unable to load monitored areas configuration.",

    refresh: "Refresh monitored areas",
    refreshing: "Refreshing monitored areas",
    retry: "Retry",

    noSites: "No Sites are currently configured.",

    noAreas: "No Monitored Areas are configured for this Site.",

    noSensors: "No Sensors are configured for this Monitored Area.",

    site: {
      active: "Active Site",
      inactive: "Inactive Site",
    },

    area: {
      active: "Active Area",
      inactive: "Inactive Area",
    },

    sensor: {
      enabled: "Enabled",
      disabled: "Disabled",
      type: "Sensor Type",
      unit: "Unit",
      channel: "Channel",

      thresholds: {
        title: "Configured thresholds",

        description:
          "Configuration values only. These values do not represent live telemetry, connectivity health, or current alarm state.",

        minValue: "Minimum value",
        warningLow: "Warning low",
        alarmLow: "Alarm low",
        warningHigh: "Warning high",
        alarmHigh: "Alarm high",
        maxValue: "Maximum value",
        notConfigured: "Not configured",
      },
    },
  },

  errorBoundary: {
    title: "The application could not start",
    reload: "Reload",
  },
} satisfies TranslationResources;

export const localizationDefaults = {
  language: "en",
  direction: "ltr",
} satisfies {
  language: SupportedLanguage;
  direction: TextDirection;
};

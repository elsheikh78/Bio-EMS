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
    configuration: string;
    users: string;
  };

  workspace: {
    title: string;
    description: string;
  };

  placeholders: {
    dashboard: {
      title: string;
      description: string;
    };

    monitoredAreas: {
      title: string;
      description: string;
    };

    alarms: {
      title: string;
      description: string;
    };

    devices: {
      title: string;
      description: string;
    };

    configuration: {
      title: string;
      description: string;
    };

    users: {
      title: string;
      description: string;
    };
  };

  dashboard: {
    title: string;
    description: string;

    summary: {
      totalSites: string;
      totalRooms: string;
      totalDevices: string;
      totalSensors: string;
      activeAlarms: string;
      offlineDevices: string;
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

    loading: string;
    error: string;
    retry: string;
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
    configuration: "Configuration",
    users: "Users",
  },

  workspace: {
    title: "Operational workspace",

    description:
      "The application shell is ready. Operational features remain explicitly staged for later Sprint 14 stories.",
  },

  dashboard: {
    title: "Operational dashboard",

    description:
      "Current monitoring coverage and operational health across BIO-EMS.",

    summary: {
      totalSites: "Sites",
      totalRooms: "Monitored areas",
      totalDevices: "Devices",
      totalSensors: "Sensors",
      activeAlarms: "Active alarms",
      offlineDevices: "Offline devices",
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

    loading: "Loading dashboard summary",

    error: "Dashboard summary could not be loaded.",

    retry: "Retry",
  },

  placeholders: {
    dashboard: {
      title: "Dashboard",

      description: "Dashboard data and widgets are not implemented in S14-02.",
    },

    monitoredAreas: {
      title: "Monitored Areas",

      description:
        "Monitored Areas is the presentation name for existing Room contracts; no Asset or Monitoring Point model is introduced.",
    },

    alarms: {
      title: "Alarms",

      description: "Operational alarm views are not implemented in S14-02.",
    },

    devices: {
      title: "Devices",

      description: "Operational device views are not implemented in S14-02.",
    },

    configuration: {
      title: "Configuration",

      description:
        "Configuration management screens are not implemented in S14-02.",
    },

    users: {
      title: "Users",

      description:
        "User management operations are not implemented in this frontend story.",
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

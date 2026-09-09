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

  notFound: {
    title: string;
    action: string;
  };

  notAuthorized: {
    title: string;
    description: string;
  };

  opening: {
    title: string;
    subtitle: string;
    loading: string;
  };

  shell: {
    productName: string;
    openNavigation: string;
    primaryNavigation: string;
    skipToContent: string;
    switchToDark: string;
    switchToLight: string;
  };

  navigation: {
    workspace: string;
    dashboard: string;
    liveBoard: string;
    monitoredAreas: string;
    alarms: string;
    notificationDeliveries: string;
    devices: string;
    sensorsCalibration: string;
    reports: string;
    commissioning: string;
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
    compact: {
      scope: string;
      customerName: string;
      liveEvidence: string;
      healthy: string;
      attention: string;
      openAreas: string;
      currentProfile: string;
      currentProfileDescription: string;
      currentProfileAria: string;
      readingsDisplayed: string;
      priorityAreas: string;
      priorityDescription: string;
      detailedEvidence: string;
    };

    summary: {
      totalSites: string;
      totalRooms: string;
      totalDevices: string;
      totalSensors: string;
      activeAlarms: string;
      offlineDevices: string;
      notOperationalDevices: string;
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

  liveBoard: {
    title: string;
    description: string;
    live: string;
    autoRefresh: string;
    lastUpdate: string;
    refresh: string;
    refreshing: string;
    retry: string;
    loading: string;
    error: string;
    empty: string;
    noMatches: string;
    allSites: string;
    allStatuses: string;
    search: string;
    siteFilter: string;
    statusFilter: string;
    density: string;
    comfortable: string;
    compact: string;
    normal: string;
    warning: string;
    alarm: string;
    offline: string;
    temperature: string;
    humidity: string;
    activeAlarms: string;
    unavailable: string;
    communication: string;
    openDetails: string;
    systemHealth: string;
    healthy: string;
    alarmFocus: string;
    fullScreen: string;
    exitFullScreen: string;
    currentReading: string;
    allowedRange: string;
    sensors: string;
    last24HourMin: string;
    last24HourMax: string;
    last24HourTrend: string;
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

  notFound: {
    title: "Page not found",
    action: "Return to workspace",
  },

  notAuthorized: {
    title: "Not authorized",
    description: "Your current role does not permit access to this page.",
  },

  opening: {
    title: "BIO-EMS secure opening experience",
    subtitle: "Environmental Monitoring System",
    loading: "Preparing your secure monitoring environment…",
  },

  shell: {
    productName: "BIO-EMS",
    openNavigation: "Open primary navigation",
    primaryNavigation: "Primary navigation",
    skipToContent: "Skip to main content",
    switchToDark: "Switch to dark monitoring theme",
    switchToLight: "Switch to light theme",
  },

  navigation: {
    workspace: "Workspace",
    dashboard: "Dashboard",
    liveBoard: "Live Monitoring Wall",
    monitoredAreas: "Monitored Areas",
    alarms: "Alarms",
    notificationDeliveries: "Notification Delivery",
    devices: "Devices",
    sensorsCalibration: "Sensors & Calibration",
    reports: "Reports",
    commissioning: "Commissioning",
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
    compact: {
      scope: "Customer / operational scope",
      customerName: "BIO EGYPT",
      liveEvidence: "Live authorized evidence",
      healthy: "No current priority exceptions",
      attention: "Operational attention required",
      openAreas: "Open live monitoring wall",
      currentProfile: "Current temperature profile",
      currentProfileDescription:
        "Latest verified reading per Sensor — current snapshot, not a historical trend.",
      currentProfileAria: "Current Sensor reading profile",
      readingsDisplayed: "current Sensor readings displayed",
      priorityAreas: "Priority areas",
      priorityDescription: "Ordered by current operational exceptions",
      detailedEvidence: "Detailed operational evidence",
    },

    summary: {
      totalSites: "Sites",
      totalRooms: "Monitored areas",
      totalDevices: "Devices",
      totalSensors: "Sensors",
      activeAlarms: "Active alarms",
      offlineDevices: "Active devices offline",
      notOperationalDevices: "Disabled / not operational devices",
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
      severityTitle: "Historical alarm severity",
      severityDescription:
        "Severity distribution across recorded Alarm history; this is not the active Alarm count.",
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

  liveBoard: {
    title: "Live Monitoring Wall",
    description: "Current operational state across monitored areas.",
    live: "LIVE",
    autoRefresh: "Automatic updates active",
    lastUpdate: "Latest board update",
    refresh: "Refresh board",
    refreshing: "Refreshing board",
    retry: "Retry",
    loading: "Loading live monitored-area status",
    error: "Live monitored-area status could not be loaded.",
    empty: "No live monitored-area status is currently available.",
    noMatches: "No monitored areas match the selected filters.",
    allSites: "All Sites",
    allStatuses: "All statuses",
    search: "Search monitored areas",
    siteFilter: "Filter by Site",
    statusFilter: "Filter by status",
    density: "Grid density",
    comfortable: "Comfortable",
    compact: "Compact",
    normal: "Normal",
    warning: "Warning",
    alarm: "Alarm",
    offline: "Offline",
    temperature: "Temperature",
    humidity: "Relative humidity",
    activeAlarms: "Active alarms",
    unavailable: "Unavailable",
    communication: "Communication",
    openDetails: "Open detailed monitored areas",
    systemHealth: "Overall system health",
    healthy: "Healthy",
    alarmFocus: "Focus alarms",
    fullScreen: "Full screen",
    exitFullScreen: "Exit full screen",
    currentReading: "Current reading",
    allowedRange: "Configured range",
    sensors: "Sensors",
    last24HourMin: "24h minimum",
    last24HourMax: "24h maximum",
    last24HourTrend: "24-hour temperature trend",
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

export const arabicResources = {
  authentication: {
    loginTitle: "تسجيل الدخول إلى BIO-EMS",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    signIn: "تسجيل الدخول",
    signingIn: "جارٍ تسجيل الدخول",
    checkingSession: "جارٍ التحقق من الجلسة",
    logout: "تسجيل الخروج",
    retry: "إعادة المحاولة",
    restorationTitle: "التحقق من الجلسة غير متاح مؤقتًا",
    restorationDescription:
      "يظل المحتوى المحمي مخفيًا. أعد محاولة التحقق أو سجّل الخروج.",
    errors: {
      "invalid-credentials": "اسم المستخدم أو كلمة المرور غير صحيحة.",
      validation: "راجع بيانات الدخول ثم حاول مرة أخرى.",
      network: "تعذر الوصول إلى الخدمة. حاول مرة أخرى.",
      server: "تعذر على الخدمة إكمال تسجيل الدخول. حاول مرة أخرى.",
      "malformed-response": "تعذر التحقق من استجابة تسجيل الدخول.",
      storage: "تعذر حفظ الجلسة بأمان في علامة التبويب الحالية.",
    },
  },
  notFound: { title: "الصفحة غير موجودة", action: "العودة إلى مساحة العمل" },
  notAuthorized: {
    title: "غير مصرح بالدخول",
    description: "صلاحيات دورك الحالي لا تسمح بالوصول إلى هذه الصفحة.",
  },
  opening: {
    title: "شاشة بدء BIO-EMS الآمنة",
    subtitle: "نظام المراقبة البيئية",
    loading: "جارٍ تجهيز بيئة المراقبة الآمنة…",
  },
  shell: {
    productName: "BIO-EMS",
    openNavigation: "فتح قائمة التنقل الرئيسية",
    primaryNavigation: "التنقل الرئيسي",
    skipToContent: "الانتقال إلى المحتوى الرئيسي",
    switchToDark: "التبديل إلى سمة المراقبة الداكنة",
    switchToLight: "التبديل إلى السمة الفاتحة",
  },
  navigation: {
    workspace: "مساحة العمل",
    dashboard: "لوحة المتابعة",
    liveBoard: "جدار المراقبة الحية",
    monitoredAreas: "المناطق المراقبة",
    alarms: "الإنذارات",
    notificationDeliveries: "إرسال الإشعارات",
    devices: "الأجهزة",
    sensorsCalibration: "الحساسات والمعايرة",
    reports: "التقارير",
    commissioning: "التشغيل المبدئي",
    configuration: "الإعدادات",
    users: "المستخدمون",
  },
  workspace: {
    title: "مساحة العمل التشغيلية",
    description:
      "افتح إجراءات التشغيل والإدارة المتاحة ضمن نطاق الموقع الحالي.",
  },
  dashboard: {
    title: "لوحة المتابعة التشغيلية",
    description: "التغطية الحالية للمراقبة والحالة التشغيلية عبر BIO-EMS.",
    refresh: "تحديث لوحة المتابعة",
    refreshing: "جارٍ تحديث لوحة المتابعة",
    compact: {
      scope: "العميل / النطاق التشغيلي",
      customerName: "BIO EGYPT",
      liveEvidence: "أدلة تشغيلية حية ومصرح بها",
      healthy: "لا توجد استثناءات ذات أولوية حاليًا",
      attention: "توجد حالات تشغيلية تتطلب الانتباه",
      openAreas: "فتح جدار المراقبة الحية",
      currentProfile: "ملف درجات الحرارة الحالي",
      currentProfileDescription:
        "أحدث قراءة معتمدة لكل حساس — لقطة حالية وليست اتجاهًا تاريخيًا.",
      currentProfileAria: "ملف قراءات الحساسات الحالية",
      readingsDisplayed: "قراءات حساسات حالية معروضة",
      priorityAreas: "المناطق ذات الأولوية",
      priorityDescription: "مرتبة حسب الاستثناءات التشغيلية الحالية",
      detailedEvidence: "الأدلة التشغيلية التفصيلية",
    },
    summary: {
      totalSites: "المواقع",
      totalRooms: "المناطق المراقبة",
      totalDevices: "الأجهزة",
      totalSensors: "الحساسات",
      activeAlarms: "الإنذارات النشطة",
      offlineDevices: "أجهزة مفعّلة غير متصلة",
      notOperationalDevices: "أجهزة معطّلة / غير تشغيلية",
    },
    operationalOverview: {
      title: "نظرة عامة تشغيلية",
      description: "عرض حالي قائم على الأدلة لحالة الأجهزة وشدة الإنذارات.",
      deviceTitle: "اتصال الأجهزة",
      deviceDescription: "التوزيع الحالي المعتمد لحالة الاتصال ودورة الحياة.",
      online: "متصل",
      stale: "بيانات متأخرة",
      offline: "غير متصل",
      neverSeen: "لم يتصل سابقًا",
      notOperational: "غير تشغيلي",
      statusEvidence:
        "تُعرض حالات متصل، وبيانات متأخرة، وغير متصل، ولم يتصل سابقًا، وغير تشغيلي بصورة مستقلة.",
      severityTitle: "شدة الإنذارات التاريخية",
      severityDescription:
        "توزيع الشدة عبر سجل الإنذارات، ولا يمثل عدد الإنذارات النشطة حاليًا.",
      critical: "حرج",
      warning: "تحذير",
      info: "معلومات",
      total: "الإجمالي",
      noData: "لا توجد سجلات حالية لهذا التوزيع.",
      trendUnavailable:
        "ستظهر الاتجاهات التاريخية بعد إصدار عقد نطاق زمني مُرقّم.",
      partialData:
        "بعض لوحات التشغيل غير متاحة. تظل الأدلة المتاحة ظاهرة أثناء إعادة محاولة المصدر المتعثر.",
      panelUnavailable: "مصدر البيانات الحالي لهذه اللوحة غير متاح.",
    },
    rooms: {
      title: "حالة المناطق المراقبة",
      description: "الحالة البيئية الحالية للغرف والمناطق المراقبة.",
      loading: "جارٍ تحميل حالة المناطق المراقبة",
      error: "تعذر تحميل حالة المناطق المراقبة.",
      empty: "لا توجد حالة متاحة حاليًا للمناطق المراقبة.",
      online: "متصل",
      offline: "غير متصل",
      temperature: "درجة الحرارة",
      humidity: "الرطوبة النسبية",
      activeAlarms: "الإنذارات النشطة",
      lastUpdate: "آخر تحديث",
      unavailable: "غير متاح",
      status: {
        NORMAL: "طبيعي",
        WARNING: "تحذير",
        CRITICAL: "حرج",
        UNKNOWN: "غير معروف",
      },
    },
    latestTelemetry: {
      title: "أحدث القراءات",
      description:
        "أحدث قراءات الحساسات المعتمدة المستلمة من المناطق المراقبة.",
      loading: "جارٍ تحميل أحدث القراءات",
      error: "تعذر تحميل أحدث القراءات.",
      empty: "لا توجد قراءات حديثة متاحة حاليًا.",
      site: "الموقع",
      device: "الجهاز",
      time: "وقت القراءة",
    },
    alarmStatistics: {
      title: "إحصاءات الإنذارات",
      description: "توزيع دورة حياة الإنذارات وشدتها عبر المناطق المراقبة.",
      loading: "جارٍ تحميل إحصاءات الإنذارات",
      error: "تعذر تحميل إحصاءات الإنذارات.",
      lifecycle: {
        title: "دورة الحياة",
        active: "نشط",
        acknowledged: "تم الإقرار",
        recovered: "عاد للوضع الطبيعي",
      },
      severity: {
        title: "الشدة",
        critical: "حرج",
        warning: "تحذير",
        info: "معلومات",
      },
    },
    loading: "جارٍ تحميل ملخص لوحة المتابعة",
    error: "تعذر تحميل ملخص لوحة المتابعة.",
    retry: "إعادة المحاولة",
  },
  liveBoard: {
    title: "جدار المراقبة الحية",
    description: "الحالة التشغيلية الحالية عبر المناطق المراقبة.",
    live: "مباشر",
    autoRefresh: "التحديث التلقائي نشط",
    lastUpdate: "آخر تحديث للوحة",
    refresh: "تحديث اللوحة",
    refreshing: "جارٍ تحديث اللوحة",
    retry: "إعادة المحاولة",
    loading: "جارٍ تحميل الحالة الحية للمناطق المراقبة",
    error: "تعذر تحميل الحالة الحية للمناطق المراقبة.",
    empty: "لا توجد حالة حية متاحة حاليًا للمناطق المراقبة.",
    noMatches: "لا توجد مناطق مراقبة تطابق عوامل التصفية.",
    allSites: "كل المواقع",
    allStatuses: "كل الحالات",
    search: "البحث في المناطق المراقبة",
    siteFilter: "التصفية حسب الموقع",
    statusFilter: "التصفية حسب الحالة",
    density: "كثافة الشبكة",
    comfortable: "مريحة",
    compact: "مضغوطة",
    normal: "طبيعي",
    warning: "تحذير",
    alarm: "إنذار",
    offline: "غير متصل",
    temperature: "درجة الحرارة",
    humidity: "الرطوبة النسبية",
    activeAlarms: "الإنذارات النشطة",
    unavailable: "غير متاح",
    communication: "الاتصال",
    openDetails: "فتح تفاصيل المناطق المراقبة",
    systemHealth: "الصحة العامة للنظام",
    healthy: "سليم",
    alarmFocus: "التركيز على الإنذارات",
    fullScreen: "ملء الشاشة",
    exitFullScreen: "الخروج من ملء الشاشة",
    currentReading: "القراءة الحالية",
    allowedRange: "النطاق المُعد",
    sensors: "الحساسات",
    last24HourMin: "أدنى قراءة خلال 24 ساعة",
    last24HourMax: "أعلى قراءة خلال 24 ساعة",
    last24HourTrend: "اتجاه الحرارة خلال 24 ساعة",
  },
  monitoredAreas: {
    title: "المناطق المراقبة",
    description: "هيكل المراقبة المُعد للمواقع والمناطق والحساسات.",
    loading: "جارٍ تحميل المناطق المراقبة",
    error: "تعذر تحميل إعدادات المناطق المراقبة.",
    refresh: "تحديث المناطق المراقبة",
    refreshing: "جارٍ تحديث المناطق المراقبة",
    retry: "إعادة المحاولة",
    noSites: "لا توجد مواقع مُعدة حاليًا.",
    noAreas: "لا توجد مناطق مراقبة مُعدة لهذا الموقع.",
    noSensors: "لا توجد حساسات مُعدة لهذه المنطقة المراقبة.",
    site: { active: "موقع نشط", inactive: "موقع غير نشط" },
    area: { active: "منطقة نشطة", inactive: "منطقة غير نشطة" },
    sensor: {
      enabled: "مفعّل",
      disabled: "معطّل",
      type: "نوع الحساس",
      unit: "الوحدة",
      channel: "القناة",
      thresholds: {
        title: "الحدود المُعدة",
        description:
          "قيم إعداد فقط، ولا تمثل قراءة حية أو حالة الاتصال أو حالة الإنذار الحالية.",
        minValue: "الحد الأدنى",
        warningLow: "التحذير المنخفض",
        alarmLow: "الإنذار المنخفض",
        warningHigh: "التحذير المرتفع",
        alarmHigh: "الإنذار المرتفع",
        maxValue: "الحد الأقصى",
        notConfigured: "غير مُعد",
      },
    },
  },
  errorBoundary: {
    title: "تعذر بدء تشغيل التطبيق",
    reload: "إعادة التحميل",
  },
} satisfies TranslationResources;

export const localizationDefaults = {
  language: "en",
  direction: "ltr",
} satisfies {
  language: SupportedLanguage;
  direction: TextDirection;
};

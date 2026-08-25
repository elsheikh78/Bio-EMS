export const REPORT_CONTRACT_VERSION = "1.0" as const;

export const reportCatalogue = {
  contractVersion: REPORT_CONTRACT_VERSION,

  limits: {
    previewMaximumDays: 31,
    previewMaximumPoints: 5000,
    rawCsvMaximumDays: 7,
    rawCsvMaximumRows: 250000,
    aggregatedMaximumDays: 366,
    aggregatedMaximumRows: 25000,
    recordReportMaximumDays: 366,
  },

  formats: ["PREVIEW", "PDF", "CSV"],

  reportTypes: [
    {
      id: "TEMP-PERFORMANCE",
      title: "Temperature Performance",
      readiness: "AVAILABLE",
      previewAvailable: true,
      exportFormats: [],
      unavailableReason: null,
    },

    {
      id: "ALARM-HISTORY",
      previewAvailable: false,
      exportFormats: [],
      unavailableReason: "LIFECYCLE_PROJECTION_REQUIRED",
    },

    {
      id: "CALIBRATION-HISTORY",
      title: "Calibration Status and History",
      readiness: "AVAILABLE",
      previewAvailable: true,
      exportFormats: ["CSV", "PDF"],
      unavailableReason: null,
    },

    {
      id: "DEVICE-HEALTH",
      title: "Device Communication Health",
      readiness: "BLOCKED",
      previewAvailable: false,
      exportFormats: [],
      unavailableReason: "HISTORY_LEDGER_REQUIRED",
    },

    {
      id: "AUDIT-OPERATIONS",
      title: "Audit and Operations",
      readiness: "READY_FOR_IMPLEMENTATION",
      previewAvailable: false,
      exportFormats: [],
      unavailableReason: "OPERATIONS_REPORT_PROJECTION_REQUIRED",
    },
  ],
} as const;

export type ReportCatalogue = typeof reportCatalogue;
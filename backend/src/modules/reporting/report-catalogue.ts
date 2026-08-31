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
      exportFormats: ["CSV", "PDF"],
      unavailableReason: null,
    },

    {
      id: "ALARM-HISTORY",
      title: "Alarm History",
      readiness: "AVAILABLE",
      previewAvailable: true,
      exportFormats: ["CSV", "PDF"],
      unavailableReason: null,
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
      readiness: "AVAILABLE",
      previewAvailable: true,
      exportFormats: ["CSV", "PDF"],
      unavailableReason: null,
    },

    {
      id: "AUDIT-OPERATIONS",
      title: "Audit and Operations",
      readiness: "AVAILABLE",
      previewAvailable: true,
      exportFormats: ["CSV", "PDF"],
      unavailableReason: null,
    },
  ],
} as const;

export type ReportCatalogue = typeof reportCatalogue;

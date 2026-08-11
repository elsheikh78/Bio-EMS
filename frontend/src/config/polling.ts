export const POLLING_INTERVALS_MS = {
  alarms: 15_000,
  telemetry: 15_000,
  monitoredAreaStatus: 15_000,
  dashboardSummary: 60_000,
} as const;

export const DATA_FRESHNESS_LABELS = ["Fresh", "Stale", "No Data"] as const;

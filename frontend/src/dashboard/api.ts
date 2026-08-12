import type { AuthenticationContextValue } from "../auth/AuthenticationContext";
import {
  dashboardAlarmStatisticsSchema,
  dashboardRoomStatusesSchema,
  dashboardSummarySchema,
  latestTelemetrySchema,
  type DashboardAlarmStatistics,
  type DashboardRoomStatus,
  type DashboardSummary,
  type LatestTelemetryRecord,
} from "./contracts";

type ProtectedRequest = AuthenticationContextValue["protectedRequest"];

export interface DashboardApi {
  getSummary: () => Promise<DashboardSummary>;
  getLatestTelemetry: () => Promise<LatestTelemetryRecord[]>;
  getRoomStatuses: () => Promise<DashboardRoomStatus[]>;
  getAlarmStatistics: () => Promise<DashboardAlarmStatistics>;
}

export function createDashboardApi(
  protectedRequest: ProtectedRequest,
): DashboardApi {
  return {
    async getSummary() {
      const response = await protectedRequest<unknown>("/dashboard/summary");
      return dashboardSummarySchema.parse(response);
    },

    async getLatestTelemetry() {
      const response = await protectedRequest<unknown>(
        "/dashboard/latest-telemetry",
      );
      return latestTelemetrySchema.parse(response);
    },

    async getRoomStatuses() {
      const response = await protectedRequest<unknown>(
        "/dashboard/rooms/status",
      );
      return dashboardRoomStatusesSchema.parse(response);
    },

    async getAlarmStatistics() {
      const response = await protectedRequest<unknown>(
        "/dashboard/alarm-statistics",
      );
      return dashboardAlarmStatisticsSchema.parse(response);
    },
  };
}

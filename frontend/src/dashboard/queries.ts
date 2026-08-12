import { useQuery } from "@tanstack/react-query";
import { useAuthentication } from "../auth/useAuthentication";
import { createDashboardApi } from "./api";

export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardQueryKeys.all, "summary"] as const,
  latestTelemetry: () =>
    [...dashboardQueryKeys.all, "latest-telemetry"] as const,
  roomStatuses: () => [...dashboardQueryKeys.all, "room-statuses"] as const,
  alarmStatistics: () =>
    [...dashboardQueryKeys.all, "alarm-statistics"] as const,
};

export function useDashboardSummary() {
  const { protectedRequest } = useAuthentication();
  const api = createDashboardApi(protectedRequest);

  return useQuery({
    queryKey: dashboardQueryKeys.summary(),
    queryFn: () => api.getSummary(),
  });
}

export function useLatestTelemetry() {
  const { protectedRequest } = useAuthentication();
  const api = createDashboardApi(protectedRequest);

  return useQuery({
    queryKey: dashboardQueryKeys.latestTelemetry(),
    queryFn: () => api.getLatestTelemetry(),
  });
}

export function useDashboardRoomStatuses() {
  const { protectedRequest } = useAuthentication();
  const api = createDashboardApi(protectedRequest);

  return useQuery({
    queryKey: dashboardQueryKeys.roomStatuses(),
    queryFn: () => api.getRoomStatuses(),
  });
}

export function useDashboardAlarmStatistics() {
  const { protectedRequest } = useAuthentication();
  const api = createDashboardApi(protectedRequest);

  return useQuery({
    queryKey: dashboardQueryKeys.alarmStatistics(),
    queryFn: () => api.getAlarmStatistics(),
  });
}

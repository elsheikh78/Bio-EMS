import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateCalibrationRecordInput } from "./contracts";
import { useAuthentication } from "../auth/useAuthentication";
import { createMonitoredAreasApi } from "./api";

export const monitoredAreasQueryKeys = {
  all: ["monitoredAreas"] as const,
  sites: () => [...monitoredAreasQueryKeys.all, "sites"] as const,
  rooms: () => [...monitoredAreasQueryKeys.all, "rooms"] as const,
  sensors: () => [...monitoredAreasQueryKeys.all, "sensors"] as const,
  calibrationHistory: (sensorUuid: string) =>
    [...monitoredAreasQueryKeys.all, "calibrations", sensorUuid] as const,
};

export function useSites() {
  const { protectedRequest } = useAuthentication();
  const api = createMonitoredAreasApi(protectedRequest);

  return useQuery({
    queryKey: monitoredAreasQueryKeys.sites(),
    queryFn: () => api.getSites(),
  });
}

export function useRooms() {
  const { protectedRequest } = useAuthentication();
  const api = createMonitoredAreasApi(protectedRequest);

  return useQuery({
    queryKey: monitoredAreasQueryKeys.rooms(),
    queryFn: () => api.getRooms(),
  });
}

export function useSensors() {
  const { protectedRequest } = useAuthentication();
  const api = createMonitoredAreasApi(protectedRequest);

  return useQuery({
    queryKey: monitoredAreasQueryKeys.sensors(),
    queryFn: () => api.getSensors(),
  });
}

export function useCalibrationHistory(sensorUuid?: string) {
  const { protectedRequest } = useAuthentication();
  const api = createMonitoredAreasApi(protectedRequest);

  return useQuery({
    queryKey: monitoredAreasQueryKeys.calibrationHistory(sensorUuid ?? ""),
    queryFn: () => api.getCalibrationHistory(sensorUuid!),
    enabled: Boolean(sensorUuid),
  });
}

export function useCreateCalibrationRecord(sensorUuid?: string) {
  const { protectedRequest } = useAuthentication();
  const queryClient = useQueryClient();
  const api = createMonitoredAreasApi(protectedRequest);

  return useMutation({
    mutationFn: (input: CreateCalibrationRecordInput) =>
      api.createCalibrationRecord(sensorUuid!, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: monitoredAreasQueryKeys.sensors(),
        }),
        queryClient.invalidateQueries({
          queryKey: monitoredAreasQueryKeys.calibrationHistory(
            sensorUuid ?? "",
          ),
        }),
      ]);
    },
  });
}

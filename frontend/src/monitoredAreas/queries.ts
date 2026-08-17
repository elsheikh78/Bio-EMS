import { useQuery } from "@tanstack/react-query";
import { useAuthentication } from "../auth/useAuthentication";
import { createMonitoredAreasApi } from "./api";

export const monitoredAreasQueryKeys = {
  all: ["monitoredAreas"] as const,
  sites: () => [...monitoredAreasQueryKeys.all, "sites"] as const,
  rooms: () => [...monitoredAreasQueryKeys.all, "rooms"] as const,
  sensors: () => [...monitoredAreasQueryKeys.all, "sensors"] as const,
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

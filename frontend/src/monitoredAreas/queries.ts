import { queryOptions } from "@tanstack/react-query";
import type { MonitoredAreasApi } from "./api";

export const monitoredAreasQueryKeys = {
  all: ["monitoredAreas"] as const,
  sites: () => [...monitoredAreasQueryKeys.all, "sites"] as const,
  rooms: () => [...monitoredAreasQueryKeys.all, "rooms"] as const,
  sensors: () => [...monitoredAreasQueryKeys.all, "sensors"] as const,
};

export function sitesQueryOptions(api: MonitoredAreasApi) {
  return queryOptions({
    queryKey: monitoredAreasQueryKeys.sites(),
    queryFn: api.getSites,
  });
}

export function roomsQueryOptions(api: MonitoredAreasApi) {
  return queryOptions({
    queryKey: monitoredAreasQueryKeys.rooms(),
    queryFn: api.getRooms,
  });
}

export function sensorsQueryOptions(api: MonitoredAreasApi) {
  return queryOptions({
    queryKey: monitoredAreasQueryKeys.sensors(),
    queryFn: api.getSensors,
  });
}

import type { AuthenticationContextValue } from "../auth/AuthenticationContext";
import {
  roomsSchema,
  sensorsSchema,
  sitesSchema,
  type Room,
  type Sensor,
  type Site,
} from "./contracts";

type ProtectedRequest = AuthenticationContextValue["protectedRequest"];

export interface MonitoredAreasApi {
  getSites: () => Promise<Site[]>;
  getRooms: () => Promise<Room[]>;
  getSensors: () => Promise<Sensor[]>;
}

export function createMonitoredAreasApi(
  protectedRequest: ProtectedRequest,
): MonitoredAreasApi {
  return {
    async getSites() {
      const response = await protectedRequest<unknown>("/sites");
      return sitesSchema.parse(response);
    },

    async getRooms() {
      const response = await protectedRequest<unknown>("/rooms");
      return roomsSchema.parse(response);
    },

    async getSensors() {
      const response = await protectedRequest<unknown>("/sensors");
      return sensorsSchema.parse(response);
    },
  };
}

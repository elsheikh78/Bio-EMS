import type { AuthenticationContextValue } from "../auth/AuthenticationContext";
import {
  roomsSchema,
  calibrationRecordSchema,
  calibrationRecordsSchema,
  sensorsSchema,
  sitesSchema,
  type Room,
  type CalibrationRecord,
  type CreateCalibrationRecordInput,
  type Sensor,
  type Site,
} from "./contracts";

type ProtectedRequest = AuthenticationContextValue["protectedRequest"];

export interface MonitoredAreasApi {
  getSites: () => Promise<Site[]>;
  getRooms: () => Promise<Room[]>;
  getSensors: () => Promise<Sensor[]>;
  getCalibrationHistory: (sensorUuid: string) => Promise<CalibrationRecord[]>;
  createCalibrationRecord: (
    sensorUuid: string,
    input: CreateCalibrationRecordInput,
  ) => Promise<CalibrationRecord>;
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

    async getCalibrationHistory(sensorUuid) {
      const response = await protectedRequest<unknown>(
        `/sensors/${sensorUuid}/calibrations`,
      );
      return calibrationRecordsSchema.parse(response);
    },

    async createCalibrationRecord(sensorUuid, input) {
      const response = await protectedRequest<unknown>(
        `/sensors/${sensorUuid}/calibrations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );
      return calibrationRecordSchema.parse(response);
    },
  };
}

import type { AuthenticationContextValue } from "../auth/AuthenticationContext";
import { acknowledgementSchema, alarmsSchema, type Alarm } from "./contracts";

type ProtectedRequest = AuthenticationContextValue["protectedRequest"];

export function createAlarmsApi(request: ProtectedRequest) {
  return {
    async list(): Promise<Alarm[]> {
      return alarmsSchema.parse(await request<unknown>("/alarms"));
    },
    async acknowledge(id: number): Promise<void> {
      acknowledgementSchema.parse(
        await request<unknown>(`/alarms/${id}/acknowledge`, { method: "POST" }),
      );
    },
  };
}

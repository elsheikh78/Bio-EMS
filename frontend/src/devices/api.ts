import type { AuthenticationContextValue } from "../auth/AuthenticationContext";
import {
  deviceHealthSchema,
  deviceSchema,
  devicesSchema,
  type DeviceUpdate,
} from "./contracts";
type ProtectedRequest = AuthenticationContextValue["protectedRequest"];
export function createDevicesApi(request: ProtectedRequest) {
  return {
    async list() {
      return devicesSchema.parse(await request<unknown>("/devices"));
    },
    async health(id: string) {
      return deviceHealthSchema.parse(
        await request<unknown>(`/devices/${encodeURIComponent(id)}/health`),
      );
    },
    async update(id: string, update: DeviceUpdate) {
      return deviceSchema.parse(
        await request<unknown>(`/devices/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(update),
        }),
      );
    },
    async transition(id: string, action: "activate" | "disable") {
      return deviceSchema.parse(
        await request<unknown>(`/devices/${encodeURIComponent(id)}/${action}`, {
          method: "POST",
        }),
      );
    },
  };
}

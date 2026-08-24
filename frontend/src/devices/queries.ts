import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthentication } from "../auth/useAuthentication";
import { createDevicesApi } from "./api";
import type { DeviceUpdate } from "./contracts";
export const deviceQueryKeys = {
  all: ["devices"] as const,
  health: (id: string) => ["devices", id, "health"] as const,
};
export function useDevices() {
  const { protectedRequest } = useAuthentication();
  return useQuery({
    queryKey: deviceQueryKeys.all,
    queryFn: () => createDevicesApi(protectedRequest).list(),
  });
}
export function useDeviceHealth(id: string | null) {
  const { protectedRequest } = useAuthentication();
  return useQuery({
    queryKey: deviceQueryKeys.health(id ?? ""),
    queryFn: () => createDevicesApi(protectedRequest).health(id!),
    enabled: Boolean(id),
  });
}
export function useDeviceMutation() {
  const { protectedRequest } = useAuthentication();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      update?: DeviceUpdate;
      action?: "activate" | "disable";
    }) =>
      input.update
        ? createDevicesApi(protectedRequest).update(input.id, input.update)
        : createDevicesApi(protectedRequest).transition(
            input.id,
            input.action!,
          ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: deviceQueryKeys.all }),
  });
}

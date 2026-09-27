import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePlatformAuthentication } from "../platform-auth/usePlatformAuthentication";
import { installationQueryKey } from "../installations/queries";
import {
  detectedDeviceSchema,
  deviceProvisionerHealthSchema,
  deviceProvisioningPortsSchema,
  deviceProvisioningTargetsSchema,
  flashBindResultSchema,
} from "./contracts";

export const deviceProvisioningHealthKey = [
  "platform",
  "device-provisioning",
  "health",
] as const;
export const deviceProvisioningPortsKey = [
  "platform",
  "device-provisioning",
  "ports",
] as const;
export const deviceProvisioningTargetsKey = [
  "platform",
  "device-provisioning",
  "targets",
] as const;

export function useDeviceProvisionerHealth() {
  const { apiClient, status } = usePlatformAuthentication();
  return useQuery({
    queryKey: deviceProvisioningHealthKey,
    enabled: status === "authenticated",
    queryFn: async () =>
      deviceProvisionerHealthSchema.parse(
        await apiClient.request<unknown>(
          "/platform-operations/device-provisioning/health",
          { auth: "protected" },
        ),
      ),
  });
}

export function useDeviceProvisioningPorts() {
  const { apiClient, status } = usePlatformAuthentication();
  return useQuery({
    queryKey: deviceProvisioningPortsKey,
    enabled: status === "authenticated",
    queryFn: async () =>
      deviceProvisioningPortsSchema.parse(
        await apiClient.request<unknown>(
          "/platform-operations/device-provisioning/ports",
          { auth: "protected" },
        ),
      ),
  });
}

export function useDeviceProvisioningTargets() {
  const { apiClient, status } = usePlatformAuthentication();
  return useQuery({
    queryKey: deviceProvisioningTargetsKey,
    enabled: status === "authenticated",
    queryFn: async () =>
      deviceProvisioningTargetsSchema.parse(
        await apiClient.request<unknown>(
          "/platform-operations/device-provisioning/targets",
          { auth: "protected" },
        ),
      ),
  });
}

export function useDetectProvisioningBoard() {
  const { apiClient } = usePlatformAuthentication();
  return useMutation({
    mutationFn: async (port: string) =>
      detectedDeviceSchema.parse(
        await apiClient.request<unknown>(
          "/platform-operations/device-provisioning/detect",
          {
            method: "POST",
            auth: "protected",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ port }),
          },
        ),
      ),
  });
}

export function useFlashAndBindProvisioningDevice() {
  const { apiClient } = usePlatformAuthentication();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      installationId: string;
      deviceId: string;
      port: string;
      wifiSsid: string;
      wifiPassword: string;
      platformUrl: string;
    }) =>
      flashBindResultSchema.parse(
        await apiClient.request<unknown>(
          "/platform-operations/device-provisioning/flash-bind",
          {
            method: "POST",
            auth: "protected",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          },
        ),
      ),
    onSuccess: async () => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: deviceProvisioningTargetsKey }),
        cache.invalidateQueries({ queryKey: installationQueryKey }),
      ]);
    },
  });
}

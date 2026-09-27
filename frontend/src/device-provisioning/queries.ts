import { useMutation, useQuery } from "@tanstack/react-query";
import { usePlatformAuthentication } from "../platform-auth/usePlatformAuthentication";
import {
  detectedDeviceSchema,
  deviceProvisionerHealthSchema,
  deviceProvisioningPortsSchema,
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

export function useDeviceProvisionerHealth() {
  const { apiClient, status } = usePlatformAuthentication();
  return useQuery({
    queryKey: deviceProvisioningHealthKey,
    enabled: status === "authenticated",
    queryFn: async () =>
      deviceProvisionerHealthSchema.parse(
        await apiClient.request<unknown>(
          "/platform-operations/device-provisioning/health",
          { auth: "protected" }
        )
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
          { auth: "protected" }
        )
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
          }
        )
      ),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePlatformAuthentication } from "../platform-auth/usePlatformAuthentication";
import {
  installationCreateResponseSchema,
  installationListSchema,
} from "./contracts";

export const installationQueryKey = ["platform", "installations"] as const;
export function useInstallations() {
  const { apiClient, status } = usePlatformAuthentication();
  return useQuery({
    queryKey: installationQueryKey,
    enabled: status === "authenticated",
    queryFn: async () =>
      installationListSchema.parse(
        await apiClient.request<unknown>("/platform-operations/installations", {
          auth: "protected",
        }),
      ),
  });
}
export function useCreateInstallation() {
  const { apiClient } = usePlatformAuthentication();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (input: { customerId: number; snapshot: unknown }) =>
      installationCreateResponseSchema.parse(
        await apiClient.request<unknown>(
          `/platform-operations/customers/${input.customerId}/installations`,
          {
            method: "POST",
            auth: "protected",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ snapshot: input.snapshot }),
          },
        ),
      ),
    onSuccess: () =>
      cache.invalidateQueries({ queryKey: installationQueryKey }),
  });
}
export function useReviseInstallation() {
  const { apiClient } = usePlatformAuthentication();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      uuid: string;
      snapshot: unknown;
      reason: string;
    }) =>
      installationCreateResponseSchema.parse(
        await apiClient.request<unknown>(
          `/platform-operations/installations/${input.uuid}/draft`,
          {
            method: "PUT",
            auth: "protected",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              snapshot: input.snapshot,
              reason: input.reason,
            }),
          },
        ),
      ),
    onSuccess: () =>
      cache.invalidateQueries({ queryKey: installationQueryKey }),
  });
}
export function useInstallationAction() {
  const { apiClient } = usePlatformAuthentication();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      uuid: string;
      action: "validate" | "queue" | "send" | "technical-decision";
      body?: object;
    }) =>
      apiClient.request<unknown>(
        `/platform-operations/installations/${input.uuid}/${input.action}`,
        {
          method: "POST",
          auth: "protected",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input.body ?? {}),
        },
      ),
    onSuccess: () =>
      cache.invalidateQueries({ queryKey: installationQueryKey }),
  });
}

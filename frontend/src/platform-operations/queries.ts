import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePlatformAuthentication } from "../platform-auth/usePlatformAuthentication";
import {
  createPlatformCustomerRequestSchema,
  createPlatformCustomerResponseSchema,
  platformOperationsOverviewSchema,
  type CreatePlatformCustomerRequest,
} from "./contracts";

export const platformOperationsQueryKey = ["platform", "operations"] as const;

export function usePlatformOperationsOverview() {
  const { apiClient, status } = usePlatformAuthentication();

  return useQuery({
    queryKey: platformOperationsQueryKey,
    enabled: status === "authenticated",
    queryFn: async () => {
      const response = await apiClient.request<unknown>("/platform-operations", {
        auth: "protected",
      });
      return platformOperationsOverviewSchema.parse(response);
    },
  });
}

export function useCreatePlatformCustomer() {
  const { apiClient } = usePlatformAuthentication();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePlatformCustomerRequest) => {
      const body = createPlatformCustomerRequestSchema.parse(input);
      const response = await apiClient.request<unknown>(
        "/platform-operations/customers",
        {
          method: "POST",
          auth: "protected",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      return createPlatformCustomerResponseSchema.parse(response);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformOperationsQueryKey });
    },
  });
}

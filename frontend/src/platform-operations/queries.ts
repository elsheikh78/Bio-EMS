import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePlatformAuthentication } from "../platform-auth/usePlatformAuthentication";
import {
  createPlatformCustomerRequestSchema,
  createPlatformCustomerResponseSchema,
  platformOperationsOverviewSchema,
  type CreatePlatformCustomerRequest,
  createOperationResponseSchema,
  createPlatformLicenseRequestSchema,
  createPlatformServiceRequestSchema,
  operationSuccessSchema,
  updatePlatformLicenseRequestSchema,
  updatePlatformServiceRequestSchema,
  type CreatePlatformLicenseRequest,
  type CreatePlatformServiceRequest,
  type UpdatePlatformLicenseRequest,
  type UpdatePlatformServiceRequest,
} from "./contracts";

export const platformOperationsQueryKey = ["platform", "operations"] as const;

export function usePlatformOperationsOverview() {
  const { apiClient, status } = usePlatformAuthentication();

  return useQuery({
    queryKey: platformOperationsQueryKey,
    enabled: status === "authenticated",
    queryFn: async () => {
      const response = await apiClient.request<unknown>(
        "/platform-operations",
        {
          auth: "protected",
        },
      );
      return platformOperationsOverviewSchema.parse(response);
    },
  });
}

function usePlatformMutation<T>(
  path: (input: T) => `/${string}`,
  method: "POST" | "PATCH",
  parse: (input: T) => unknown,
) {
  const { apiClient } = usePlatformAuthentication();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: T) => {
      const body = parse(input) as Record<string, unknown>;
      const payload = { ...body };
      delete payload.id;
      const response = await apiClient.request<unknown>(path(input), {
        method,
        auth: "protected",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return method === "POST"
        ? createOperationResponseSchema.parse(response)
        : operationSuccessSchema.parse(response);
    },
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: platformOperationsQueryKey }),
  });
}

export const useCreatePlatformLicense = () =>
  usePlatformMutation<CreatePlatformLicenseRequest>(
    () => "/platform-operations/licenses",
    "POST",
    (input) => createPlatformLicenseRequestSchema.parse(input),
  );
export const useUpdatePlatformLicense = () =>
  usePlatformMutation<UpdatePlatformLicenseRequest>(
    (input) => `/platform-operations/licenses/${input.id}`,
    "PATCH",
    (input) => updatePlatformLicenseRequestSchema.parse(input),
  );
export const useCreatePlatformService = () =>
  usePlatformMutation<CreatePlatformServiceRequest>(
    () => "/platform-operations/service-events",
    "POST",
    (input) => createPlatformServiceRequestSchema.parse(input),
  );
export const useUpdatePlatformService = () =>
  usePlatformMutation<UpdatePlatformServiceRequest>(
    (input) => `/platform-operations/service-events/${input.id}`,
    "PATCH",
    (input) => updatePlatformServiceRequestSchema.parse(input),
  );

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
      await queryClient.invalidateQueries({
        queryKey: platformOperationsQueryKey,
      });
    },
  });
}

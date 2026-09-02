import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { usePlatformAuthentication } from "../platform-auth/usePlatformAuthentication";

const adminSchema = z
  .object({
    id: z.number().int().positive(),
    username: z.string(),
    email: z.string().nullable(),
    role: z.literal("ADMIN"),
    status: z.enum(["active", "disabled"]),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .strict();
const key = (customerId: number) =>
  ["platform", "customer-admins", customerId] as const;
export function useCustomerAdmins(customerId?: number) {
  const { apiClient, status } = usePlatformAuthentication();
  return useQuery({
    queryKey: key(customerId ?? 0),
    enabled: status === "authenticated" && Boolean(customerId),
    queryFn: async () =>
      z
        .array(adminSchema)
        .parse(
          await apiClient.request<unknown>(
            `/platform-operations/customers/${customerId}/admins`,
            { auth: "protected" },
          ),
        ),
  });
}
export function useCreateCustomerAdmin(customerId: number) {
  const { apiClient } = usePlatformAuthentication();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      username: string;
      email: string | null;
      password: string;
    }) =>
      apiClient.request(`/platform-operations/customers/${customerId}/admins`, {
        method: "POST",
        auth: "protected",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => cache.invalidateQueries({ queryKey: key(customerId) }),
  });
}
export function useCustomerAdminStatus(customerId: number) {
  const { apiClient } = usePlatformAuthentication();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: (input: { userId: number; status: "active" | "disabled" }) =>
      apiClient.request(
        `/platform-operations/customers/${customerId}/admins/${input.userId}/status`,
        {
          method: "PATCH",
          auth: "protected",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: input.status }),
        },
      ),
    onSuccess: () => cache.invalidateQueries({ queryKey: key(customerId) }),
  });
}

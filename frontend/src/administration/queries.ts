import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthentication } from "../auth/useAuthentication";
import { createAdministrationApi } from "./api";
import type { CreateUserInput, UpdateUserInput } from "./contracts";
const keys = {
  users: ["administration", "users"] as const,
  audit: (siteId: number) => ["administration", "audit", siteId] as const,
};
function useApi() {
  const { protectedRequest } = useAuthentication();
  return createAdministrationApi(protectedRequest);
}
function useRefreshUsers() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: keys.users });
}
export function useManagedUsers() {
  const api = useApi();
  return useQuery({ queryKey: keys.users, queryFn: () => api.listUsers() });
}
export function useCreateUser() {
  const api = useApi();
  const refresh = useRefreshUsers();
  return useMutation({
    mutationFn: (input: CreateUserInput) => api.createUser(input),
    onSuccess: refresh,
  });
}
export function useUpdateUser() {
  const api = useApi();
  const refresh = useRefreshUsers();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateUserInput }) =>
      api.updateUser(id, input),
    onSuccess: refresh,
  });
}
export function useUpdateUserStatus() {
  const api = useApi();
  const refresh = useRefreshUsers();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: "active" | "disabled";
    }) => api.updateUserStatus(id, status),
    onSuccess: refresh,
  });
}
export function useUpdateUserPassword() {
  const api = useApi();
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      api.updateUserPassword(id, password),
  });
}
export function useAuditEvents(siteId?: number) {
  const api = useApi();
  return useQuery({
    queryKey: keys.audit(siteId ?? 0),
    queryFn: () => api.listAuditEvents(siteId!),
    enabled: Boolean(siteId),
  });
}

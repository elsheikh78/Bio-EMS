import type { AuthenticationContextValue } from "../auth/AuthenticationContext";
import {
  auditEventsResponseSchema,
  userSchema,
  usersSchema,
  type AuditEvent,
  type CreateUserInput,
  type ManagedUser,
  type UpdateUserInput,
} from "./contracts";
type ProtectedRequest = AuthenticationContextValue["protectedRequest"];
export function createAdministrationApi(request: ProtectedRequest) {
  const mutateUser = async (
    path: `/${string}`,
    method: "POST" | "PATCH" | "PUT",
    body: unknown,
  ) =>
    userSchema.parse(
      await request<unknown>(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  return {
    async listUsers(): Promise<ManagedUser[]> {
      return usersSchema.parse(await request<unknown>("/users"));
    },
    createUser: (input: CreateUserInput) => mutateUser("/users", "POST", input),
    updateUser: (id: number, input: UpdateUserInput) =>
      mutateUser(`/users/${id}`, "PATCH", input),
    updateUserStatus: (id: number, status: "active" | "disabled") =>
      mutateUser(`/users/${id}/status`, "PATCH", { status }),
    updateUserPassword: (id: number, password: string) =>
      mutateUser(`/users/${id}/password`, "PUT", { password }),
    async listAuditEvents(siteId: number, limit = 100): Promise<AuditEvent[]> {
      return auditEventsResponseSchema.parse(
        await request<unknown>(
          `/audit-events?site_id=${siteId}&limit=${limit}`,
        ),
      ).events;
    },
  };
}

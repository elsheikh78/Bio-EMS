import { User } from "../../entities/User";

export const USER_AUDIT_ACTION = {
  CREATED: "USER.CREATED",
  PROFILE_UPDATED: "USER.PROFILE_UPDATED",
  STATUS_UPDATED: "USER.STATUS_UPDATED",
  PASSWORD_UPDATED: "USER.PASSWORD_UPDATED",
} as const;

export type UserAuditAction = (typeof USER_AUDIT_ACTION)[keyof typeof USER_AUDIT_ACTION];

export function publicUserAuditValues(user: User): Record<string, unknown> {
  return {
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

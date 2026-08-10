export const USER_ROLES = ["ADMIN", "OPERATOR", "VIEWER"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["active", "disabled"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export interface User {
  id: number;
  username: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string | null;
}

export interface CreateUserRecord {
  username: string;
  email?: string | null;
  passwordHash: string;
  role: UserRole;
  status?: UserStatus;
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

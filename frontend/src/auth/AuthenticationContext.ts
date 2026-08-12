import { createContext } from "react";
import type { ApiRequestOptions } from "../api/client";
import type { AuthenticatedUser, LoginRequest } from "./contracts";

export type AuthenticationStatus =
  "bootstrapping" | "unauthenticated" | "authenticated" | "restoration-error";

export type AuthenticationFailureKind =
  | "invalid-credentials"
  | "validation"
  | "network"
  | "server"
  | "malformed-response"
  | "storage";

export class AuthenticationFailure extends Error {
  readonly kind: AuthenticationFailureKind;

  constructor(kind: AuthenticationFailureKind) {
    super("Authentication failed");
    this.name = "AuthenticationFailure";
    this.kind = kind;
  }
}

export interface AuthenticationContextValue {
  status: AuthenticationStatus;
  user?: AuthenticatedUser;
  loginPending: boolean;
  login: (credentials: LoginRequest) => Promise<AuthenticatedUser>;
  logout: () => Promise<void>;
  retryRestoration: () => Promise<void>;
  protectedRequest: <T>(
    path: `/${string}`,
    options?: Omit<ApiRequestOptions, "auth">,
  ) => Promise<T>;
}

export const AuthenticationContext =
  createContext<AuthenticationContextValue | null>(null);

import { createContext } from "react";
import type { ApiClient } from "../api/client";
import type { PlatformLoginRequest, PlatformPrincipal } from "./contracts";

export type PlatformAuthenticationStatus =
  "bootstrapping" | "authenticated" | "unauthenticated" | "restoration-error";

export interface PlatformAuthenticationValue {
  status: PlatformAuthenticationStatus;
  principal?: PlatformPrincipal;
  loginPending: boolean;
  apiClient: ApiClient;
  login: (input: PlatformLoginRequest) => Promise<void>;
  logout: () => void;
}

export const PlatformAuthenticationContext =
  createContext<PlatformAuthenticationValue | null>(null);

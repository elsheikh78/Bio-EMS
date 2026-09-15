import { createContext } from "react";
import type { ApiClient } from "../api/client";
import type {
  PlatformLoginRequest,
  PlatformLoginResponse,
  PlatformPrincipal,
} from "./contracts";

export type PlatformAuthenticationStatus =
  "bootstrapping" | "authenticated" | "unauthenticated" | "restoration-error";

export interface PlatformAuthenticationValue {
  status: PlatformAuthenticationStatus;
  principal?: PlatformPrincipal;
  loginPending: boolean;
  apiClient: ApiClient;
  login: (input: PlatformLoginRequest) => Promise<PlatformLoginResponse>;
  logout: () => void;
}

export const PlatformAuthenticationContext =
  createContext<PlatformAuthenticationValue | null>(null);

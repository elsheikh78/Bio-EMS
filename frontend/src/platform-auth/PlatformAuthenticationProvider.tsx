import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { createApiClient } from "../api/client";
import {
  currentPlatformPrincipalResponseSchema,
  platformLoginRequestSchema,
  platformLoginResponseSchema,
  type PlatformLoginRequest,
  type PlatformPrincipal,
} from "./contracts";

const STORAGE_KEY = "bioems.platform.session.v1";

interface StoredPlatformSession {
  accessToken: string;
  expiresAt: number;
  principal: PlatformPrincipal;
}

export type PlatformAuthenticationStatus =
  | "bootstrapping"
  | "authenticated"
  | "unauthenticated"
  | "restoration-error";

interface PlatformAuthenticationValue {
  status: PlatformAuthenticationStatus;
  principal?: PlatformPrincipal;
  loginPending: boolean;
  login(input: PlatformLoginRequest): Promise<void>;
  logout(): void;
}

const PlatformAuthenticationContext = createContext<PlatformAuthenticationValue | null>(null);

export function PlatformAuthenticationProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<StoredPlatformSession>();
  const [status, setStatus] = useState<PlatformAuthenticationStatus>("bootstrapping");
  const [loginPending, setLoginPending] = useState(false);

  const client = useMemo(
    () => createApiClient({ getAccessToken: () => session?.accessToken }),
    [session?.accessToken],
  );

  useEffect(() => {
    let active = true;
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setStatus("unauthenticated");
      return () => {
        active = false;
      };
    }

    try {
      const stored = JSON.parse(raw) as StoredPlatformSession;
      if (!stored.accessToken || stored.expiresAt <= Date.now()) {
        window.sessionStorage.removeItem(STORAGE_KEY);
        setStatus("unauthenticated");
        return () => {
          active = false;
        };
      }
      const restoreClient = createApiClient({ getAccessToken: () => stored.accessToken });
      void restoreClient
        .request<unknown>("/platform-auth/me", { auth: "protected" })
        .then((rawResponse) => {
          if (!active) return;
          const response = currentPlatformPrincipalResponseSchema.parse(rawResponse);
          const refreshed = { ...stored, principal: response.principal };
          window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed));
          setSession(refreshed);
          setStatus("authenticated");
        })
        .catch(() => {
          if (!active) return;
          setStatus("restoration-error");
        });
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
      setStatus("unauthenticated");
    }

    return () => {
      active = false;
    };
  }, []);

  const login = async (input: PlatformLoginRequest) => {
    setLoginPending(true);
    try {
      const credentials = platformLoginRequestSchema.parse(input);
      const raw = await client.request<unknown>("/platform-auth/login", {
        method: "POST",
        auth: "public",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const response = platformLoginResponseSchema.parse(raw);
      const next: StoredPlatformSession = {
        accessToken: response.access_token,
        expiresAt: Date.now() + response.expires_in * 1000,
        principal: response.principal,
      };
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSession(next);
      setStatus("authenticated");
    } finally {
      setLoginPending(false);
    }
  };

  const logout = () => {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setSession(undefined);
    setStatus("unauthenticated");
  };

  return (
    <PlatformAuthenticationContext.Provider
      value={{ status, principal: session?.principal, loginPending, login, logout }}
    >
      {children}
    </PlatformAuthenticationContext.Provider>
  );
}

export function usePlatformAuthentication() {
  const value = useContext(PlatformAuthenticationContext);
  if (!value) {
    throw new Error("usePlatformAuthentication must be used within PlatformAuthenticationProvider");
  }
  return value;
}

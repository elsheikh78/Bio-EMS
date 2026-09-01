import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { createApiClient } from "../api/client";
import {
  currentPlatformPrincipalResponseSchema,
  platformLoginRequestSchema,
  platformLoginResponseSchema,
  platformPrincipalSchema,
  type PlatformLoginRequest,
  type PlatformPrincipal,
} from "./contracts";
import {
  PlatformAuthenticationContext,
  type PlatformAuthenticationStatus,
} from "./context";

const STORAGE_KEY = "bioems.platform.session.v1";

interface StoredPlatformSession {
  accessToken: string;
  expiresAt: number;
  principal: PlatformPrincipal;
}

function readStoredPlatformSession(): StoredPlatformSession | undefined {
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return undefined;

  try {
    const candidate = JSON.parse(raw) as Partial<StoredPlatformSession>;
    const principal = platformPrincipalSchema.safeParse(candidate.principal);
    if (
      typeof candidate.accessToken !== "string" ||
      candidate.accessToken.length === 0 ||
      typeof candidate.expiresAt !== "number" ||
      !Number.isFinite(candidate.expiresAt) ||
      candidate.expiresAt <= Date.now() ||
      !principal.success
    ) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return undefined;
    }

    return {
      accessToken: candidate.accessToken,
      expiresAt: candidate.expiresAt,
      principal: principal.data,
    };
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return undefined;
  }
}

export function PlatformAuthenticationProvider({
  children,
}: PropsWithChildren) {
  const [session, setSession] = useState<StoredPlatformSession | undefined>(
    readStoredPlatformSession,
  );
  const [status, setStatus] = useState<PlatformAuthenticationStatus>(() =>
    session ? "bootstrapping" : "unauthenticated",
  );
  const [loginPending, setLoginPending] = useState(false);

  const client = useMemo(
    () => createApiClient({ getAccessToken: () => session?.accessToken }),
    [session?.accessToken],
  );

  useEffect(() => {
    if (!session || status !== "bootstrapping") return;

    let active = true;
    const restoreClient = createApiClient({
      getAccessToken: () => session.accessToken,
    });

    void restoreClient
      .request<unknown>("/platform-auth/me", { auth: "protected" })
      .then((rawResponse) => {
        if (!active) return;
        const response =
          currentPlatformPrincipalResponseSchema.parse(rawResponse);
        const refreshed = { ...session, principal: response.principal };
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed));
        setSession(refreshed);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!active) return;
        setStatus("restoration-error");
      });

    return () => {
      active = false;
    };
  }, [session, status]);

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
      value={{
        status,
        principal: session?.principal,
        loginPending,
        login,
        logout,
      }}
    >
      {children}
    </PlatformAuthenticationContext.Provider>
  );
}

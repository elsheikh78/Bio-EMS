import { useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { createApiClient } from "../api/client";
import {
  currentPlatformPrincipalResponseSchema,
  platformAuthenticatedResponseSchema,
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
const PLATFORM_QUERY_KEY = ["platform"] as const;
const OWNER_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const OWNER_HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;
const OWNER_IDLE_CHECK_MS = 15 * 1000;

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
  const queryClient = useQueryClient();
  const [session, setSession] = useState<StoredPlatformSession | undefined>(
    readStoredPlatformSession,
  );
  const [status, setStatus] = useState<PlatformAuthenticationStatus>(() =>
    session ? "bootstrapping" : "unauthenticated",
  );
  const [loginPending, setLoginPending] = useState(false);
  const lastActivityAt = useRef(Date.now());
  const lastHeartbeatAt = useRef(Date.now());
  const refreshPending = useRef(false);

  const apiClient = useMemo(
    () => createApiClient({ getAccessToken: () => session?.accessToken }),
    [session?.accessToken],
  );

  const clearSession = useCallback(
    (nextStatus: PlatformAuthenticationStatus = "unauthenticated") => {
      window.sessionStorage.removeItem(STORAGE_KEY);
      void queryClient.removeQueries({ queryKey: PLATFORM_QUERY_KEY });
      setSession(undefined);
      setStatus(nextStatus);
    },
    [queryClient],
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
        lastActivityAt.current = Date.now();
        lastHeartbeatAt.current = Date.now();
        setStatus("authenticated");
      })
      .catch(() => {
        if (!active) return;
        clearSession("restoration-error");
      });

    return () => {
      active = false;
    };
  }, [clearSession, session, status]);

  const login = async (input: PlatformLoginRequest) => {
    setLoginPending(true);
    try {
      const credentials = platformLoginRequestSchema.parse(input);
      const raw = await apiClient.request<unknown>("/platform-auth/login", {
        method: "POST",
        auth: "public",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const response = platformLoginResponseSchema.parse(raw);
      if ("mfa_enrollment_required" in response) {
        return response;
      }
      const next: StoredPlatformSession = {
        accessToken: response.access_token,
        expiresAt: Date.now() + response.expires_in * 1000,
        principal: response.principal,
      };
      void queryClient.removeQueries({ queryKey: PLATFORM_QUERY_KEY });
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSession(next);
      lastActivityAt.current = Date.now();
      lastHeartbeatAt.current = Date.now();
      setStatus("authenticated");
      return response;
    } finally {
      setLoginPending(false);
    }
  };

  const logout = useCallback(() => {
    const revokeAndClear = async () => {
      try {
        if (session) {
          await apiClient.request("/platform-auth/logout", {
            method: "POST",
            auth: "protected",
          });
        }
      } finally {
        clearSession("unauthenticated");
      }
    };
    void revokeAndClear();
  }, [apiClient, clearSession, session]);

  useEffect(() => {
    if (!session || status !== "authenticated") return;

    const markActivity = () => {
      lastActivityAt.current = Date.now();
    };
    const activityEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
    ];
    for (const eventName of activityEvents) {
      window.addEventListener(eventName, markActivity, { passive: true });
    }

    const interval = window.setInterval(() => {
      const now = Date.now();
      if (now - lastActivityAt.current >= OWNER_IDLE_TIMEOUT_MS) {
        logout();
        return;
      }

      const hadActivitySinceHeartbeat =
        lastActivityAt.current > lastHeartbeatAt.current;
      if (
        !hadActivitySinceHeartbeat ||
        now - lastHeartbeatAt.current < OWNER_HEARTBEAT_INTERVAL_MS ||
        refreshPending.current
      ) {
        return;
      }

      refreshPending.current = true;
      void apiClient
        .request<unknown>("/platform-auth/session/refresh", {
          method: "POST",
          auth: "protected",
        })
        .then((raw) => {
          const response = platformAuthenticatedResponseSchema.parse(raw);
          const next: StoredPlatformSession = {
            accessToken: response.access_token,
            expiresAt: Date.now() + response.expires_in * 1000,
            principal: response.principal,
          };
          window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          setSession(next);
          lastHeartbeatAt.current = Date.now();
        })
        .catch(() => {
          clearSession("unauthenticated");
        })
        .finally(() => {
          refreshPending.current = false;
        });
    }, OWNER_IDLE_CHECK_MS);

    return () => {
      window.clearInterval(interval);
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, markActivity);
      }
    };
  }, [apiClient, clearSession, logout, session, status]);

  return (
    <PlatformAuthenticationContext.Provider
      value={{
        status,
        principal: session?.principal,
        loginPending,
        apiClient,
        login,
        logout,
      }}
    >
      {children}
    </PlatformAuthenticationContext.Provider>
  );
}

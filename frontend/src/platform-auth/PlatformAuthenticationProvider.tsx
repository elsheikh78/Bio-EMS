import { useQueryClient } from "@tanstack/react-query";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
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

const STORAGE_KEY = "bioems.platform.session.v2";
const LEGACY_STORAGE_KEY = "bioems.platform.session.v1";
const PLATFORM_QUERY_KEY = ["platform"] as const;

export const PLATFORM_OWNER_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const PLATFORM_ACTIVITY_HEARTBEAT_MS = 60 * 1000;
const PLATFORM_IDLE_CHECK_MS = 10 * 1000;

interface StoredPlatformSession {
  accessToken: string;
  expiresAt: number;
  lastActivityAt: number;
  principal: PlatformPrincipal;
}

function clearStoredPlatformSession() {
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(LEGACY_STORAGE_KEY);
}

function readStoredPlatformSession(): StoredPlatformSession | undefined {
  window.sessionStorage.removeItem(LEGACY_STORAGE_KEY);
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return undefined;

  try {
    const candidate = JSON.parse(raw) as Partial<StoredPlatformSession>;
    const principal = platformPrincipalSchema.safeParse(candidate.principal);
    const now = Date.now();
    if (
      typeof candidate.accessToken !== "string" ||
      candidate.accessToken.length === 0 ||
      typeof candidate.expiresAt !== "number" ||
      !Number.isFinite(candidate.expiresAt) ||
      candidate.expiresAt <= now ||
      typeof candidate.lastActivityAt !== "number" ||
      !Number.isFinite(candidate.lastActivityAt) ||
      candidate.lastActivityAt > now + 60_000 ||
      now - candidate.lastActivityAt >= PLATFORM_OWNER_IDLE_TIMEOUT_MS ||
      !principal.success
    ) {
      clearStoredPlatformSession();
      return undefined;
    }

    return {
      accessToken: candidate.accessToken,
      expiresAt: candidate.expiresAt,
      lastActivityAt: candidate.lastActivityAt,
      principal: principal.data,
    };
  } catch {
    clearStoredPlatformSession();
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
  const lastActivityAtRef = useRef(session?.lastActivityAt ?? Date.now());

  const apiClient = useMemo(
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
        const now = Date.now();
        const refreshed = {
          ...session,
          lastActivityAt: now,
          principal: response.principal,
        };
        lastActivityAtRef.current = now;
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed));
        setSession(refreshed);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!active) return;
        clearStoredPlatformSession();
        void queryClient.removeQueries({ queryKey: PLATFORM_QUERY_KEY });
        setSession(undefined);
        setStatus("restoration-error");
      });

    return () => {
      active = false;
    };
  }, [queryClient, session, status]);

  useEffect(() => {
    if (!session || status !== "authenticated") return;

    let disposed = false;
    let heartbeatInFlight = false;
    let lastHeartbeatAt = Date.now();

    const expireLocalSession = () => {
      if (disposed) return;
      clearStoredPlatformSession();
      void queryClient.removeQueries({ queryKey: PLATFORM_QUERY_KEY });
      setSession(undefined);
      setStatus("unauthenticated");
    };

    const recordActivity = () => {
      const now = Date.now();
      lastActivityAtRef.current = now;
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...session, lastActivityAt: now }),
      );

      if (
        heartbeatInFlight ||
        now - lastHeartbeatAt < PLATFORM_ACTIVITY_HEARTBEAT_MS
      ) {
        return;
      }

      heartbeatInFlight = true;
      void apiClient
        .request<unknown>("/platform-auth/me", { auth: "protected" })
        .then((rawResponse) => {
          currentPlatformPrincipalResponseSchema.parse(rawResponse);
          lastHeartbeatAt = Date.now();
        })
        .catch(expireLocalSession)
        .finally(() => {
          heartbeatInFlight = false;
        });
    };

    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
      "focus",
    ];
    for (const event of events) {
      window.addEventListener(event, recordActivity, { passive: true });
    }

    const timer = window.setInterval(() => {
      if (
        Date.now() - lastActivityAtRef.current >=
        PLATFORM_OWNER_IDLE_TIMEOUT_MS
      ) {
        expireLocalSession();
      }
    }, PLATFORM_IDLE_CHECK_MS);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      for (const event of events) {
        window.removeEventListener(event, recordActivity);
      }
    };
  }, [apiClient, queryClient, session, status]);

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
      const now = Date.now();
      const next: StoredPlatformSession = {
        accessToken: response.access_token,
        expiresAt: now + response.expires_in * 1000,
        lastActivityAt: now,
        principal: response.principal,
      };
      lastActivityAtRef.current = now;
      void queryClient.removeQueries({ queryKey: PLATFORM_QUERY_KEY });
      clearStoredPlatformSession();
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSession(next);
      setStatus("authenticated");
      return response;
    } finally {
      setLoginPending(false);
    }
  };

  const logout = () => {
    const revokeAndClear = async () => {
      try {
        if (session) {
          await apiClient.request("/platform-auth/logout", {
            method: "POST",
            auth: "protected",
          });
        }
      } finally {
        clearStoredPlatformSession();
        void queryClient.removeQueries({ queryKey: PLATFORM_QUERY_KEY });
        setSession(undefined);
        setStatus("unauthenticated");
      }
    };
    void revokeAndClear();
  };

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

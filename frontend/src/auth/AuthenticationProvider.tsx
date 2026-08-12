import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import {
  ApiResponseError,
  createApiClient,
  type ApiClient,
  type ApiClientConfiguration,
  type ApiRequestOptions,
} from "../api/client";
import {
  AuthenticationContext,
  AuthenticationFailure,
  type AuthenticationStatus,
} from "./AuthenticationContext";
import {
  currentUserResponseSchema,
  loginRequestSchema,
  loginResponseSchema,
  type AuthenticatedUser,
  type LoginRequest,
} from "./contracts";
import {
  createAuthenticationStorageAdapter,
  createStoredAuthenticationSession,
  type AuthenticationStorageAdapter,
  type StoredAuthenticationSession,
} from "./sessionStorage";

interface AuthenticationSnapshot {
  status: AuthenticationStatus;
  user?: AuthenticatedUser;
  expiresAt?: number;
  loginPending: boolean;
}

type ApiClientFactory = (configuration?: ApiClientConfiguration) => ApiClient;

interface AuthenticationProviderProps extends PropsWithChildren {
  storageAdapter?: AuthenticationStorageAdapter;
  now?: () => number;
  createClient?: ApiClientFactory;
}

class AuthenticationController {
  private readonly apiClient: ApiClient;
  private readonly listeners = new Set<() => void>();
  private readonly now: () => number;
  private readonly queryClient: QueryClient;
  private readonly storage: AuthenticationStorageAdapter;
  private expiryTimer?: number;
  private session?: StoredAuthenticationSession;
  private snapshot: AuthenticationSnapshot = {
    status: "bootstrapping",
    loginPending: false,
  };

  constructor(
    queryClient: QueryClient,
    storage: AuthenticationStorageAdapter,
    now: () => number,
    createClient: ApiClientFactory,
  ) {
    this.queryClient = queryClient;
    this.storage = storage;
    this.now = now;
    this.apiClient = createClient({
      getAccessToken: () => this.session?.accessToken,
      onProtectedUnauthorized: () => this.clearAuthentication(),
    });
  }

  getSnapshot = () => this.snapshot;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  start = () => {
    window.addEventListener("focus", this.enforceExpiry);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    const stored = this.storage.read();
    if (!stored) {
      this.update({ status: "unauthenticated", loginPending: false });
    } else {
      this.session = stored;
      void this.restore(stored);
    }

    return () => {
      if (this.expiryTimer !== undefined) window.clearTimeout(this.expiryTimer);
      window.removeEventListener("focus", this.enforceExpiry);
      document.removeEventListener("visibilitychange", this.onVisibilityChange);
    };
  };

  login = async (input: LoginRequest) => {
    this.update({ ...this.snapshot, loginPending: true });
    try {
      const credentials = loginRequestSchema.parse(input);
      const raw = await this.apiClient.request<unknown>("/auth/login", {
        method: "POST",
        auth: "public",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const response = loginResponseSchema.parse(raw);
      const session = createStoredAuthenticationSession(response, this.now());
      if (!this.storage.write(session)) {
        throw new AuthenticationFailure("storage");
      }
      this.session = session;
      this.update({
        status: "authenticated",
        user: session.user,
        expiresAt: session.expiresAt,
        loginPending: false,
      });
      return session.user;
    } catch (error) {
      this.update({ ...this.snapshot, loginPending: false });
      if (error instanceof AuthenticationFailure) throw error;
      if (error instanceof ApiResponseError) {
        if (error.status === 401) {
          throw new AuthenticationFailure("invalid-credentials");
        }
        if (error.status >= 500) throw new AuthenticationFailure("server");
        throw new AuthenticationFailure("validation");
      }
      if (error instanceof TypeError)
        throw new AuthenticationFailure("network");
      throw new AuthenticationFailure("malformed-response");
    }
  };

  logout = () => this.clearAuthentication();

  retryRestoration = async () => {
    if (!this.session || this.session.expiresAt <= this.now()) {
      await this.clearAuthentication();
      return;
    }
    await this.restore(this.session);
  };

  protectedRequest = <T,>(
    path: `/${string}`,
    options: Omit<ApiRequestOptions, "auth"> = {},
  ) => this.apiClient.request<T>(path, { ...options, auth: "protected" });

  private readonly clearAuthentication = async () => {
    this.session = undefined;
    await this.queryClient.cancelQueries();
    this.queryClient.clear();
    this.storage.clear();
    this.update({ status: "unauthenticated", loginPending: false });
  };

  private readonly enforceExpiry = () => {
    if (this.session && this.session.expiresAt <= this.now()) {
      void this.clearAuthentication();
    }
  };

  private readonly onVisibilityChange = () => {
    if (document.visibilityState === "visible") this.enforceExpiry();
  };

  private async restore(session: StoredAuthenticationSession) {
    this.update({
      status: "bootstrapping",
      expiresAt: session.expiresAt,
      loginPending: false,
    });
    try {
      const raw = await this.apiClient.request<unknown>("/auth/me", {
        auth: "protected",
      });
      const response = currentUserResponseSchema.parse(raw);
      const refreshed = { ...session, user: response.user };
      if (!this.storage.write(refreshed)) {
        await this.clearAuthentication();
        return;
      }
      this.session = refreshed;
      this.update({
        status: "authenticated",
        user: refreshed.user,
        expiresAt: refreshed.expiresAt,
        loginPending: false,
      });
    } catch (error) {
      if (error instanceof ApiResponseError && error.status === 401) {
        await this.clearAuthentication();
        return;
      }
      if (session.expiresAt <= this.now()) {
        await this.clearAuthentication();
        return;
      }
      this.update({
        status: "restoration-error",
        expiresAt: session.expiresAt,
        loginPending: false,
      });
    }
  }

  private scheduleExpiry() {
    if (this.expiryTimer !== undefined) window.clearTimeout(this.expiryTimer);
    if (!this.session) return;
    this.expiryTimer = window.setTimeout(
      this.enforceExpiry,
      Math.max(0, this.session.expiresAt - this.now()),
    );
  }

  private update(snapshot: AuthenticationSnapshot) {
    this.snapshot = snapshot;
    this.scheduleExpiry();
    for (const listener of this.listeners) listener();
  }
}

export function AuthenticationProvider({
  children,
  storageAdapter,
  now = Date.now,
  createClient = createApiClient,
}: AuthenticationProviderProps) {
  const queryClient = useQueryClient();
  const [controller] = useState(
    () =>
      new AuthenticationController(
        queryClient,
        storageAdapter ?? createAuthenticationStorageAdapter(undefined, now),
        now,
        createClient,
      ),
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  useEffect(() => controller.start(), [controller]);

  return (
    <AuthenticationContext.Provider
      value={{
        status: state.status,
        user: state.user,
        loginPending: state.loginPending,
        login: controller.login,
        logout: controller.logout,
        retryRestoration: controller.retryRestoration,
        protectedRequest: controller.protectedRequest,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
}

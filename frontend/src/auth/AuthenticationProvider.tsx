import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import { ZodError } from "zod";
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

const MAX_TIMER_DELAY_MS = 2_147_483_647;

interface AuthenticationSnapshot {
  status: AuthenticationStatus;
  user?: AuthenticatedUser;
  expiresAt?: number;
  loginPending: boolean;
}

interface OwnedRequest {
  controller: AbortController;
  release(): void;
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
  private readonly ownedControllers = new Set<AbortController>();
  private readonly queryClient: QueryClient;
  private readonly storage: AuthenticationStorageAdapter;
  private disposed = false;
  private expiryTimer?: number;
  private generation = 0;
  private invalidation?: Promise<void>;
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

    return this.dispose;
  };

  login = async (input: LoginRequest) => {
    const generation = this.beginAuthenticationOperation();
    const request = this.createOwnedRequest();
    this.update({ ...this.snapshot, loginPending: true });
    try {
      const credentials = loginRequestSchema.parse(input);
      const raw = await this.apiClient.request<unknown>("/auth/login", {
        method: "POST",
        auth: "public",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        signal: request.controller.signal,
      });
      this.requireCurrent(generation, request.controller.signal);
      const response = loginResponseSchema.parse(raw);
      const session = createStoredAuthenticationSession(response, this.now());
      this.requireCurrent(generation, request.controller.signal);
      if (!this.storage.write(session)) {
        throw new AuthenticationFailure("storage");
      }
      this.requireCurrent(generation, request.controller.signal);
      this.session = session;
      this.update({
        status: "authenticated",
        user: session.user,
        expiresAt: session.expiresAt,
        loginPending: false,
      });
      return session.user;
    } catch (error) {
      if (!this.isCurrent(generation) || isAbortError(error)) {
        throw createAbortError();
      }
      this.update({ ...this.snapshot, loginPending: false });
      if (error instanceof AuthenticationFailure) throw error;
      if (error instanceof ZodError) {
        throw new AuthenticationFailure("validation");
      }
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
    } finally {
      request.release();
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

  protectedRequest = async <T,>(
    path: `/${string}`,
    options: Omit<ApiRequestOptions, "auth"> = {},
  ): Promise<T> => {
    const session = this.session;
    if (this.disposed || this.snapshot.status !== "authenticated" || !session) {
      throw createAbortError();
    }
    if (session.expiresAt <= this.now()) {
      await this.clearAuthentication();
      throw createAbortError();
    }

    const generation = this.generation;
    const request = this.createOwnedRequest(options.signal);
    try {
      const result = await this.apiClient.request<T>(path, {
        ...options,
        auth: "protected",
        signal: request.controller.signal,
      });
      this.requireAuthenticatedCurrent(generation, request.controller.signal);
      return result;
    } catch (error) {
      if (!this.isAuthenticatedCurrent(generation) || isAbortError(error)) {
        throw createAbortError();
      }
      throw error;
    } finally {
      request.release();
    }
  };

  private readonly clearAuthentication = (): Promise<void> => {
    if (this.invalidation) return this.invalidation;
    if (
      !this.session &&
      this.snapshot.status === "unauthenticated" &&
      !this.snapshot.loginPending &&
      this.ownedControllers.size === 0
    ) {
      return Promise.resolve();
    }

    this.generation += 1;
    this.abortOwnedRequests();
    this.session = undefined;
    this.storage.clear();
    this.update({ status: "unauthenticated", loginPending: false });

    const invalidation = (async () => {
      await this.queryClient.cancelQueries();
      this.queryClient.clear();
    })();
    this.invalidation = invalidation;
    void invalidation.then(
      () => {
        if (this.invalidation === invalidation) this.invalidation = undefined;
      },
      () => {
        if (this.invalidation === invalidation) this.invalidation = undefined;
      },
    );
    return invalidation;
  };

  private readonly dispose = () => {
    if (this.disposed) return;
    this.disposed = true;
    this.generation += 1;
    this.abortOwnedRequests();
    if (this.expiryTimer !== undefined) window.clearTimeout(this.expiryTimer);
    this.expiryTimer = undefined;
    window.removeEventListener("focus", this.enforceExpiry);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.listeners.clear();
  };

  private readonly enforceExpiry = () => {
    if (this.session && this.session.expiresAt <= this.now()) {
      void this.clearAuthentication();
    } else {
      this.scheduleExpiry();
    }
  };

  private readonly onVisibilityChange = () => {
    if (document.visibilityState === "visible") this.enforceExpiry();
  };

  private async restore(session: StoredAuthenticationSession) {
    const generation = this.beginAuthenticationOperation();
    const request = this.createOwnedRequest();
    this.update({
      status: "bootstrapping",
      expiresAt: session.expiresAt,
      loginPending: false,
    });
    try {
      const raw = await this.apiClient.request<unknown>("/auth/me", {
        auth: "protected",
        signal: request.controller.signal,
      });
      this.requireCurrent(generation, request.controller.signal);
      const response = currentUserResponseSchema.parse(raw);
      const refreshed = { ...session, user: response.user };
      this.requireCurrent(generation, request.controller.signal);
      if (!this.storage.write(refreshed)) {
        await this.clearAuthentication();
        return;
      }
      this.requireCurrent(generation, request.controller.signal);
      this.session = refreshed;
      this.update({
        status: "authenticated",
        user: refreshed.user,
        expiresAt: refreshed.expiresAt,
        loginPending: false,
      });
    } catch (error) {
      if (!this.isCurrent(generation) || isAbortError(error)) return;
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
    } finally {
      request.release();
    }
  }

  private beginAuthenticationOperation() {
    this.generation += 1;
    this.abortOwnedRequests();
    return this.generation;
  }

  private createOwnedRequest(
    externalSignal?: AbortSignal | null,
  ): OwnedRequest {
    const controller = new AbortController();
    const abortFromCaller = () => controller.abort(externalSignal?.reason);
    if (externalSignal?.aborted) abortFromCaller();
    else
      externalSignal?.addEventListener("abort", abortFromCaller, {
        once: true,
      });
    this.ownedControllers.add(controller);

    return {
      controller,
      release: () => {
        externalSignal?.removeEventListener("abort", abortFromCaller);
        this.ownedControllers.delete(controller);
      },
    };
  }

  private abortOwnedRequests() {
    for (const controller of this.ownedControllers) controller.abort();
    this.ownedControllers.clear();
  }

  private isCurrent(generation: number) {
    return !this.disposed && generation === this.generation;
  }

  private requireCurrent(generation: number, signal: AbortSignal) {
    if (!this.isCurrent(generation) || signal.aborted) throw createAbortError();
  }

  private isAuthenticatedCurrent(generation: number) {
    return (
      this.isCurrent(generation) &&
      this.snapshot.status === "authenticated" &&
      this.session !== undefined &&
      this.session.expiresAt > this.now()
    );
  }

  private requireAuthenticatedCurrent(generation: number, signal: AbortSignal) {
    if (!this.isAuthenticatedCurrent(generation) || signal.aborted) {
      throw createAbortError();
    }
  }

  private scheduleExpiry() {
    if (this.expiryTimer !== undefined) window.clearTimeout(this.expiryTimer);
    this.expiryTimer = undefined;
    if (!this.session || this.disposed) return;
    const remaining = this.session.expiresAt - this.now();
    this.expiryTimer = window.setTimeout(
      this.enforceExpiry,
      Math.min(Math.max(0, remaining), MAX_TIMER_DELAY_MS),
    );
  }

  private update(snapshot: AuthenticationSnapshot) {
    if (this.disposed) return;
    this.snapshot = snapshot;
    this.scheduleExpiry();
    for (const listener of this.listeners) listener();
  }
}

function createAbortError() {
  return new DOMException("Authentication operation was aborted", "AbortError");
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
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

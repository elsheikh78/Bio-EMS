import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiResponseError,
  type ApiClientConfiguration,
  type ApiRequestOptions,
} from "../api/client";
import type { LoginResponse } from "./contracts";
import type { AuthenticationContextValue } from "./AuthenticationContext";
import { AuthenticationProvider } from "./AuthenticationProvider";
import type {
  AuthenticationStorageAdapter,
  StoredAuthenticationSession,
} from "./sessionStorage";
import { useAuthentication } from "./useAuthentication";

const storedSession: StoredAuthenticationSession = {
  version: 1,
  accessToken: "opaque-token",
  tokenType: "bearer",
  expiresAt: 50_000,
  user: { id: 1, username: "login-user", role: "ADMIN" },
};

function Probe({
  capture,
}: {
  capture: (authentication: AuthenticationContextValue) => void;
}) {
  const authentication = useAuthentication();
  capture(authentication);
  return (
    <div>
      <output data-testid="status">{authentication.status}</output>
      <output data-testid="identity">
        {authentication.user?.username}:{authentication.user?.role}
      </output>
      <button
        onClick={() => {
          void authentication
            .login({ username: "admin", password: "password" })
            .catch(() => undefined);
        }}
      >
        Login
      </button>
      <button onClick={() => void authentication.logout()}>Logout</button>
      <button onClick={() => void authentication.retryRestoration()}>
        Retry
      </button>
    </div>
  );
}

function storageAdapter(record?: StoredAuthenticationSession) {
  let value = record;
  return {
    adapter: {
      clear: vi.fn(() => {
        value = undefined;
      }),
      read: vi.fn(() => value),
      write: vi.fn((next: StoredAuthenticationSession) => {
        value = next;
        return true;
      }),
    } satisfies AuthenticationStorageAdapter,
    current: () => value,
  };
}

function renderProvider({
  storage = storageAdapter().adapter,
  responses = [],
  now = () => 1_000,
  request: suppliedRequest,
}: {
  storage?: AuthenticationStorageAdapter;
  responses?: unknown[];
  now?: () => number;
  request?: ReturnType<typeof vi.fn>;
} = {}) {
  const request = suppliedRequest ?? vi.fn();
  for (const response of responses) {
    if (response instanceof Error) request.mockRejectedValueOnce(response);
    else request.mockResolvedValueOnce(response);
  }
  let configuration: ApiClientConfiguration | undefined;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const createClient = vi.fn((next: ApiClientConfiguration = {}) => {
    configuration = next;
    return { request };
  });
  let authentication: AuthenticationContextValue | undefined;
  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <AuthenticationProvider
        storageAdapter={storage}
        now={now}
        createClient={createClient}
      >
        <Probe
          capture={(next) => {
            authentication = next;
          }}
        />
      </AuthenticationProvider>
    </QueryClientProvider>,
  );
  return {
    authentication: () => {
      if (!authentication)
        throw new Error("Authentication context unavailable");
      return authentication;
    },
    configuration: () => configuration,
    queryClient,
    request,
    unmount: rendered.unmount,
  };
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function requestOptions(request: ReturnType<typeof vi.fn>, callIndex: number) {
  const call = request.mock.calls[callIndex] as unknown[] | undefined;
  return (call?.[1] ?? {}) as ApiRequestOptions;
}

describe("authentication session lifecycle", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("becomes unauthenticated when no stored session exists", async () => {
    renderProvider();
    expect(await screen.findByText("unauthenticated")).toBeInTheDocument();
  });

  it("restores through /auth/me and replaces the persisted role", async () => {
    const storage = storageAdapter(storedSession);
    const { request } = renderProvider({
      storage: storage.adapter,
      responses: [
        { user: { id: 1, username: "current-user", role: "VIEWER" } },
      ],
    });

    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    expect(screen.getByTestId("identity")).toHaveTextContent(
      "current-user:VIEWER",
    );
    expect(request).toHaveBeenCalledWith(
      "/auth/me",
      expect.objectContaining({ auth: "protected" }),
    );
    expect(requestOptions(request, 0).signal).toBeInstanceOf(AbortSignal);
    expect(storage.current()?.user.role).toBe("VIEWER");
  });

  it.each([
    ["network", new TypeError("network")],
    ["server", new ApiResponseError(500)],
    ["unexpected forbidden", new ApiResponseError(403)],
    ["malformed", { user: { id: "bad" } }],
  ])(
    "enters restoration-error for %s without exposing a User",
    async (_case, response) => {
      renderProvider({
        storage: storageAdapter(storedSession).adapter,
        responses: [response],
      });

      expect(await screen.findByText("restoration-error")).toBeInTheDocument();
      expect(screen.getByTestId("identity")).toHaveTextContent(":");
    },
  );

  it("clears the session and QueryClient when disabled or deleted Users produce a restoration 401", async () => {
    const storage = storageAdapter(storedSession);
    const { queryClient } = renderProvider({
      storage: storage.adapter,
      responses: [new ApiResponseError(401)],
    });
    queryClient.setQueryData(["protected"], "sensitive");

    expect(await screen.findByText("unauthenticated")).toBeInTheDocument();
    expect(storage.adapter.clear).toHaveBeenCalled();
    expect(queryClient.getQueryData(["protected"])).toBeUndefined();
  });

  it("retries a recoverable restoration failure", async () => {
    renderProvider({
      storage: storageAdapter(storedSession).adapter,
      responses: [
        new TypeError("network"),
        { user: { id: 1, username: "restored", role: "OPERATOR" } },
      ],
    });
    const user = userEvent.setup();
    expect(await screen.findByText("restoration-error")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    expect(screen.getByTestId("identity")).toHaveTextContent(
      "restored:OPERATOR",
    );
  });

  it("persists the exact Login session using the response lifetime", async () => {
    const storage = storageAdapter();
    const response: LoginResponse = {
      access_token: "login-token",
      token_type: "bearer",
      expires_in: 37,
      user: { id: 4, username: "admin", role: "ADMIN" },
    };
    renderProvider({
      storage: storage.adapter,
      responses: [response],
      now: () => 2_000,
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    expect(storage.current()).toEqual({
      version: 1,
      accessToken: "login-token",
      tokenType: "bearer",
      expiresAt: 39_000,
      user: { id: 4, username: "admin", role: "ADMIN" },
    });
  });

  it("classifies a whitespace-only username as client-side validation", async () => {
    const { authentication, request } = renderProvider();
    expect(await screen.findByText("unauthenticated")).toBeInTheDocument();

    await expect(
      authentication().login({ username: "   ", password: "password" }),
    ).rejects.toMatchObject({ kind: "validation" });
    expect(request).not.toHaveBeenCalled();
    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
  });

  it("fails closed when Login persistence fails", async () => {
    const storage = storageAdapter();
    storage.adapter.write.mockReturnValue(false);
    const response = {
      access_token: "login-token",
      token_type: "bearer",
      expires_in: 37,
      user: { id: 4, username: "admin", role: "ADMIN" },
    };
    renderProvider({ storage: storage.adapter, responses: [response] });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(storage.adapter.write).toHaveBeenCalled());
    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    expect(screen.getByTestId("identity")).toHaveTextContent(":");
  });

  it("cancels and clears Query state on Logout", async () => {
    const storage = storageAdapter(storedSession);
    const { queryClient } = renderProvider({
      storage: storage.adapter,
      responses: [{ user: storedSession.user }],
    });
    const cancel = vi.spyOn(queryClient, "cancelQueries");
    queryClient.setQueryData(["protected"], "sensitive");
    const user = userEvent.setup();
    expect(await screen.findByText("authenticated")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(await screen.findByText("unauthenticated")).toBeInTheDocument();
    expect(cancel).toHaveBeenCalled();
    expect(queryClient.getQueryData(["protected"])).toBeUndefined();
  });

  it("enforces expiry with a timer without polling /auth/me", async () => {
    vi.useFakeTimers();
    let now = 1_000;
    const session = { ...storedSession, expiresAt: 2_000 };
    const storage = storageAdapter(session);
    const { request } = renderProvider({
      storage: storage.adapter,
      responses: [{ user: session.user }],
      now: () => now,
    });
    await act(async () => Promise.resolve());
    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");

    now = 2_000;
    await act(async () => vi.advanceTimersByTimeAsync(1_000));
    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("rechecks expiry when browser focus returns", async () => {
    vi.useFakeTimers();
    let now = 1_000;
    const session = { ...storedSession, expiresAt: 2_000 };
    const storage = storageAdapter(session);
    const { request } = renderProvider({
      storage: storage.adapter,
      responses: [{ user: session.user }],
      now: () => now,
    });
    await act(async () => Promise.resolve());
    now = 2_000;
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      await Promise.resolve();
    });
    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("rechecks expiry when document visibility returns to visible", async () => {
    vi.useFakeTimers();
    let now = 1_000;
    const session = { ...storedSession, expiresAt: 2_000 };
    const storage = storageAdapter(session);
    const { request } = renderProvider({
      storage: storage.adapter,
      responses: [{ user: session.user }],
      now: () => now,
    });
    await act(async () => Promise.resolve());
    now = 2_000;
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });

    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("invalidates the current generation when a protected request returns 401", async () => {
    const storage = storageAdapter(storedSession);
    const { authentication, queryClient } = renderProvider({
      storage: storage.adapter,
      responses: [{ user: storedSession.user }, new ApiResponseError(401)],
    });
    queryClient.setQueryData(["protected"], "sensitive");
    expect(await screen.findByText("authenticated")).toBeInTheDocument();

    await expect(
      authentication().protectedRequest("/dashboard"),
    ).rejects.toMatchObject({ name: "AbortError" });

    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    expect(storage.current()).toBeUndefined();
    expect(queryClient.getQueryData(["protected"])).toBeUndefined();
  });

  it("prevents a pending Login from restoring authentication after Logout", async () => {
    const pendingLogin = deferred<LoginResponse>();
    const storage = storageAdapter();
    const { authentication, request } = renderProvider({
      storage: storage.adapter,
      responses: [pendingLogin.promise],
    });
    expect(await screen.findByText("unauthenticated")).toBeInTheDocument();

    const login = authentication().login({
      username: "admin",
      password: "password",
    });
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    const signal = requestOptions(request, 0).signal as AbortSignal;
    await act(async () => authentication().logout());
    pendingLogin.resolve({
      access_token: "late-token",
      token_type: "bearer",
      expires_in: 60,
      user: { id: 1, username: "late-admin", role: "ADMIN" },
    });

    await expect(login).rejects.toMatchObject({ name: "AbortError" });
    expect(signal.aborted).toBe(true);
    expect(storage.adapter.write).not.toHaveBeenCalled();
    expect(storage.current()).toBeUndefined();
    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
  });

  it("prevents a late protected response from publishing Query data after Logout", async () => {
    const pendingProtected = deferred<{ value: string }>();
    const storage = storageAdapter(storedSession);
    const { authentication, queryClient, request } = renderProvider({
      storage: storage.adapter,
      responses: [{ user: storedSession.user }, pendingProtected.promise],
    });
    expect(await screen.findByText("authenticated")).toBeInTheDocument();

    const result = authentication()
      .protectedRequest<{ value: string }>("/dashboard")
      .then((data) => {
        queryClient.setQueryData(["protected"], data);
        return data;
      });
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    const signal = requestOptions(request, 1).signal as AbortSignal;
    await act(async () => authentication().logout());
    pendingProtected.resolve({ value: "late-sensitive-data" });

    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(signal.aborted).toBe(true);
    expect(queryClient.getQueryData(["protected"])).toBeUndefined();
  });

  it("keeps a newer Login session intact after a stale protected 401", async () => {
    const pendingProtected = deferred<unknown>();
    const storage = storageAdapter(storedSession);
    const loginResponse: LoginResponse = {
      access_token: "new-token",
      token_type: "bearer",
      expires_in: 60,
      user: { id: 2, username: "new-admin", role: "ADMIN" },
    };
    const { authentication, queryClient, request } = renderProvider({
      storage: storage.adapter,
      responses: [
        { user: storedSession.user },
        pendingProtected.promise,
        loginResponse,
      ],
    });
    expect(await screen.findByText("authenticated")).toBeInTheDocument();

    const staleRequest = authentication().protectedRequest("/dashboard");
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    await act(async () => authentication().logout());
    await act(async () =>
      authentication().login({ username: "admin", password: "password" }),
    );
    queryClient.setQueryData(["session-b"], "current-data");

    pendingProtected.reject(new ApiResponseError(401));

    await expect(staleRequest).rejects.toMatchObject({ name: "AbortError" });
    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    expect(screen.getByTestId("identity")).toHaveTextContent("new-admin:ADMIN");
    expect(storage.current()?.accessToken).toBe("new-token");
    expect(queryClient.getQueryData(["session-b"])).toBe("current-data");
  });

  it("keeps a newer Login session intact after a stale restoration 401", async () => {
    const pendingRestoration = deferred<unknown>();
    const storage = storageAdapter(storedSession);
    const loginResponse: LoginResponse = {
      access_token: "new-token",
      token_type: "bearer",
      expires_in: 60,
      user: { id: 2, username: "new-admin", role: "ADMIN" },
    };
    const { authentication, request } = renderProvider({
      storage: storage.adapter,
      responses: [pendingRestoration.promise, loginResponse],
    });
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));

    await act(async () =>
      authentication().login({ username: "admin", password: "password" }),
    );
    pendingRestoration.reject(new ApiResponseError(401));
    await act(async () => Promise.resolve());

    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    expect(screen.getByTestId("identity")).toHaveTextContent("new-admin:ADMIN");
    expect(storage.current()?.accessToken).toBe("new-token");
  });

  it("does not let an older invalidation suppress a current-generation 401", async () => {
    const olderCancellation = deferred<void>();
    const storage = storageAdapter(storedSession);
    const loginResponse: LoginResponse = {
      access_token: "new-token",
      token_type: "bearer",
      expires_in: 60,
      user: { id: 2, username: "new-admin", role: "ADMIN" },
    };
    const { authentication, queryClient } = renderProvider({
      storage: storage.adapter,
      responses: [
        { user: storedSession.user },
        loginResponse,
        new ApiResponseError(401),
      ],
    });
    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    vi.spyOn(queryClient, "cancelQueries")
      .mockReturnValueOnce(olderCancellation.promise)
      .mockResolvedValueOnce(undefined);

    const olderInvalidation = authentication().logout();
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );
    await act(async () =>
      authentication().login({ username: "admin", password: "password" }),
    );
    queryClient.setQueryData(["session-b"], "sensitive-current-data");

    await expect(
      authentication().protectedRequest("/dashboard"),
    ).rejects.toMatchObject({ name: "AbortError" });

    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    expect(storage.current()).toBeUndefined();
    expect(queryClient.getQueryData(["session-b"])).toBeUndefined();
    olderCancellation.resolve();
    await olderInvalidation;
  });

  it("does not let an older invalidation clear newer-generation Query data", async () => {
    const olderCancellation = deferred<void>();
    const storage = storageAdapter(storedSession);
    const loginResponse: LoginResponse = {
      access_token: "new-token",
      token_type: "bearer",
      expires_in: 60,
      user: { id: 2, username: "new-admin", role: "ADMIN" },
    };
    const { authentication, queryClient } = renderProvider({
      storage: storage.adapter,
      responses: [{ user: storedSession.user }, loginResponse],
    });
    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    vi.spyOn(queryClient, "cancelQueries").mockReturnValueOnce(
      olderCancellation.promise,
    );

    const olderInvalidation = authentication().logout();
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );
    await act(async () =>
      authentication().login({ username: "admin", password: "password" }),
    );
    queryClient.setQueryData(["session-b"], "current-data");

    olderCancellation.resolve();
    await olderInvalidation;

    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    expect(storage.current()?.accessToken).toBe("new-token");
    expect(queryClient.getQueryData(["session-b"])).toBe("current-data");
  });

  it("makes concurrent current-generation protected 401 responses idempotent", async () => {
    const firstUnauthorized = deferred<unknown>();
    const secondUnauthorized = deferred<unknown>();
    const storage = storageAdapter(storedSession);
    const { authentication, queryClient, request } = renderProvider({
      storage: storage.adapter,
      responses: [
        { user: storedSession.user },
        firstUnauthorized.promise,
        secondUnauthorized.promise,
      ],
    });
    const cancel = vi.spyOn(queryClient, "cancelQueries");
    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    storage.adapter.clear.mockClear();

    const firstRequest = authentication().protectedRequest("/dashboard");
    const secondRequest = authentication().protectedRequest("/alarms");
    await waitFor(() => expect(request).toHaveBeenCalledTimes(3));
    firstUnauthorized.reject(new ApiResponseError(401));
    secondUnauthorized.reject(new ApiResponseError(401));

    await expect(firstRequest).rejects.toMatchObject({ name: "AbortError" });
    await expect(secondRequest).rejects.toMatchObject({ name: "AbortError" });

    expect(storage.adapter.clear).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
  });

  it("preserves the current session and QueryClient after a protected 403", async () => {
    const storage = storageAdapter(storedSession);
    const { authentication, queryClient } = renderProvider({
      storage: storage.adapter,
      responses: [{ user: storedSession.user }, new ApiResponseError(403)],
    });
    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    queryClient.setQueryData(["protected"], "preserved");

    await expect(
      authentication().protectedRequest("/users"),
    ).rejects.toMatchObject({ status: 403 });

    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    expect(storage.current()?.accessToken).toBe("opaque-token");
    expect(queryClient.getQueryData(["protected"])).toBe("preserved");
  });

  it("clears QueryClient state even when query cancellation rejects", async () => {
    const storage = storageAdapter(storedSession);
    const { authentication, queryClient } = renderProvider({
      storage: storage.adapter,
      responses: [{ user: storedSession.user }],
    });
    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    vi.spyOn(queryClient, "cancelQueries").mockRejectedValueOnce(
      new Error("cancellation failed"),
    );
    queryClient.setQueryData(["protected"], "sensitive");

    await expect(authentication().logout()).resolves.toBeUndefined();

    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    expect(storage.current()).toBeUndefined();
    expect(queryClient.getQueryData(["protected"])).toBeUndefined();
  });

  it("aborts restoration on local expiry without showing a restoration error", async () => {
    vi.useFakeTimers();
    let now = 1_000;
    const pendingRestoration = deferred<{ user: typeof storedSession.user }>();
    const expiringSession = { ...storedSession, expiresAt: 2_000 };
    const storage = storageAdapter(expiringSession);
    const { request } = renderProvider({
      storage: storage.adapter,
      responses: [pendingRestoration.promise],
      now: () => now,
    });
    await act(async () => Promise.resolve());
    const signal = requestOptions(request, 0).signal as AbortSignal;

    now = 2_000;
    await act(async () => vi.advanceTimersByTimeAsync(1_000));
    pendingRestoration.resolve({ user: storedSession.user });
    await act(async () => Promise.resolve());

    expect(signal.aborted).toBe(true);
    expect(storage.adapter.write).not.toHaveBeenCalled();
    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
  });

  it("does not dispatch protected requests after local expiry", async () => {
    let now = 1_000;
    const expiringSession = { ...storedSession, expiresAt: 2_000 };
    const { authentication, request } = renderProvider({
      storage: storageAdapter(expiringSession).adapter,
      responses: [{ user: expiringSession.user }],
      now: () => now,
    });
    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    now = 2_000;

    await expect(
      authentication().protectedRequest("/dashboard"),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(request).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
  });

  it("aborts a pending protected request when the session expires", async () => {
    vi.useFakeTimers();
    let now = 1_000;
    const pendingProtected = deferred<{ value: string }>();
    const expiringSession = { ...storedSession, expiresAt: 2_000 };
    const { authentication, queryClient, request } = renderProvider({
      storage: storageAdapter(expiringSession).adapter,
      responses: [{ user: expiringSession.user }, pendingProtected.promise],
      now: () => now,
    });
    await act(async () => Promise.resolve());
    const result = authentication()
      .protectedRequest<{ value: string }>("/dashboard")
      .then((data) => {
        queryClient.setQueryData(["protected"], data);
        return data;
      });
    await act(async () => Promise.resolve());
    const signal = requestOptions(request, 1).signal as AbortSignal;

    now = 2_000;
    await act(async () => vi.advanceTimersByTimeAsync(1_000));
    pendingProtected.resolve({ value: "late-sensitive-data" });

    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(signal.aborted).toBe(true);
    expect(queryClient.getQueryData(["protected"])).toBeUndefined();
    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
  });

  it.each(["bootstrapping", "restoration-error"])(
    "blocks external protected requests while %s",
    async (state) => {
      const pending = deferred<{ user: typeof storedSession.user }>();
      const response =
        state === "bootstrapping" ? pending.promise : new TypeError("network");
      const { authentication, request } = renderProvider({
        storage: storageAdapter(storedSession).adapter,
        responses: [response],
      });
      if (state === "restoration-error") {
        expect(
          await screen.findByText("restoration-error"),
        ).toBeInTheDocument();
      } else {
        await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
      }

      await expect(
        authentication().protectedRequest("/dashboard"),
      ).rejects.toMatchObject({ name: "AbortError" });
      expect(request).toHaveBeenCalledTimes(1);
    },
  );

  it("re-arms expiry timers for lifetimes longer than the platform maximum", async () => {
    vi.useFakeTimers();
    const maximumDelay = 2_147_483_647;
    let now = 1_000;
    const longSession = {
      ...storedSession,
      expiresAt: now + maximumDelay + 5_000,
    };
    renderProvider({
      storage: storageAdapter(longSession).adapter,
      responses: [{ user: longSession.user }],
      now: () => now,
    });
    await act(async () => Promise.resolve());

    now += maximumDelay;
    await act(async () => vi.advanceTimersByTimeAsync(maximumDelay));
    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");

    now += 5_000;
    await act(async () => vi.advanceTimersByTimeAsync(5_000));
    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
  });

  it("preserves caller headers and links the caller AbortSignal", async () => {
    const pendingProtected = deferred<unknown>();
    const caller = new AbortController();
    const { authentication, request } = renderProvider({
      storage: storageAdapter(storedSession).adapter,
      responses: [{ user: storedSession.user }, pendingProtected.promise],
    });
    expect(await screen.findByText("authenticated")).toBeInTheDocument();

    const result = authentication().protectedRequest("/dashboard", {
      headers: { "X-Request-ID": "request-1" },
      signal: caller.signal,
    });
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    const options = requestOptions(request, 1);
    const linkedSignal = options.signal as AbortSignal;
    caller.abort();
    pendingProtected.resolve({ value: "ignored" });

    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(options.headers).toEqual({ "X-Request-ID": "request-1" });
    expect(linkedSignal).not.toBe(caller.signal);
    expect(linkedSignal.aborted).toBe(true);
  });

  it("aborts owned requests and suppresses late updates during cleanup", async () => {
    const pendingRestoration = deferred<{ user: typeof storedSession.user }>();
    const storage = storageAdapter(storedSession);
    const { request, unmount } = renderProvider({
      storage: storage.adapter,
      responses: [pendingRestoration.promise],
    });
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    const signal = requestOptions(request, 0).signal as AbortSignal;

    unmount();
    pendingRestoration.resolve({ user: storedSession.user });
    await Promise.resolve();

    expect(signal.aborted).toBe(true);
    expect(storage.adapter.write).not.toHaveBeenCalled();
  });

  it("lets a newer Login supersede an older restoration operation", async () => {
    const pendingRestoration = deferred<{ user: typeof storedSession.user }>();
    const storage = storageAdapter(storedSession);
    const loginResponse: LoginResponse = {
      access_token: "new-token",
      token_type: "bearer",
      expires_in: 60,
      user: { id: 2, username: "new-admin", role: "ADMIN" },
    };
    const { authentication, request } = renderProvider({
      storage: storage.adapter,
      responses: [pendingRestoration.promise, loginResponse],
    });
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));

    await act(async () =>
      authentication().login({ username: "admin", password: "password" }),
    );
    pendingRestoration.resolve({ user: storedSession.user });
    await act(async () => Promise.resolve());

    expect(screen.getByTestId("identity")).toHaveTextContent("new-admin:ADMIN");
    expect(storage.current()?.accessToken).toBe("new-token");
  });
});

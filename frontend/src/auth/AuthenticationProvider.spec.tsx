import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiResponseError, type ApiClientConfiguration } from "../api/client";
import type { LoginResponse } from "./contracts";
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

function Probe() {
  const authentication = useAuthentication();
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
}: {
  storage?: AuthenticationStorageAdapter;
  responses?: unknown[];
  now?: () => number;
} = {}) {
  const request = vi.fn();
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
  render(
    <QueryClientProvider client={queryClient}>
      <AuthenticationProvider
        storageAdapter={storage}
        now={now}
        createClient={createClient}
      >
        <Probe />
      </AuthenticationProvider>
    </QueryClientProvider>,
  );
  return { configuration: () => configuration, queryClient, request };
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
    expect(request).toHaveBeenCalledWith("/auth/me", { auth: "protected" });
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

  it("clears the session and QueryClient after a restoration 401", async () => {
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

  it("enforces expiry on timer, focus, and visibility without polling /auth/me", async () => {
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
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      await Promise.resolve();
    });
    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("allows the API client callback to invalidate a protected session", async () => {
    const storage = storageAdapter(storedSession);
    const { configuration, queryClient } = renderProvider({
      storage: storage.adapter,
      responses: [{ user: storedSession.user }],
    });
    queryClient.setQueryData(["protected"], "sensitive");
    expect(await screen.findByText("authenticated")).toBeInTheDocument();

    await act(async () => configuration()?.onProtectedUnauthorized?.());

    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    expect(queryClient.getQueryData(["protected"])).toBeUndefined();
  });
});

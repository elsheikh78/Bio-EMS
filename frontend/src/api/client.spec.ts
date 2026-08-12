import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiRequestConfigurationError,
  apiRequest,
  createApiClient,
} from "./client";

const apiBaseUrl = "https://api.example.com/api/v1";

function successfulResponse() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

describe("API request headers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each([
    ["plain object", { "X-Request-Id": "object-header" }],
    ["Headers instance", new Headers({ "X-Request-Id": "headers-header" })],
    ["tuple array", [["X-Request-Id", "tuple-header"]] as [string, string][]],
  ])("preserves headers supplied as a %s", async (_label, headers) => {
    vi.stubEnv("VITE_API_BASE_URL", apiBaseUrl);
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(successfulResponse());

    await apiRequest("/health", { headers });

    const requestHeaders = fetchSpy.mock.calls[0]?.[1]?.headers as Headers;
    expect(requestHeaders).toBeInstanceOf(Headers);
    expect(requestHeaders.get("X-Request-Id")).toMatch(/-header$/);
    expect(requestHeaders.get("Accept")).toBe("application/json");
  });

  it("does not replace a caller-provided Accept header", async () => {
    vi.stubEnv("VITE_API_BASE_URL", apiBaseUrl);
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(successfulResponse());

    await apiRequest("/health", {
      headers: { Accept: "application/problem+json" },
    });

    const requestHeaders = fetchSpy.mock.calls[0]?.[1]?.headers as Headers;
    expect(requestHeaders.get("Accept")).toBe("application/problem+json");
  });

  it("injects exactly one adapter-controlled Bearer header in protected mode", async () => {
    vi.stubEnv("VITE_API_BASE_URL", apiBaseUrl);
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(successfulResponse());
    const client = createApiClient({ getAccessToken: () => "opaque-token" });

    await client.request("/auth/me", {
      auth: "protected",
      headers: { "X-Request-Id": "preserved" },
    });

    const headers = fetchSpy.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer opaque-token");
    expect(headers.get("X-Request-Id")).toBe("preserved");
    expect(headers.get("Authorization")).toBe("Bearer opaque-token");
  });

  it.each(["public", "protected"] as const)(
    "rejects caller-supplied Authorization in %s mode",
    async (auth) => {
      vi.stubEnv("VITE_API_BASE_URL", apiBaseUrl);
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const client = createApiClient({ getAccessToken: () => "managed-token" });

      await expect(
        client.request("/auth/login", {
          auth,
          headers: { Authorization: "Bearer caller-token" },
        }),
      ).rejects.toBeInstanceOf(ApiRequestConfigurationError);
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it("sends Login in public mode without Authorization", async () => {
    vi.stubEnv("VITE_API_BASE_URL", apiBaseUrl);
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(successfulResponse());
    const client = createApiClient({ getAccessToken: () => "existing-token" });

    await client.request("/auth/login", { auth: "public", method: "POST" });

    const headers = fetchSpy.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.has("Authorization")).toBe(false);
  });

  it("surfaces protected 401 and 403 responses for generation-scoped handling", async () => {
    vi.stubEnv("VITE_API_BASE_URL", apiBaseUrl);
    const client = createApiClient({
      getAccessToken: () => "opaque-token",
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication required",
          },
        }),
        { status: 401 },
      ),
    );

    await expect(
      client.request("/auth/me", { auth: "protected" }),
    ).rejects.toMatchObject({ status: 401 });

    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: { code: "FORBIDDEN", message: "Forbidden" },
        }),
        { status: 403 },
      ),
    );
    await expect(
      client.request("/users", { auth: "protected" }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("surfaces a public Login 401 without adding Authorization", async () => {
    vi.stubEnv("VITE_API_BASE_URL", apiBaseUrl);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid credentials",
          },
        }),
        { status: 401 },
      ),
    );
    const client = createApiClient();

    await expect(
      client.request("/auth/login", { auth: "public" }),
    ).rejects.toMatchObject({ status: 401 });
    const headers = fetchSpy.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.has("Authorization")).toBe(false);
  });
});

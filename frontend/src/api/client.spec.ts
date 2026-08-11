import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./client";

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
});

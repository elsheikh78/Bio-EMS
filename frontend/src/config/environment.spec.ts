import { describe, expect, it } from "vitest";
import { loadEnvironment } from "./environment";

describe("public environment validation", () => {
  it("accepts an explicit API base URL", () => {
    expect(
      loadEnvironment({ VITE_API_BASE_URL: "http://localhost:3001/api/v1" }),
    ).toEqual({
      VITE_API_BASE_URL: "http://localhost:3001/api/v1",
    });
  });

  it.each([
    undefined,
    "",
    "not-a-url",
    "http://localhost:3001/api/v1/",
    "ftp://localhost/api/v1",
    "file:///api/v1",
    "https://user@example.com/api/v1",
    "https://user:password@example.com/api/v1",
    "https://example.com/api/v1?tenant=one",
    "https://example.com/api/v1#section",
  ])("rejects an invalid API base URL: %s", (value) =>
    expect(() => loadEnvironment({ VITE_API_BASE_URL: value })).toThrow(),
  );
});

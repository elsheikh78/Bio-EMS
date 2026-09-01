import { describe, expect, it } from "vitest";
import { getPlatformRouteDecision } from "./platformRouteDecision";

describe("SYSTEM_OWNER route boundary", () => {
  it("allows only an authenticated platform session", () => {
    expect(getPlatformRouteDecision("authenticated")).toBe("allow");
  });

  it("routes unauthenticated access to the isolated owner login", () => {
    expect(getPlatformRouteDecision("unauthenticated")).toBe("login");
  });

  it("fails closed while restoring or after an uncertain restoration", () => {
    expect(getPlatformRouteDecision("bootstrapping")).toBe("loading");
    expect(getPlatformRouteDecision("restoration-error")).toBe("not-found");
  });
});

import { describe, expect, it } from "vitest";
import { resolveSafeReturnPath, routePolicies } from "./routePolicy";

describe("safe post-Login return policy", () => {
  it("accepts only known internal routes permitted for the authenticated role", () => {
    expect(resolveSafeReturnPath({ returnTo: "/users" }, "ADMIN")).toBe(
      "/users",
    );
    expect(resolveSafeReturnPath({ returnTo: "/alarms" }, "VIEWER")).toBe(
      "/alarms",
    );
    expect(resolveSafeReturnPath({ returnTo: "/foundation" }, "VIEWER")).toBe(
      "/",
    );
  });

  it.each([
    "https://example.com/users",
    "//example.com/users",
    "/login",
    "/unknown",
    "/users?role=ADMIN",
  ])("rejects unsafe or unknown return target %s", (returnTo) => {
    expect(resolveSafeReturnPath({ returnTo }, "ADMIN")).toBe("/");
  });

  it("rejects a known route that the current role cannot access", () => {
    expect(resolveSafeReturnPath({ returnTo: "/users" }, "OPERATOR")).toBe("/");
    expect(resolveSafeReturnPath({ returnTo: "/users" }, "VIEWER")).toBe("/");
  });

  it("uses CONFIGURATION_READ for both configuration presentation routes", () => {
    expect(routePolicies["/monitored-areas"]).toBe("CONFIGURATION_READ");
    expect(routePolicies["/sensors-calibration"]).toBe("CONFIGURATION_READ");
    expect(routePolicies["/configuration"]).toBe("CONFIGURATION_READ");
  });

  it("uses REPORT_READ for the Reports Center", () => {
    expect(routePolicies["/reports"]).toBe("REPORT_READ");
    expect(resolveSafeReturnPath({ returnTo: "/reports" }, "VIEWER")).toBe(
      "/reports",
    );
  });
});

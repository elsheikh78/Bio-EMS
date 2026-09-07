import { describe, expect, it } from "vitest";
import { assertLicenseTransition, canTransitionLicense } from "./licensing.domain";

describe("licensing domain", () => {
  it("allows the controlled issue and activation lifecycle", () => {
    expect(canTransitionLicense("DRAFT", "ISSUED")).toBe(true);
    expect(canTransitionLicense("ISSUED", "ACTIVE")).toBe(true);
    expect(canTransitionLicense("SUSPENDED", "ACTIVE")).toBe(true);
  });

  it("keeps revoked and superseded licenses terminal", () => {
    expect(canTransitionLicense("REVOKED", "ACTIVE")).toBe(false);
    expect(canTransitionLicense("SUPERSEDED", "ACTIVE")).toBe(false);
    expect(() => assertLicenseTransition("REVOKED", "ACTIVE")).toThrow(
      "Invalid license status transition: REVOKED -> ACTIVE"
    );
  });
});

import { describe, expect, it } from "vitest";
import { PLATFORM_OWNER_IDLE_TIMEOUT_MS } from "./PlatformAuthenticationProvider";

describe("System Owner inactivity policy", () => {
  it("uses the approved 30-minute browser idle timeout", () => {
    expect(PLATFORM_OWNER_IDLE_TIMEOUT_MS).toBe(30 * 60 * 1000);
  });
});

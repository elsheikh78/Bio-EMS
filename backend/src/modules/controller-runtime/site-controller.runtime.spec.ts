import { describe, expect, it } from "vitest";
import { SiteControllerRuntime } from "./site-controller.runtime";

const SITE_UUID = "11111111-1111-4111-8111-111111111111";
const OTHER_SITE_UUID = "22222222-2222-4222-8222-222222222222";
const CHECKSUM = "a".repeat(64);

function bootInput(overrides: Record<string, unknown> = {}) {
  return {
    identity: {
      runtime_name: "bio-ems-site-controller",
      runtime_version: "0.1.0",
      build_id: "p2-01-test-build",
      hardware_profile: "STANDARD",
    },
    boundary: {
      controller_id: "controller-001",
      site_uuid: SITE_UUID,
      config_contract_version: 1,
    },
    persisted_config: {
      site_uuid: SITE_UUID,
      config_version: 7,
      checksum_sha256: CHECKSUM,
    },
    primary_transport_available: true,
    ...overrides,
  };
}

describe("SiteControllerRuntime", () => {
  it("boots deterministically online with a matching acknowledged config", () => {
    const runtime = SiteControllerRuntime.boot(bootInput(), 1_000);

    expect(runtime.snapshot()).toMatchObject({
      state: "READY_ONLINE",
      primary_transport_available: true,
      effective_config: { site_uuid: SITE_UUID, config_version: 7 },
      watchdog: { timeout_ms: 30_000, last_heartbeat_at_ms: 1_000, restart_count: 0 },
    });
  });

  it("boots offline using the last acknowledged config", () => {
    const runtime = SiteControllerRuntime.boot(
      bootInput({ primary_transport_available: false }),
      1_000
    );

    expect(runtime.snapshot().state).toBe("READY_OFFLINE");
  });

  it("signals not-ready when no acknowledged config exists", () => {
    const runtime = SiteControllerRuntime.boot(bootInput({ persisted_config: null }), 1_000);

    expect(runtime.snapshot()).toMatchObject({
      state: "NOT_READY_NO_CONFIG",
      effective_config: null,
    });
  });

  it("rejects persisted config from another Site boundary", () => {
    const runtime = SiteControllerRuntime.boot(
      bootInput({
        persisted_config: {
          site_uuid: OTHER_SITE_UUID,
          config_version: 1,
          checksum_sha256: CHECKSUM,
        },
      }),
      1_000
    );

    expect(runtime.snapshot()).toMatchObject({
      state: "NOT_READY_SITE_MISMATCH",
      effective_config: null,
    });
  });

  it("tracks connectivity without discarding the effective config", () => {
    const runtime = SiteControllerRuntime.boot(bootInput(), 1_000);

    expect(runtime.setPrimaryTransportAvailable(false).state).toBe("READY_OFFLINE");
    expect(runtime.setPrimaryTransportAvailable(true).state).toBe("READY_ONLINE");
    expect(runtime.snapshot().effective_config?.config_version).toBe(7);
  });

  it("marks restart required only after watchdog timeout and recovers deterministically", () => {
    const runtime = SiteControllerRuntime.boot(bootInput(), 1_000);

    expect(runtime.watchdogCheck(31_000).state).toBe("READY_ONLINE");
    expect(runtime.watchdogCheck(31_001).state).toBe("RESTART_REQUIRED");

    const restarted = runtime.restart(32_000);
    expect(restarted).toMatchObject({
      state: "READY_ONLINE",
      watchdog: { last_heartbeat_at_ms: 32_000, restart_count: 1 },
    });
  });

  it("does not silently accept an acknowledged config for another Site", () => {
    const runtime = SiteControllerRuntime.boot(bootInput(), 1_000);

    const snapshot = runtime.setAcknowledgedConfig({
      site_uuid: OTHER_SITE_UUID,
      config_version: 8,
      checksum_sha256: CHECKSUM,
    });

    expect(snapshot).toMatchObject({
      state: "NOT_READY_SITE_MISMATCH",
      effective_config: null,
    });
  });
});

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createConfigDeliveryEnvelope } from "../controller-sync/offline-critical-config.contract";
import { FileDurableConfigStore } from "./durable-config.store";
import { SiteControllerRuntime } from "./site-controller.runtime";

const SITE_UUID = "e70cb67a-0ab0-4e57-ac61-d6142990ca37";
const CONTROLLER_ID = "controller-001";
const ACK_TIME = "2026-08-31T16:00:00Z";
const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function store() {
  const directory = mkdtempSync(join(tmpdir(), "bio-ems-p2-03-"));
  directories.push(directory);
  const filePath = join(directory, "controller-config.json");
  return { filePath, value: new FileDurableConfigStore(filePath) };
}

function bootInput() {
  return {
    identity: {
      runtime_name: "bio-ems-site-controller",
      runtime_version: "0.1.0",
      build_id: "p2-03-test-build",
      hardware_profile: "STANDARD",
    },
    boundary: {
      controller_id: CONTROLLER_ID,
      site_uuid: SITE_UUID,
      config_contract_version: 1,
    },
    persisted_config: null,
    primary_transport_available: false,
  };
}

function bundle(configVersion: number) {
  return {
    contract_version: 1 as const,
    config_version: configVersion,
    site_uuid: SITE_UUID,
    issued_at: "2026-08-31T15:59:00Z",
    sensors: [],
    sms_failover: { enabled: false, primary_unavailable_after_seconds: 300 },
    sms_targets: [],
    critical_escalation_steps: [],
  };
}

describe("durable local controller configuration", () => {
  it("persists an applied configuration and recovers it after a fresh boot", () => {
    const durable = store();
    const runtime = SiteControllerRuntime.boot(bootInput(), 1_000, durable.value);
    const envelope = createConfigDeliveryEnvelope(bundle(7));

    const result = runtime.receiveConfigEnvelope(envelope, ACK_TIME);
    expect(result.acknowledgement.status).toBe("APPLIED");

    const restarted = SiteControllerRuntime.boot(bootInput(), 2_000, durable.value);
    expect(restarted.snapshot()).toMatchObject({
      state: "READY_OFFLINE",
      effective_config: {
        site_uuid: SITE_UUID,
        config_version: 7,
        checksum_sha256: envelope.checksum_sha256,
      },
    });
  });

  it("rejects corrupted durable data instead of booting from it", () => {
    const durable = store();
    durable.value.save(
      CONTROLLER_ID,
      { site_uuid: SITE_UUID, config_version: 3, checksum_sha256: "a".repeat(64) },
      ACK_TIME
    );
    const record = JSON.parse(readFileSync(durable.filePath, "utf8")) as Record<string, unknown>;
    writeFileSync(
      durable.filePath,
      `${JSON.stringify({ ...record, integrity_sha256: "0".repeat(64) })}\n`
    );

    const runtime = SiteControllerRuntime.boot(bootInput(), 1_000, durable.value);
    expect(runtime.snapshot().state).toBe("NOT_READY_NO_CONFIG");
    expect(runtime.snapshot().effective_config).toBeNull();
  });

  it("does not replace known-good durable configuration after a rejected candidate", () => {
    const durable = store();
    const runtime = SiteControllerRuntime.boot(bootInput(), 1_000, durable.value);
    const goodEnvelope = createConfigDeliveryEnvelope(bundle(5));
    runtime.receiveConfigEnvelope(goodEnvelope, ACK_TIME);
    const before = readFileSync(durable.filePath, "utf8");

    const staleEnvelope = createConfigDeliveryEnvelope(bundle(4));
    const rejected = runtime.receiveConfigEnvelope(staleEnvelope, "2026-08-31T16:01:00Z");

    expect(rejected.acknowledgement.status).toBe("REJECTED");
    expect(readFileSync(durable.filePath, "utf8")).toBe(before);
  });

  it("refuses durable configuration belonging to another controller or Site", () => {
    const durable = store();
    durable.value.save(
      "controller-other",
      { site_uuid: SITE_UUID, config_version: 2, checksum_sha256: "b".repeat(64) },
      ACK_TIME
    );

    expect(durable.value.load(CONTROLLER_ID, SITE_UUID)).toBeNull();
    expect(
      durable.value.load("controller-other", "c2d4f7da-64f0-4d03-b45d-3735a8d3a2aa")
    ).toBeNull();
  });
});

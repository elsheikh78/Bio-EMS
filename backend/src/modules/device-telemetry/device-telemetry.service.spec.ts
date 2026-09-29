import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { describe, expect, it, vi } from "vitest";
import { DeviceTelemetryService } from "./device-telemetry.service";
import type { TelemetryService } from "../telemetry/services/telemetry.service";

vi.mock("../telemetry/services/telemetry.service", () => ({
  TelemetryService: class {},
}));

const bindingId = "11111111-1111-4111-8111-111111111111";
const token = "a".repeat(64);
const process = vi.fn(async () => {});
const database = {
  prepare: () => ({
    get: () => ({
      bindingId,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      hardwareUid: "AABBCCDDEEFF",
      protocolVersion: "1.3",
      siteCode: "MANIAL",
      deviceId: "D001",
    }),
  }),
} as unknown as Database.Database;
const service = new DeviceTelemetryService(
  database,
  { process } as unknown as TelemetryService,
  () => new Date("2026-09-29T20:00:00Z")
);

describe("device telemetry ingress", () => {
  it("derives the topic and identity from the active binding, not the request", async () => {
    process.mockClear();
    expect(
      await service.accept(bindingId, token, {
        sensors: [{ channel: 5, value: 4.2 }],
        signal: -62,
      })
    ).toBe(true);
    expect(process).toHaveBeenCalledWith(
      "bioems/MANIAL/telemetry/D001",
      expect.objectContaining({
        platformBindingId: bindingId,
        hardwareUid: "AABBCCDDEEFF",
        sensors: [{ channel: 5, value: 4.2 }],
      })
    );
  });
  it("rejects a wrong secret and duplicate or out-of-range channels", async () => {
    process.mockClear();
    expect(
      await service.accept(bindingId, "b".repeat(64), {
        sensors: [{ channel: 1, value: 4 }],
      })
    ).toBe(false);
    expect(process).not.toHaveBeenCalled();
    await expect(
      service.accept(bindingId, token, {
        sensors: [
          { channel: 1, value: 4 },
          { channel: 1, value: 5 },
        ],
      })
    ).rejects.toThrow();
    await expect(
      service.accept(bindingId, token, { sensors: [{ channel: 17, value: 4 }] })
    ).rejects.toThrow();
  });
});

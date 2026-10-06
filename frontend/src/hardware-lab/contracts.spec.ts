import { describe, expect, it } from "vitest";
import {
  hardwareLabProfileSchema,
  hardwareLabRunDetailSchema,
} from "./contracts";

describe("Hardware Lab frontend contracts", () => {
  it("accepts the governed qualification profile", () => {
    const parsed = hardwareLabProfileSchema.parse({
      hardware_profile_rev: "Rev.A-2G",
      test_profile_rev: "HQT-1",
      sensor_success_rate_percent: 99.99,
      fault_codes: ["MISSING_SENSOR"],
      firmware: [
        {
          target: "MAIN16",
          name: "BIOEMS-MAIN16-BENCH",
          chip: "ESP32-S3",
          purpose: "Bench acquisition",
          requiredForPhysicalQualification: true,
        },
      ],
      steps: [
        {
          code: "BENCH_SETUP",
          sequence: 0,
          title: "Bench setup and identification",
          executionMode: "MANUAL",
          acceptanceRule: "Labels recorded",
        },
      ],
    });

    expect(parsed.sensor_success_rate_percent).toBe(99.99);
    expect(parsed.steps[0].code).toBe("BENCH_SETUP");
  });

  it("rejects a qualification run with an unsupported status", () => {
    expect(() =>
      hardwareLabRunDetailSchema.parse({
        run: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          run_code: "HQT-20261006",
          prototype_type: "MAIN16_SIMD4",
          status: "APPROVED",
          operator: "system-owner#owner",
          main_hardware_uid: null,
          sim_serial: null,
          hardware_profile_rev: "Rev.A-2G",
          test_profile_rev: "HQT-1",
          notes: null,
          created_at: "2026-10-06T08:00:00.000Z",
          started_at: null,
          completed_at: null,
          updated_at: "2026-10-06T08:00:00.000Z",
        },
        steps: [],
        firmware: [],
        measurements: [],
        events: [],
      }),
    ).toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { roomsSchema, sensorsSchema, sitesSchema } from "./contracts";

describe("monitored areas contracts", () => {
  it("parses a valid Site collection", () => {
    const payload = [
      {
        id: 1,
        code: "CAIRO",
        name: "Cairo Site",
        location: null,
        timezone: "Africa/Cairo",
        active: 1,
        created_at: "2026-08-24 06:00:00",
      },
    ];

    expect(sitesSchema.parse(payload)).toEqual(payload);
  });

  it("rejects a malformed Site collection", () => {
    expect(() =>
      sitesSchema.parse([
        {
          id: 1,
          code: "CAIRO",
          name: "Cairo Site",
          unexpected: true,
        },
      ]),
    ).toThrow();
  });

  it("parses a valid Room collection", () => {
    const payload = [
      {
        id: 10,
        uuid: "room-uuid-1",
        site_id: 1,
        code: "CR-01",
        name: "Cold Room 01",
        description: null,
        active: 1,
        created_at: "2026-08-13 08:00:00",
        updated_at: "2026-08-13 08:00:00",
      },
    ];

    expect(roomsSchema.parse(payload)).toEqual(payload);
  });

  it("rejects a malformed Room collection", () => {
    expect(() =>
      roomsSchema.parse([
        {
          id: 10,
          uuid: "room-uuid-1",
          site_id: "1",
          code: "CR-01",
          name: "Cold Room 01",
        },
      ]),
    ).toThrow();
  });

  it("parses a valid Sensor collection", () => {
    const payload = [
      {
        id: 100,
        uuid: "sensor-uuid-1",
        room_id: 10,
        device_id: 20,
        channel: 0,
        code: "TEMP-01",
        name: "Temperature Sensor 01",
        sensor_type: "temperature",
        unit: "C",
        min_value: null,
        max_value: 50,
        warning_low: 2,
        alarm_low: 0,
        warning_high: 8,
        alarm_high: 10,
        enabled: 1,
        created_at: "2026-08-13 08:00:00",
        updated_at: "2026-08-13 08:00:00",
      },
    ];

    expect(sensorsSchema.parse(payload)).toEqual(payload);
  });

  it("rejects a malformed Sensor collection", () => {
    expect(() =>
      sensorsSchema.parse([
        {
          id: 100,
          uuid: "sensor-uuid-1",
          room_id: 10,
          device_id: 20,
          channel: 0,
          code: "TEMP-01",
          name: "Temperature Sensor 01",
          sensor_type: "temperature",
        },
      ]),
    ).toThrow();
  });
});

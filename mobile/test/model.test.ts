import { test } from "node:test";
import assert from "node:assert/strict";
import {
  roomState,
  activeAlarmKeys,
  safeOverview,
  type Overview,
} from "../src/model";
import { messages, t } from "../src/locale";
const now = Date.now();
const data: Overview = {
  role: "VIEWER",
  name: "Viewer",
  customerName: "BIO EGYPT",
  serverTime: now,
  snapshotFreshMs: 180000,
  readingFreshMs: 300000,
  sites: [
    {
      id: "s",
      name: "Manial",
      receivedAt: now,
      snapshot: {
        capturedAt: new Date(now).toISOString(),
        telemetryAvailable: true,
        rooms: [{ id: "r", name: "Cold room", code: "CR1" }],
        sensors: [
          {
            id: "t",
            roomId: "r",
            name: "Temp",
            code: "T1",
            type: "TEMPERATURE",
            unit: "°C",
            value: 5,
            recordedAt: new Date(now).toISOString(),
          },
        ],
        alarms: [],
      },
    },
  ],
};
const site = data.sites[0],
  room = site.snapshot!.rooms[0];
test("fresh data is healthy; failed, stale and missing readings cannot be healthy", () => {
  assert.equal(roomState(site, room, now, data, true).level, "normal");
  assert.equal(roomState(site, room, now, data, false).level, "offline");
  assert.equal(
    roomState(site, room, now + 300001, data, true).level,
    "offline",
  );
  const missing = structuredClone(site);
  missing.snapshot!.sensors[0].value = null;
  missing.snapshot!.sensors[0].recordedAt = null;
  assert.equal(roomState(missing, room, now, data, true).level, "offline");
  const failed = structuredClone(site);
  failed.snapshot!.telemetryAvailable = false;
  assert.equal(roomState(failed, room, now, data, true).level, "offline");
});
test("active alarms remain visible during stale data and alarm IDs include site scope", () => {
  const alarming = structuredClone(site);
  alarming.snapshot!.alarms = [
    {
      id: "a",
      roomId: "r",
      sensorId: "t",
      type: "HIGH_TEMPERATURE",
      severity: "CRITICAL",
      status: "ACKNOWLEDGED",
      value: 10,
      triggeredAt: new Date(now).toISOString(),
      recoveredAt: null,
    },
  ];
  assert.equal(
    roomState(alarming, room, now + 400000, data, false).level,
    "critical",
  );
  assert.equal(
    roomState(alarming, room, now + 400000, data, false).stale,
    true,
  );
  assert.deepEqual(activeAlarmKeys([alarming, { ...alarming, id: "other" }]), [
    "s:a",
    "other:a",
  ]);
  alarming.snapshot!.alarms[0].status = "RECOVERED";
  assert.deepEqual(activeAlarmKeys([alarming]), []);
});
test("malformed responses fail closed and all mobile labels have both languages", () => {
  assert.equal(safeOverview(data).role, "VIEWER");
  assert.throws(() => safeOverview({}));
  assert.throws(() => safeOverview({ ...data, role: "ADMIN" }));
  const bad = structuredClone(data);
  bad.sites[0].snapshot!.sensors[0].value = NaN;
  assert.throws(() => safeOverview(bad));
  for (const key of Object.keys(messages)) {
    assert.ok(t("ar", key));
    assert.ok(t("en", key));
    assert.notEqual(t("ar", key), key);
  }
});

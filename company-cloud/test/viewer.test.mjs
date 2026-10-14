import { test } from "node:test";
import assert from "node:assert/strict";
import { roomState, newAlarmKeys } from "../public/viewer/model.js";
import { validateSubscription, validateSnapshot } from "../src/viewer.mjs";
import { readFileSync } from "node:fs";
const now = Date.now(),
  limits = { snapshotFreshMs: 180000, readingFreshMs: 300000 },
  room = { id: "1" },
  sensor = {
    id: "t1",
    roomId: "1",
    value: 5,
    recordedAt: new Date(now).toISOString(),
  };
function site(alarms = []) {
  return {
    id: "site",
    receivedAt: now,
    snapshot: {
      capturedAt: new Date(now).toISOString(),
      telemetryAvailable: true,
      rooms: [room],
      sensors: [sensor],
      alarms,
    },
  };
}
test("stale or missing data never looks healthy; active alarms remain visible", () => {
  assert.equal(roomState(site(), room, now, limits).level, "normal");
  assert.equal(roomState(site(), room, now + 300001, limits).level, "offline");
  assert.equal(roomState(site(), room, now, limits, false).level, "offline");
  const failed = site();
  failed.snapshot.telemetryAvailable = false;
  assert.equal(roomState(failed, room, now, limits).level, "offline");
  const missing = site();
  missing.snapshot.sensors = [];
  assert.equal(roomState(missing, room, now, limits).level, "offline");
  const alert = site([
    { id: "a", roomId: "1", status: "ACKNOWLEDGED", severity: "CRITICAL" },
  ]);
  assert.equal(roomState(alert, room, now + 300001, limits).level, "critical");
  assert.equal(roomState(alert, room, now + 300001, limits).stale, true);
});
test("audio alarm identity deduplicates across snapshots and isolates sites", () => {
  const a = site([
    { id: "a", status: "TRIGGERED" },
    { id: "recovered", status: "RECOVERED" },
  ]);
  assert.deepEqual(newAlarmKeys([a], new Set()), ["site:a"]);
  assert.deepEqual(newAlarmKeys([a], new Set(["site:a"])), []);
  assert.deepEqual(newAlarmKeys([{ ...a, id: "other" }], new Set(["site:a"])), [
    "other:a",
  ]);
});
test("push subscriptions reject arbitrary outbound hosts and malformed keys", () => {
  const keys = { p256dh: "a".repeat(87), auth: "b".repeat(22) };
  for (const endpoint of [
    "http://fcm.googleapis.com/x",
    "https://127.0.0.1/x",
    "https://fcm.googleapis.com.evil.example/x",
    "https://evil.example/x",
    "https://user:pass@web.push.apple.com/x",
    "https://web.push.apple.com:8443/x",
  ])
    assert.throws(() => validateSubscription({ endpoint, keys }));
  assert.ok(
    validateSubscription({ endpoint: "https://web.push.apple.com/test", keys }),
  );
  assert.throws(() =>
    validateSubscription({
      endpoint: "https://web.push.apple.com/test",
      keys: { auth: "bad" },
    }),
  );
});
test("PWA caches public shell only and translates static interface", async () => {
  const sw = readFileSync(
    new URL("../public/viewer/sw.js", import.meta.url),
    "utf8",
  );
  assert.match(sw, /!SHELL.includes/);
  assert.ok(!sw.includes('"/api/'));
  const html = readFileSync(
      new URL("../public/viewer/index.html", import.meta.url),
      "utf8",
    ),
    { translate } = await import("../public/viewer/locale.js");
  for (const match of html.matchAll(/data-t="([^"]+)"/g))
    for (const language of ["ar", "en"])
      assert.notEqual(translate(language, match[1]), match[1]);
});
test("snapshots reject malformed roots", () => {
  for (const input of [
    null,
    {},
    {
      schemaVersion: 1,
      rooms: [],
      sensors: [],
      alarms: [],
      telemetryAvailable: true,
      capturedAt: "invalid",
    },
  ])
    assert.throws(() => validateSnapshot(input));
});

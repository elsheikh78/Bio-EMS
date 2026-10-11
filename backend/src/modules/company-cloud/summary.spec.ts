import Database from "better-sqlite3";
import { expect, it } from "vitest";
import { operationalSummary } from "./summary";
it("reports actual persisted alarms and device health without disabled sensors or recovered alarms", () => {
  const db = new Database(":memory:");
  db.exec(
    "CREATE TABLE sensors(enabled INTEGER); CREATE TABLE devices(status TEXT,activated INTEGER,last_seen_at TEXT); CREATE TABLE alarms(status TEXT); INSERT INTO sensors VALUES(1),(0),(1); INSERT INTO alarms VALUES('TRIGGERED'),('ACKNOWLEDGED'),('RECOVERED');"
  );
  const now = Date.now();
  const insert = db.prepare("INSERT INTO devices VALUES (?,?,?)");
  insert.run("active", 1, new Date(now).toISOString());
  insert.run("active", 1, new Date(now - 600000).toISOString());
  insert.run("active", 1, null);
  insert.run("pending", 0, null);
  expect(operationalSummary(db, now)).toEqual({
    sensorCount: 2,
    deviceCount: 4,
    offlineDevices: 2,
    activeAlarms: 2,
    unacknowledgedAlarms: 1,
  });
  db.close();
});

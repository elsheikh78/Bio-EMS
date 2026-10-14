import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { ViewerExportRepository } from "../viewer-export.repository";

describe("viewer alarm persistence boundary", () => {
  it("includes old acknowledged alarms and recent recovered events only for the installed site", () => {
    const db = new Database(":memory:");
    db.exec(`CREATE TABLE rooms(id INTEGER,site_id INTEGER);
      CREATE TABLE sensors(id INTEGER,room_id INTEGER);
      CREATE TABLE alarms(id INTEGER,sensor_id INTEGER,status TEXT,trigger_time TEXT);
      INSERT INTO rooms VALUES(1,10),(2,20);
      INSERT INTO sensors VALUES(1,1),(2,2);
      INSERT INTO alarms VALUES(1,1,'ACKNOWLEDGED','2025-01-01 00:00:00'),
      (2,1,'RECOVERED','2026-10-14 10:00:00'),
      (3,1,'RECOVERED','2025-01-01 00:00:00'),
      (4,2,'TRIGGERED','2026-10-14 10:00:00');`);
    const alarms = new ViewerExportRepository(db).recentAlarms(10, "2026-10-13 12:00:00");
    expect(alarms.map((a) => a.id)).toEqual([1, 2]);
    db.close();
  });
});

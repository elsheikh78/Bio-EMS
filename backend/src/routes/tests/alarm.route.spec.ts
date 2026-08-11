import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import alarmRouter from "../alarm.route";
import * as alarmService from "../../services/alarm.service";

vi.mock("../../services/alarm.service", () => ({
  getAlarms: vi.fn(),
  getActiveAlarms: vi.fn(),
  getAlarmById: vi.fn(),
  acknowledgeAlarm: vi.fn(),
}));

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.user = { id: 1, username: "admin", role: "ADMIN" };
  next();
});
app.use("/api/v1/alarms", alarmRouter);

describe("Alarm REST API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("preserves the alarm list response contract", async () => {
    vi.mocked(alarmService.getAlarms).mockReturnValue([
      {
        id: 1,
        sensor_id: 3,
        type: "HIGH_TEMPERATURE",
        severity: "WARNING",
        status: "TRIGGERED",
        trigger_value: 9,
      },
    ]);

    const response = await request(app).get("/api/v1/alarms").expect(200);

    expect(response.body).toEqual([
      expect.objectContaining({ id: 1, sensor_id: 3, status: "TRIGGERED" }),
    ]);
  });

  it("preserves the acknowledgement response contract", async () => {
    const response = await request(app).post("/api/v1/alarms/4/acknowledge").expect(200);

    expect(alarmService.acknowledgeAlarm).toHaveBeenCalledWith(4, 1);
    expect(response.body).toEqual({ success: true });
  });
});

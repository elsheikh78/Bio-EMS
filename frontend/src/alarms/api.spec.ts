import { describe, expect, it, vi } from "vitest";
import { createAlarmsApi } from "./api";

const alarm = {
  id: 1,
  sensor_id: 3,
  type: "HIGH_TEMPERATURE",
  severity: "CRITICAL",
  status: "TRIGGERED",
  trigger_value: 9,
  created_at: "2026-08-24 06:00:00",
};
describe("Alarms API", () => {
  it("validates lists and maps acknowledgement", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce([alarm])
      .mockResolvedValueOnce({ success: true });
    const api = createAlarmsApi(request);
    await expect(api.list()).resolves.toEqual([alarm]);
    await expect(api.acknowledge(1)).resolves.toBeUndefined();
    expect(request).toHaveBeenLastCalledWith("/alarms/1/acknowledge", {
      method: "POST",
    });
  });
});

import { describe, expect, it } from "vitest";
import { NotificationEventInput } from "./notification-event";
import { evaluateSmsFailover } from "./sms-failover.policy";

function event(
  eventType: NotificationEventInput["eventType"],
  payload: Record<string, unknown> = {}
): NotificationEventInput {
  return {
    eventType,
    sourceType: eventType.startsWith("DEVICE_") ? "DEVICE" : "ALARM",
    sourceId: "source-1",
    deduplicationKey: `test:${eventType}`,
    payload,
    occurredAt: "2026-08-17T10:00:00.000Z",
  };
}

describe("SMS failover policy", () => {
  it.each([event("ALARM_TRIGGERED", { severity: "CRITICAL" }), event("DEVICE_OFFLINE")])(
    "never selects SMS while primary communication is available",
    (candidate) => {
      expect(evaluateSmsFailover(candidate, "AVAILABLE")).toEqual({
        eligible: false,
        reason: "PRIMARY_AVAILABLE",
      });
    }
  );

  it("selects SMS for a critical Alarm created during a primary outage", () => {
    expect(
      evaluateSmsFailover(event("ALARM_TRIGGERED", { severity: "CRITICAL" }), "UNAVAILABLE")
    ).toEqual({ eligible: true, reason: "CRITICAL_ALARM_DURING_OUTAGE" });
  });

  it("selects SMS for a Device offline transition during a primary outage", () => {
    expect(evaluateSmsFailover(event("DEVICE_OFFLINE"), "UNAVAILABLE")).toEqual({
      eligible: true,
      reason: "DEVICE_OFFLINE_DURING_OUTAGE",
    });
  });

  it.each([
    event("ALARM_TRIGGERED", { severity: "WARNING" }),
    event("ALARM_RECOVERED"),
    event("ALARM_ACKNOWLEDGED"),
    event("DEVICE_STALE"),
    event("DEVICE_ONLINE"),
  ])("rejects non-emergency event $eventType during an outage", (candidate) => {
    expect(evaluateSmsFailover(candidate, "UNAVAILABLE")).toEqual({
      eligible: false,
      reason: "EVENT_NOT_ELIGIBLE",
    });
  });
});

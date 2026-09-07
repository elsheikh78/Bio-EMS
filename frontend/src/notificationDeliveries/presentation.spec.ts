import { describe, expect, it } from "vitest";
import type { NotificationDelivery } from "./contracts";
import { summarizeDeliveries } from "./presentation";

function delivery(status: NotificationDelivery["status"]) {
  return { status } as NotificationDelivery;
}

describe("Notification delivery presentation", () => {
  it("groups delivery lifecycle evidence into operational outcomes", () => {
    expect(
      summarizeDeliveries([
        delivery("PENDING"),
        delivery("RETRY_WAIT"),
        delivery("SENT"),
        delivery("DELIVERED"),
        delivery("FAILED"),
        delivery("DEAD_LETTER"),
        delivery("CANCELLED"),
      ]),
    ).toEqual({ queued: 2, successful: 2, failed: 2, cancelled: 1 });
  });
});

import type { NotificationDelivery } from "./contracts";

export function summarizeDeliveries(deliveries: NotificationDelivery[]) {
  return {
    queued: deliveries.filter((item) =>
      ["PENDING", "PROCESSING", "RETRY_WAIT"].includes(item.status),
    ).length,
    successful: deliveries.filter((item) =>
      ["SENT", "DELIVERED"].includes(item.status),
    ).length,
    failed: deliveries.filter((item) =>
      ["FAILED", "DEAD_LETTER"].includes(item.status),
    ).length,
    cancelled: deliveries.filter((item) => item.status === "CANCELLED").length,
  };
}

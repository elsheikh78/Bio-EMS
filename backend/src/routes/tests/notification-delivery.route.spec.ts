import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorMiddleware } from "../../middleware/error.middleware";

const listDetailedBySite = vi.hoisted(() => vi.fn());

vi.mock("../../modules/notification/notification-delivery.repository", () => ({
  NotificationDeliveryRepository: class {
    listDetailedBySite = listDetailedBySite;
  },
}));

import router from "../notification-delivery.route";

function app(role: "ADMIN" | "OPERATOR" | "VIEWER") {
  const value = express();
  value.use((req, _res, next) => {
    req.user = { id: 1, username: role.toLowerCase(), role };
    next();
  });
  value.use("/api/v1/notification-deliveries", router);
  value.use(errorMiddleware);
  return value;
}

describe("Notification Delivery REST API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listDetailedBySite.mockReturnValue([{ id: 1, status: "RETRY_WAIT", attempts: [] }]);
  });

  it.each(["ADMIN", "OPERATOR", "VIEWER"] as const)(
    "allows %s to view Site-scoped delivery evidence",
    async (role) => {
      const response = await request(app(role))
        .get("/api/v1/notification-deliveries?site_id=7&limit=25&status=RETRY_WAIT")
        .expect(200);

      expect(listDetailedBySite).toHaveBeenCalledWith(7, 25, "RETRY_WAIT");
      expect(response.body.deliveries).toHaveLength(1);
    }
  );

  it.each([
    "/api/v1/notification-deliveries",
    "/api/v1/notification-deliveries?site_id=0",
    "/api/v1/notification-deliveries?site_id=1&limit=501",
    "/api/v1/notification-deliveries?site_id=1&status=UNKNOWN",
    "/api/v1/notification-deliveries?site_id=1&unknown=value",
  ])("rejects invalid query %s", async (path) => {
    await request(app("ADMIN")).get(path).expect(400);
    expect(listDetailedBySite).not.toHaveBeenCalled();
  });
});

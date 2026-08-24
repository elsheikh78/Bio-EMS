import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorMiddleware } from "../../middleware/error.middleware";

const mocks = vi.hoisted(() => ({
  listForCustomerSite: vi.fn(),
  listForPlatform: vi.fn(),
}));

vi.mock("../../repositories/audit-event.repository", () => ({
  AuditEventRepository: class {},
}));

vi.mock("../../services/audit-event.service", () => ({
  AuditEventService: class {
    listForCustomerSite = mocks.listForCustomerSite;
    listForPlatform = mocks.listForPlatform;
  },
}));

vi.mock("../../middleware/platform-authentication.middleware", async () => {
  const { AppError } = await import("../../errors/app-error");

  return {
    platformAuthenticationMiddleware: (
      req: express.Request,
      _res: express.Response,
      next: express.NextFunction
    ) => {
      if (req.headers.authorization !== "Bearer platform-token") {
        next(
          new AppError("Platform authentication required", 401, "PLATFORM_AUTHENTICATION_REQUIRED")
        );
        return;
      }
      req.platformPrincipal = {
        kind: "platform",
        type: "SYSTEM_OWNER",
        id: "owner-1",
        username: "owner",
      };
      next();
    },
  };
});

import auditEventRouter from "../audit-event.route";
import platformAuditEventRouter from "../platform-audit-event.route";

function customerApp(role: "ADMIN" | "OPERATOR" | "VIEWER") {
  const app = express();
  app.use((req, _res, next) => {
    req.user = { id: 1, username: role.toLowerCase(), role };
    next();
  });
  app.use("/api/v1/audit-events", auditEventRouter);
  app.use(errorMiddleware);
  return app;
}

function platformApp() {
  const app = express();
  app.use("/api/v1/platform-audit-events", platformAuditEventRouter);
  app.use(errorMiddleware);
  return app;
}

const event = {
  id: "audit-1",
  occurredAt: "2026-08-24T12:00:00.000Z",
  actor: { kind: "CUSTOMER_USER", id: "1", username: "admin", role: "ADMIN" },
  action: "USER.CREATED",
  siteId: 7,
  result: "SUCCESS",
  requestContext: { source: "REST_API" },
  createdAt: "2026-08-24 12:00:00",
};

describe("Customer Audit Event REST API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listForCustomerSite.mockReturnValue([event]);
  });

  it("allows ADMIN to read only an explicit Site scope", async () => {
    const response = await request(customerApp("ADMIN"))
      .get("/api/v1/audit-events?site_id=7&limit=25")
      .expect(200);

    expect(mocks.listForCustomerSite).toHaveBeenCalledWith(7, 25);
    expect(response.body).toEqual({ events: [event] });
  });

  it.each(["OPERATOR", "VIEWER"] as const)("denies %s before reading", async (role) => {
    const response = await request(customerApp(role))
      .get("/api/v1/audit-events?site_id=7")
      .expect(403);

    expect(response.body.error.code).toBe("FORBIDDEN");
    expect(mocks.listForCustomerSite).not.toHaveBeenCalled();
  });

  it.each([
    "/api/v1/audit-events",
    "/api/v1/audit-events?site_id=0",
    "/api/v1/audit-events?site_id=1&limit=501",
    "/api/v1/audit-events?site_id=1&unknown=value",
  ])("rejects invalid or absent customer scope %s", async (path) => {
    const response = await request(customerApp("ADMIN")).get(path).expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(mocks.listForCustomerSite).not.toHaveBeenCalled();
  });
});

describe("Platform Audit Event REST API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listForPlatform.mockReturnValue([event]);
  });

  it("allows SYSTEM_OWNER to read across Sites or constrain the Site scope", async () => {
    await request(platformApp())
      .get("/api/v1/platform-audit-events?limit=50")
      .set("Authorization", "Bearer platform-token")
      .expect(200);
    await request(platformApp())
      .get("/api/v1/platform-audit-events?site_id=7")
      .set("Authorization", "Bearer platform-token")
      .expect(200);

    expect(mocks.listForPlatform).toHaveBeenNthCalledWith(1, undefined, 50);
    expect(mocks.listForPlatform).toHaveBeenNthCalledWith(2, 7, 100);
  });

  it("rejects missing or customer-domain tokens before reading", async () => {
    await request(platformApp()).get("/api/v1/platform-audit-events").expect(401);
    await request(platformApp())
      .get("/api/v1/platform-audit-events")
      .set("Authorization", "Bearer customer-token")
      .expect(401);

    expect(mocks.listForPlatform).not.toHaveBeenCalled();
  });
});

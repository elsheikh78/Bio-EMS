import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { errorMiddleware } from "../error.middleware";
import { requirePermission } from "../authorization.middleware";

describe("authorization middleware", () => {
  it("invokes downstream exactly once when the current role has permission", async () => {
    const downstream = vi.fn((_req, res) => res.json({ success: true }));
    const app = createApp("OPERATOR", "DEVICE_MANAGE", downstream);

    await request(app).get("/").expect(200, { success: true });

    expect(downstream).toHaveBeenCalledOnce();
  });

  it("returns the existing 401 contract without invoking downstream when principal is absent", async () => {
    const downstream = vi.fn((_req, res) => res.json({ success: true }));
    const app = createApp(undefined, "DEVICE_READ", downstream);

    const response = await request(app).get("/").expect(401);

    expect(response.body).toEqual({
      success: false,
      error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication required" },
    });
    expect(downstream).not.toHaveBeenCalled();
  });

  it("returns the approved generic 403 without invoking downstream", async () => {
    const downstream = vi.fn((_req, res) => res.json({ success: true }));
    const app = createApp("VIEWER", "CONFIGURATION_WRITE", downstream);

    const response = await request(app).get("/").expect(403);

    expect(response.body).toEqual({
      success: false,
      error: { code: "FORBIDDEN", message: "Forbidden" },
    });
    expect(JSON.stringify(response.body)).not.toMatch(/viewer|configuration_write/i);
    expect(downstream).not.toHaveBeenCalled();
  });

  it("denies an unknown runtime role without exposing it", async () => {
    const downstream = vi.fn((_req, res) => res.json({ success: true }));
    const app = createApp("OWNER", "CONFIGURATION_READ", downstream);

    const response = await request(app).get("/").expect(403);

    expect(response.body).toEqual({
      success: false,
      error: { code: "FORBIDDEN", message: "Forbidden" },
    });
    expect(JSON.stringify(response.body)).not.toMatch(/owner|configuration_read/i);
    expect(downstream).not.toHaveBeenCalled();
  });
});

function createApp(
  role: string | undefined,
  permission: Parameters<typeof requirePermission>[0],
  downstream: express.RequestHandler
): express.Express {
  const app = express();

  if (role !== undefined) {
    app.use((req, _res, next) => {
      Object.assign(req, { user: { id: 7, username: "current-user", role } });
      next();
    });
  }

  app.get("/", requirePermission(permission), downstream);
  app.use(errorMiddleware);
  return app;
}

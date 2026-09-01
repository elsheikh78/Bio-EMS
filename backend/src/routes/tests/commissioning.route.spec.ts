import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorMiddleware } from "../../middleware/error.middleware";

const controller = vi.hoisted(() => vi.fn((_req, res) => res.status(204).end()));

vi.mock("../../controllers/commissioning.controller", () => ({
  addCommissioningCheckController: controller,
  appendCommissioningDecisionController: controller,
  appendCommissioningDeviationController: controller,
  appendCommissioningEvidenceController: controller,
  createCommissioningSessionController: controller,
  getCommissioningDeviationsController: controller,
  getCommissioningConfigurationReadinessController: controller,
}));

import router from "../commissioning.route";

function app(role: "ADMIN" | "OPERATOR" | "VIEWER") {
  const value = express();
  value.use(express.json());
  value.use((req, _res, next) => {
    req.user = { id: 1, username: role.toLowerCase(), role };
    next();
  });
  value.use("/api/v1", router);
  value.use(errorMiddleware);
  return value;
}

describe("Commissioning REST API authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["ADMIN", "OPERATOR"] as const)("allows %s to manage commissioning", async (role) => {
    await request(app(role))
      .post("/api/v1/sites/1/commissioning-sessions")
      .send({
        uuid: "commissioning-1",
        platformVersion: "0.17.0",
        commissioningRevision: "P3-03",
        openedAt: "2026-09-01T11:00:00.000Z",
      })
      .expect(204);

    expect(controller).toHaveBeenCalledOnce();
  });

  it("allows VIEWER to read commissioning deviations", async () => {
    await request(app("VIEWER"))
      .get("/api/v1/sites/1/commissioning-sessions/2/deviations")
      .expect(204);

    expect(controller).toHaveBeenCalledOnce();
  });

  it("allows VIEWER to read validated configuration readiness", async () => {
    await request(app("VIEWER"))
      .get("/api/v1/sites/1/commissioning-readiness?asOf=2026-09-01T11:00:00.000Z")
      .expect(204);
    expect(controller).toHaveBeenCalledOnce();
  });

  it("rejects invalid configuration readiness timestamps", async () => {
    await request(app("VIEWER"))
      .get("/api/v1/sites/1/commissioning-readiness?asOf=invalid")
      .expect(400);
    expect(controller).not.toHaveBeenCalled();
  });

  it("denies VIEWER before commissioning mutation validation", async () => {
    const response = await request(app("VIEWER"))
      .post("/api/v1/sites/1/commissioning-sessions/2/decisions")
      .send({})
      .expect(403);

    expect(response.body).toEqual({
      success: false,
      error: { code: "FORBIDDEN", message: "Forbidden" },
    });
    expect(controller).not.toHaveBeenCalled();
  });

  it("rejects client-controlled actor identity on evidence", async () => {
    await request(app("ADMIN"))
      .post("/api/v1/sites/1/commissioning-sessions/2/evidence")
      .send({
        checkId: 3,
        state: "PASS",
        evidenceKind: "PHYSICAL",
        executedAt: "2026-09-01T11:00:00.000Z",
        actorIdentity: "spoofed-user",
      })
      .expect(400);

    expect(controller).not.toHaveBeenCalled();
  });

  it("rejects client-controlled decision snapshots", async () => {
    await request(app("ADMIN"))
      .post("/api/v1/sites/1/commissioning-sessions/2/decisions")
      .send({
        decision: "ACCEPTED",
        decidedAt: "2026-09-01T11:00:00.000Z",
        snapshot: { acceptable: true },
      })
      .expect(400);

    expect(controller).not.toHaveBeenCalled();
  });
});

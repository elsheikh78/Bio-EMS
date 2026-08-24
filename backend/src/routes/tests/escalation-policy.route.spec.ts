import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorMiddleware } from "../../middleware/error.middleware";

const { service, auditRecord } = vi.hoisted(() => ({
  service: { list: vi.fn(), create: vi.fn(), update: vi.fn(), updateStatus: vi.fn() },
  auditRecord: vi.fn(),
}));
vi.mock("../../services/escalation-policy.service", () => ({ escalationPolicyService: service }));
vi.mock("../../services/audit-event.service", () => ({
  auditEventService: { record: auditRecord },
}));
import router from "../escalation-policy.route";

const uuid = "0d432ea8-e6a6-4f73-a952-d10800710471";
const body = {
  uuid,
  site_id: 7,
  name: "Critical",
  owner_role: "QUALITY",
  eligible_severities: ["CRITICAL"],
  steps: [
    { position: 1, delay_seconds: 0, recipient_role: "PRIMARY_CONTACT", channels: ["EMAIL"] },
  ],
};
function app(role = "ADMIN") {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: 1, username: "user", role: role as "ADMIN" };
    next();
  });
  app.use("/api/v1/escalation-policies", router);
  app.use(errorMiddleware);
  return app;
}

describe("Escalation policy REST API", () => {
  beforeEach(() => vi.clearAllMocks());
  it("creates a strictly validated policy", async () => {
    service.create.mockReturnValue(body);
    await request(app()).post("/api/v1/escalation-policies").send(body).expect(201);
    expect(service.create).toHaveBeenCalled();
  });
  it("rejects gaps and non-increasing delays", async () => {
    await request(app())
      .post("/api/v1/escalation-policies")
      .send({ ...body, steps: [{ ...body.steps[0], position: 2 }] })
      .expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });
  it("requires an explicit Site list scope", async () => {
    await request(app()).get("/api/v1/escalation-policies").expect(400);
    service.list.mockReturnValue([]);
    await request(app()).get("/api/v1/escalation-policies?site_id=7").expect(200);
  });
  it("denies non-ADMIN mutation before body validation", async () => {
    await request(app("VIEWER")).post("/api/v1/escalation-policies").send({}).expect(403);
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({ action: "ESCALATION_POLICY.CREATED", result: "DENIED" })
    );
    expect(service.create).not.toHaveBeenCalled();
  });
  it("supports profile and status lifecycle routes", async () => {
    service.update.mockReturnValue({});
    service.updateStatus.mockReturnValue({});
    await request(app())
      .patch(`/api/v1/escalation-policies/${uuid}`)
      .send({ name: "Updated" })
      .expect(200);
    await request(app())
      .patch(`/api/v1/escalation-policies/${uuid}/status`)
      .send({ status: "inactive" })
      .expect(200);
  });
});

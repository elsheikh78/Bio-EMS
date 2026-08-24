import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorMiddleware } from "../../middleware/error.middleware";
import { notificationRecipientService } from "../../services/notification-recipient.service";
import router from "../notification-recipient.route";

vi.mock("../../services/notification-recipient.service", () => ({
  notificationRecipientService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
  },
}));
vi.mock("../../services/audit-event.service", () => ({ auditEventService: { record: vi.fn() } }));

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.user = { id: 1, username: "admin", role: "ADMIN" };
  next();
});
app.use("/api/v1/notification-recipients", router);
app.use(errorMiddleware);

const uuid = "b3d90e36-faf5-4a46-96dc-376dbc1475cb";
const body = {
  uuid,
  site_id: 7,
  display_name: "Quality contact",
  role: "QUALITY",
  endpoints: [
    { channel: "EMAIL", address: "quality@example.com", eligible_severities: ["CRITICAL"] },
    { channel: "SMS", address: "+201001234567", eligible_severities: ["WARNING", "CRITICAL"] },
  ],
} as const;

describe("Notification recipient REST contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a strict Site-scoped recipient through the authenticated actor", async () => {
    vi.mocked(notificationRecipientService.create).mockReturnValue({
      ...body,
      id: 3,
      status: "active",
      created_at: "now",
      updated_at: null,
      endpoints: body.endpoints.map((endpoint, index) => ({ ...endpoint, id: index + 1 })),
    } as never);
    const response = await request(app)
      .post("/api/v1/notification-recipients")
      .send(body)
      .expect(201);

    expect(notificationRecipientService.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1", role: "ADMIN" }),
      body,
      { source: "NOTIFICATION_RECIPIENT_API" }
    );
    expect(response.body.uuid).toBe(uuid);
  });

  it.each([
    ["duplicate channels", { ...body, endpoints: [body.endpoints[0], body.endpoints[0]] }],
    ["invalid email", { ...body, endpoints: [{ ...body.endpoints[0], address: "not-email" }] }],
    ["non-E.164 SMS", { ...body, endpoints: [{ ...body.endpoints[1], address: "01001234567" }] }],
    [
      "duplicate severities",
      {
        ...body,
        endpoints: [{ ...body.endpoints[0], eligible_severities: ["CRITICAL", "CRITICAL"] }],
      },
    ],
    ["unknown channel", { ...body, endpoints: [{ ...body.endpoints[0], channel: "PAGER" }] }],
  ])("rejects %s", async (_case, invalid) => {
    await request(app).post("/api/v1/notification-recipients").send(invalid).expect(400);
    expect(notificationRecipientService.create).not.toHaveBeenCalled();
  });

  it("requires explicit positive Site scope for list", async () => {
    await request(app).get("/api/v1/notification-recipients").expect(400);
    await request(app).get("/api/v1/notification-recipients?site_id=0").expect(400);
    expect(notificationRecipientService.list).not.toHaveBeenCalled();
  });

  it("updates profile/endpoints and lifecycle through separate strict contracts", async () => {
    vi.mocked(notificationRecipientService.update).mockReturnValue({} as never);
    vi.mocked(notificationRecipientService.updateStatus).mockReturnValue({} as never);
    await request(app)
      .patch(`/api/v1/notification-recipients/${uuid}`)
      .send({ role: "MANAGEMENT" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/notification-recipients/${uuid}/status`)
      .send({ status: "inactive" })
      .expect(200);
    expect(notificationRecipientService.update).toHaveBeenCalled();
    expect(notificationRecipientService.updateStatus).toHaveBeenCalled();
  });
});

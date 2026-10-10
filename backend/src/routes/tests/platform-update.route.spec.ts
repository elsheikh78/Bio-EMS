import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import router from "../platform-update.route";
import { AppError } from "../../errors/app-error";
import { errorMiddleware } from "../../middleware/error.middleware";
import * as updates from "../../modules/platform-update/platform-update.service";
vi.mock("../../modules/platform-update/platform-update.service", () => ({
  updateStatus: vi.fn(),
  downloadCloudUpdate: vi.fn(),
  stageUpdate: vi.fn(),
  applyUpdate: vi.fn(),
  cancelUpdate: vi.fn(),
}));
let role: "ADMIN" | "OPERATOR" | "VIEWER" = "ADMIN";
const app = express();
app.use((req, _res, next) => {
  req.user = { id: 1, username: "admin", role };
  next();
});
app.use("/updates", router);
app.use(errorMiddleware);
describe("Client update authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    role = "ADMIN";
  });
  it.each(["OPERATOR", "VIEWER"] as const)("refuses %s at every update endpoint", async (value) => {
    role = value;
    expect((await request(app).get("/updates")).status).toBe(403);
    expect(
      (
        await request(app)
          .post("/updates/upload")
          .set("Content-Type", "application/octet-stream")
          .send(Buffer.from("test"))
      ).status
    ).toBe(403);
    expect((await request(app).post("/updates/123/apply")).status).toBe(403);
    expect(updates.stageUpdate).not.toHaveBeenCalled();
  });
  it("keeps cloud disabled on the server as well as the page", async () => {
    vi.mocked(updates.downloadCloudUpdate).mockRejectedValue(
      new AppError("Cloud updates disabled", 503, "UPDATE_CLOUD_DISABLED")
    );
    expect((await request(app).post("/updates/internet")).status).toBe(503);
    expect(updates.stageUpdate).not.toHaveBeenCalled();
  });
  it("does not accept JSON as an executable update", async () => {
    expect((await request(app).post("/updates/upload").send({ file: "bad" })).status).toBe(415);
    expect(updates.stageUpdate).not.toHaveBeenCalled();
  });
});

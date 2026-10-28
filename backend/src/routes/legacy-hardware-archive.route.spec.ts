import express, { Request, Response } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../controllers/hardware-lab.controller", () => ({
  listHardwareTestRuns: (_req: Request, res: Response) => res.json({ runs: [{ id: "archived" }] }),
  getHardwareTestRun: (_req: Request, res: Response) => res.json({ id: "archived", steps: [] }),
}));
import { legacyHardwareArchiveRouter } from "./legacy-hardware-archive.route";

const app = express();
app.use("/hardware-lab", legacyHardwareArchiveRouter);

describe("Retired platform hardware lab", () => {
  it("keeps historical runs readable", async () => {
    expect((await request(app).get("/hardware-lab/runs")).body.runs).toHaveLength(1);
    expect(
      (await request(app).get("/hardware-lab/runs/00000000-0000-4000-8000-000000000001")).status
    ).toBe(200);
  });
  it("rejects every former write operation without entering a controller", async () => {
    for (const path of [
      "/runs",
      "/runs/any/steps/POWER/start",
      "/runs/any/steps/POWER/result",
      "/runs/any/firmware",
      "/runs/any/events",
      "/runs/any/finalize",
    ]) {
      const response = await request(app)
        .post("/hardware-lab" + path)
        .send({ status: "PASS" });
      expect(response.status).toBe(410);
      expect(response.body.code).toBe("HARDWARE_LAB_MOVED_TO_STANDALONE_TESTER");
    }
  });
  it("does not serve the obsolete procedure as a current test profile", async () => {
    expect((await request(app).get("/hardware-lab/profile")).status).toBe(410);
  });
});

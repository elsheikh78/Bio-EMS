import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { errorMiddleware } from "../../middleware/error.middleware";
import reportRouter from "../report.route";

function createApp(role: "ADMIN" | "OPERATOR" | "VIEWER") {
  const app = express();
  app.use((req, _res, next) => {
    req.user = { id: 1, username: role.toLowerCase(), role };
    next();
  });
  app.use("/api/v1/reports", reportRouter);
  app.use(errorMiddleware);
  return app;
}

describe("Reporting catalogue REST API", () => {
  it.each(["ADMIN", "OPERATOR", "VIEWER"] as const)(
    "allows %s to read the approved catalogue",
    async (role) => {
      const response = await request(createApp(role)).get("/api/v1/reports/catalogue").expect(200);

      expect(response.body.contractVersion).toBe("1.0");
      expect(response.body.reportTypes).toHaveLength(5);
      expect(response.body.reportTypes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "CALIBRATION-HISTORY",
            readiness: "AVAILABLE",
            previewAvailable: true,
            exportFormats: ["CSV"],
          }),
          expect.objectContaining({ id: "DEVICE-HEALTH", readiness: "BLOCKED" }),
          expect.objectContaining({ id: "AUDIT-OPERATIONS", readiness: "BLOCKED" }),
        ])
      );
      expect(
        response.body.reportTypes.filter(
          (item: { previewAvailable: boolean }) => item.previewAvailable
        )
      ).toHaveLength(1);
    }
  );

  it.each(["ADMIN", "OPERATOR"] as const)(
    "allows %s through the export permission gate before request validation",
    async (role) => {
      const response = await request(createApp(role)).post("/api/v1/reports/exports").expect(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    }
  );

  it("denies CSV export to VIEWER", async () => {
    const response = await request(createApp("VIEWER")).post("/api/v1/reports/exports").expect(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });
});

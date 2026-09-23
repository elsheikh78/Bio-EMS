import express from "express";
import siteRouter from "./routes/site.route";
import deviceRouter from "./routes/device.route";
import roomRouter from "./routes/room.route";
import { config } from "./config/config";
import healthRouter from "./routes/health.route";
import { getMqttClient } from "./mqtt/client";
import "../database/sqlite/client";
import { createTables } from "../database/sqlite/schema";
import { runMigrations } from "../database/sqlite/migration-runner";
import { errorMiddleware } from "./middleware/error.middleware";
import sensorRouter from "./routes/sensor.route";
import alarmRouter from "./routes/alarm.route";
import dashboardRouter from "./routes/dashboard.route";
import authRouter from "./routes/auth.route";
import platformAuthRouter from "./routes/platform-auth.route";
import platformAuditEventRouter from "./routes/platform-audit-event.route";
import { authenticationMiddleware } from "./middleware/authentication.middleware";
import userRouter from "./routes/user.route";
import { createBrowserSecurityMiddleware } from "./middleware/browser-security.middleware";
import reportRouter from "./routes/report.route";
import auditEventRouter from "./routes/audit-event.route";
import notificationRecipientRouter from "./routes/notification-recipient.route";
import escalationPolicyRouter from "./routes/escalation-policy.route";
import realtimeRouter from "./routes/realtime.route";
import notificationDeliveryRouter from "./routes/notification-delivery.route";
import commissioningRouter from "./routes/commissioning.route";
import platformOperationsRouter from "./routes/platform-operations.route";
import installationAcceptanceRouter from "./routes/installation-acceptance.route";
import communicationChannelRouter from "./routes/communication-channel.route";
import platformBackupRouter from "./routes/platform-backup.route";
import devicePairingRouter from "./routes/device-pairing.route";
import { resolve } from "node:path";
import { reconcilePlatformRestoreAudits } from "./modules/platform-backup/platform-backup.service";
import { startPlatformBackupScheduleRuntime } from "./modules/platform-backup/platform-backup-schedule.runtime";

createTables();

runMigrations();
startPlatformBackupScheduleRuntime();

void reconcilePlatformRestoreAudits().catch((error) => {
  console.error("Platform restore audit reconciliation failed", error);
});

const app = express();

app.use(createBrowserSecurityMiddleware(config.cors));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

getMqttClient();

app.use(`${config.apiPrefix}/platform-auth`, platformAuthRouter);
app.use(`${config.apiPrefix}/platform-audit-events`, platformAuditEventRouter);
app.use(`${config.apiPrefix}/platform-operations`, platformOperationsRouter);
app.use(`${config.apiPrefix}/device-pairing`, devicePairingRouter);
app.use(`${config.apiPrefix}/health`, healthRouter);
app.use(config.apiPrefix, authenticationMiddleware);
app.use(`${config.apiPrefix}/auth`, authRouter);
app.use(`${config.apiPrefix}/sites`, siteRouter);
app.use(`${config.apiPrefix}/devices`, deviceRouter);
app.use(`${config.apiPrefix}/rooms`, roomRouter);
app.use(`${config.apiPrefix}/sensors`, sensorRouter);
app.use(`${config.apiPrefix}/alarms`, alarmRouter);
app.use(`${config.apiPrefix}/dashboard`, dashboardRouter);
app.use(`${config.apiPrefix}/users`, userRouter);
app.use(`${config.apiPrefix}/reports`, reportRouter);
app.use(`${config.apiPrefix}/audit-events`, auditEventRouter);
app.use(`${config.apiPrefix}/notification-recipients`, notificationRecipientRouter);
app.use(`${config.apiPrefix}/escalation-policies`, escalationPolicyRouter);
app.use(`${config.apiPrefix}/realtime`, realtimeRouter);
app.use(`${config.apiPrefix}/notification-deliveries`, notificationDeliveryRouter);
app.use(`${config.apiPrefix}/communication-channels`, communicationChannelRouter);
app.use(`${config.apiPrefix}/platform-backups`, platformBackupRouter);
app.use(`${config.apiPrefix}/installations`, installationAcceptanceRouter);
app.use(config.apiPrefix, commissioningRouter);

if (config.frontendRoot) {
  const frontendRoot = resolve(config.frontendRoot);

  // Setup and desktop shortcuts enter through this uncached bootstrap endpoint.
  // Clear only this HTTPS origin's browser cache so an index.html cached by an
  // older BIO-EMS release cannot resurrect the legacy login UI after upgrade
  // or clean installation. The browser then lands on the canonical /login URL.
  app.get("/__bioems/start", (_request, response) => {
    response.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.set("Pragma", "no-cache");
    response.set("Expires", "0");
    response.set("Clear-Site-Data", '"cache"');
    return response.redirect(302, "/login");
  });
  app.use(
    express.static(frontendRoot, {
      index: false,
      fallthrough: true,
      setHeaders(response, filePath) {
        if (filePath.endsWith(".html")) {
          response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
          response.setHeader("Pragma", "no-cache");
          response.setHeader("Expires", "0");
          return;
        }
        response.setHeader("Cache-Control", "no-cache");
      },
    })
  );
  app.use((request, response, next) => {
    if (request.method !== "GET" || request.path.startsWith(config.apiPrefix)) return next();
    response.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.set("Pragma", "no-cache");
    response.set("Expires", "0");
    return response.sendFile("index.html", { root: frontendRoot });
  });
}

app.use(errorMiddleware);

export default app;

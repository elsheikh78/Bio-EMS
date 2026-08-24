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

createTables();

runMigrations();

const app = express();

app.use(createBrowserSecurityMiddleware(config.cors));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

getMqttClient();

app.use(`${config.apiPrefix}/platform-auth`, platformAuthRouter);
app.use(`${config.apiPrefix}/platform-audit-events`, platformAuditEventRouter);
app.use(config.apiPrefix, authenticationMiddleware);
app.use(`${config.apiPrefix}/health`, healthRouter);
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

app.use(errorMiddleware);

export default app;

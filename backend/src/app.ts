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

createTables();

runMigrations();

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

getMqttClient();

app.use(`${config.apiPrefix}/health`, healthRouter);
app.use(`${config.apiPrefix}/sites`, siteRouter);
app.use(`${config.apiPrefix}/devices`, deviceRouter);
app.use(`${config.apiPrefix}/rooms`, roomRouter);
app.use(`${config.apiPrefix}/sensors`, sensorRouter);
app.use(`${config.apiPrefix}/alarms`, alarmRouter);
app.use(`${config.apiPrefix}/dashboard`, dashboardRouter);

app.use(errorMiddleware);

export default app;

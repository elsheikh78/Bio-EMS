import express from "express";
import siteRouter from "./routes/site.route";
import { config } from "./config/config";
import healthRouter from "./routes/health.route";
import { getMqttClient } from "./mqtt/client";
import "../database/sqlite/client";
import { createTables } from "../database/sqlite/schema";
import { runMigrations } from "../database/sqlite/migrations";

runMigrations();

createTables();

const app = express();

app.use(express.json());

getMqttClient();

app.use(config.apiPrefix, healthRouter);
app.use(`${config.apiPrefix}/sites`, siteRouter);

export default app;
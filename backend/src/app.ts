import express from "express";
import { config } from "./config/config";
import healthRouter from "./routes/health.route";

const app = express();

app.use(express.json());

app.use(config.apiPrefix, healthRouter);

export default app;
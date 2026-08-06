import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "UP",
    project: "BIO EMS",
    version: "0.11.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;

import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "UP",
    project: "BIO EMS",
    version: "0.1.0-alpha",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

export default router;
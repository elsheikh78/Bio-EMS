import { Router } from "express";
import { requirePermission } from "../middleware/authorization.middleware";
import { PERMISSION } from "../authorization/permissions";
import {
  applyUpdate,
  cancelUpdate,
  downloadCloudUpdate,
  stageUpdate,
  updateStatus,
} from "../modules/platform-update/platform-update.service";
import { customerAuditActor } from "../modules/audit/customer-audit-context";
const router = Router();
router.use(requirePermission(PERMISSION.USER_MANAGE));
router.get("/", async (_req, res) => {
  res.json(await updateStatus());
});
router.post("/upload", async (req, res) => {
  if (req.headers["content-type"] !== "application/octet-stream") {
    res.status(415).json({ message: "Select a BIO-EMS update EXE" });
    return;
  }
  res.status(201).json(await stageUpdate(req, customerAuditActor(req).username));
});
router.post("/:jobId/apply", async (req, res) => {
  res.status(202).json(await applyUpdate(String(req.params.jobId)));
});
router.delete("/:jobId", async (req, res) => {
  await cancelUpdate(String(req.params.jobId));
  res.sendStatus(204);
});
router.post("/internet", async (req, res) => {
  res.status(201).json(await downloadCloudUpdate(customerAuditActor(req).username));
});
export default router;

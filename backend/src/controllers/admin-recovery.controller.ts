import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";
import { sqlite } from "../../database/sqlite/client";
import { asyncHandler } from "../middleware/async-handler";
import { AppError } from "../errors/app-error";
import { installationContextService } from "../modules/installation/installation-context.service";
import { AdminRecoveryService } from "../modules/admin-recovery/admin-recovery.service";
import { PasswordPolicyError } from "../services/password.service";

const service = new AdminRecoveryService(
  sqlite,
  () => installationContextService.current(),
  () => {
    const receiptPath = process.env.BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH;
    if (!receiptPath) throw new Error("Recovery trust path unavailable");
    return JSON.parse(
      readFileSync(join(dirname(receiptPath), "manufacturer-admin-recovery-trust.json"), "utf8")
    ) as unknown;
  }
);
export const adminRecoveryRequestInput = z
  .object({ username: z.string().trim().min(1).max(64) })
  .strict();
export const adminRecoveryCompleteInput = z
  .object({
    recoveryToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    newPassword: z.string().min(12).max(72),
  })
  .strict();

export const createAdminRecoveryRequest = asyncHandler(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(201).json(service.request(req.body.username));
});
export const authorizeAdminRecovery = asyncHandler(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(service.authorize(req.body));
});
export const completeAdminRecovery = asyncHandler(async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    res.json(await service.complete(req.body.recoveryToken, req.body.newPassword));
  } catch (error) {
    if (error instanceof PasswordPolicyError)
      throw new AppError(error.message, 400, "VALIDATION_ERROR");
    throw new AppError(
      "Recovery authorization is invalid, expired or already used",
      400,
      "ADMIN_RECOVERY_REJECTED"
    );
  }
});

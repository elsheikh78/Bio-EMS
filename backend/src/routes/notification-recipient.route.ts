import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import * as controller from "../controllers/notification-recipient.controller";
import { requireAuditedPermission } from "../middleware/audited-authorization.middleware";
import { requirePermission } from "../middleware/authorization.middleware";
import { validateBody, validateParams, validateQuery } from "../middleware/validate-request";
import {
  createNotificationRecipientSchema,
  notificationRecipientListQuerySchema,
  notificationRecipientParamsSchema,
  updateNotificationRecipientSchema,
  updateNotificationRecipientStatusSchema,
} from "../modules/notification/dto/notification-recipient.schema";
import {
  NOTIFICATION_RECIPIENT_AUDIT_ACTION,
  NOTIFICATION_RECIPIENT_AUDIT_SOURCE,
} from "../modules/notification/notification-recipient-audit";

const router = Router();
const manage = (action: string) =>
  requireAuditedPermission({
    permission: PERMISSION.NOTIFICATION_RECIPIENT_MANAGE,
    deniedAudit: {
      action,
      source: NOTIFICATION_RECIPIENT_AUDIT_SOURCE,
      target: (req) => {
        const parsed = notificationRecipientParamsSchema.safeParse(req.params);
        return parsed.success
          ? { type: "NOTIFICATION_RECIPIENT", id: parsed.data.recipientUuid }
          : undefined;
      },
    },
  });

router.get(
  "/",
  requirePermission(PERMISSION.NOTIFICATION_RECIPIENT_READ),
  validateQuery(notificationRecipientListQuerySchema),
  controller.listNotificationRecipients
);
router.post(
  "/",
  manage(NOTIFICATION_RECIPIENT_AUDIT_ACTION.CREATED),
  validateBody(createNotificationRecipientSchema),
  controller.createNotificationRecipient
);
router.patch(
  "/:recipientUuid",
  manage(NOTIFICATION_RECIPIENT_AUDIT_ACTION.UPDATED),
  validateParams(notificationRecipientParamsSchema),
  validateBody(updateNotificationRecipientSchema),
  controller.updateNotificationRecipient
);
router.patch(
  "/:recipientUuid/status",
  manage(NOTIFICATION_RECIPIENT_AUDIT_ACTION.STATUS_UPDATED),
  validateParams(notificationRecipientParamsSchema),
  validateBody(updateNotificationRecipientStatusSchema),
  controller.updateNotificationRecipientStatus
);

export default router;

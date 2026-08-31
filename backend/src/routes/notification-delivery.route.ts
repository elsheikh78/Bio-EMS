import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import { listNotificationDeliveries } from "../controllers/notification-delivery.controller";
import { requirePermission } from "../middleware/authorization.middleware";
import { validateQuery } from "../middleware/validate-request";
import { notificationDeliveryListQuerySchema } from "../modules/notification/dto/notification-delivery.schema";

const router = Router();

router.get(
  "/",
  requirePermission(PERMISSION.ALARM_READ),
  validateQuery(notificationDeliveryListQuerySchema),
  listNotificationDeliveries
);

export default router;

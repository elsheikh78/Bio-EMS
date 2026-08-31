import { Request, Response } from "express";
import { notificationDeliveryListQuerySchema } from "../modules/notification/dto/notification-delivery.schema";
import { NotificationDeliveryRepository } from "../modules/notification/notification-delivery.repository";

const repository = new NotificationDeliveryRepository();

export function listNotificationDeliveries(req: Request, res: Response): void {
  const query = notificationDeliveryListQuerySchema.parse(req.query);
  res.status(200).json({
    deliveries: repository.listDetailedBySite(query.site_id, query.limit, query.status),
  });
}

import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import {
  customerAuditActor,
  customerRequestContext,
} from "../modules/audit/customer-audit-context";
import { notificationRecipientService } from "../services/notification-recipient.service";

export const listNotificationRecipients = asyncHandler(async (req: Request, res: Response) => {
  res.json(notificationRecipientService.list(Number(req.query.site_id)));
});

export const createNotificationRecipient = asyncHandler(async (req: Request, res: Response) => {
  res
    .status(201)
    .json(
      notificationRecipientService.create(
        customerAuditActor(req),
        req.body,
        customerRequestContext("NOTIFICATION_RECIPIENT_API")
      )
    );
});

export const updateNotificationRecipient = asyncHandler(async (req: Request, res: Response) => {
  res.json(
    notificationRecipientService.update(
      customerAuditActor(req),
      req.params.recipientUuid as string,
      req.body,
      customerRequestContext("NOTIFICATION_RECIPIENT_API")
    )
  );
});

export const updateNotificationRecipientStatus = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      notificationRecipientService.updateStatus(
        customerAuditActor(req),
        req.params.recipientUuid as string,
        req.body,
        customerRequestContext("NOTIFICATION_RECIPIENT_API")
      )
    );
  }
);

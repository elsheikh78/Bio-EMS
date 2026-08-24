import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { userService } from "../services/user.service";
import {
  customerAuditActor,
  customerRequestContext,
} from "../modules/audit/customer-audit-context";

const userId = (req: Request) => Number(req.params.user_id);

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  res.json(userService.listUsers());
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  res
    .status(201)
    .json(
      await userService.createUser(
        customerAuditActor(req),
        req.body,
        customerRequestContext("USER_MANAGEMENT_API")
      )
    );
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  res.json(
    userService.updateUser(
      customerAuditActor(req),
      userId(req),
      req.body,
      customerRequestContext("USER_MANAGEMENT_API")
    )
  );
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  res.json(
    userService.updateStatus(
      customerAuditActor(req),
      userId(req),
      req.body,
      customerRequestContext("USER_MANAGEMENT_API")
    )
  );
});

export const updateUserPassword = asyncHandler(async (req: Request, res: Response) => {
  res.json(
    await userService.updatePassword(
      customerAuditActor(req),
      userId(req),
      req.body,
      customerRequestContext("USER_MANAGEMENT_API")
    )
  );
});

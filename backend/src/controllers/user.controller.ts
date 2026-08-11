import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { userService } from "../services/user.service";

const userId = (req: Request) => Number(req.params.user_id);
const actorId = (req: Request) => req.user!.id;

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  res.json(userService.listUsers());
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(await userService.createUser(req.body));
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  res.json(userService.updateUser(actorId(req), userId(req), req.body));
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  res.json(userService.updateStatus(actorId(req), userId(req), req.body));
});

export const updateUserPassword = asyncHandler(async (req: Request, res: Response) => {
  res.json(await userService.updatePassword(userId(req), req.body));
});

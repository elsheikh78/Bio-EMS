import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import * as roomService from "../services/room.service";

export const createRoom = asyncHandler(async (req: Request, res: Response) => {
  const id = roomService.createRoom(req.body);

  res.status(201).json({
    id,
  });
});

export const getRooms = asyncHandler(async (_req: Request, res: Response) => {
  const rooms = roomService.getRooms();

  res.json(rooms);
});

import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../errors/app-error";

export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(new AppError("Invalid request body", 400, "VALIDATION_ERROR"));
      return;
    }

    req.body = result.data;
    next();
  };
}

import { Request, Response } from "express";
import { config } from "../config/config";
import { asyncHandler } from "../middleware/async-handler";
import { UserRepository } from "../repositories/user.repository";
import { AuthService } from "../services/auth.service";
import { passwordRecoveryService } from "../services/password-recovery.service";
import { TokenService } from "../services/token.service";

const authService = new AuthService(new UserRepository(), new TokenService(config.jwt));

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await authService.login(req.body));
});

export const forgotPasswordController = asyncHandler(async (req: Request, res: Response) => {
  res.status(202).json(passwordRecoveryService.requestCustomerRecovery(req.body.username));
});

export const changePasswordController = asyncHandler(async (req: Request, res: Response) => {
  await passwordRecoveryService.changeOwnPassword(
    req.user!.id,
    req.body.current_password,
    req.body.new_password
  );
  res.status(200).json({ success: true, password_change_required: false });
});

export const currentUserController = (req: Request, res: Response): void => {
  res.status(200).json({ user: req.user! });
};

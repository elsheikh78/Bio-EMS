import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import {
  createUser,
  listUsers,
  updateUser,
  updateUserPassword,
  updateUserStatus,
} from "../controllers/user.controller";
import { requirePermission } from "../middleware/authorization.middleware";
import { validateBody, validateParams } from "../middleware/validate-request";
import {
  createUserSchema,
  updateUserPasswordSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userParamsSchema,
} from "../modules/user/dto/user.schema";

const router = Router();
const adminOnly = requirePermission(PERMISSION.USER_MANAGE);

router.get("/", adminOnly, listUsers);
router.post("/", adminOnly, validateBody(createUserSchema), createUser);
router.patch(
  "/:user_id",
  adminOnly,
  validateParams(userParamsSchema),
  validateBody(updateUserSchema),
  updateUser
);
router.patch(
  "/:user_id/status",
  adminOnly,
  validateParams(userParamsSchema),
  validateBody(updateUserStatusSchema),
  updateUserStatus
);
router.put(
  "/:user_id/password",
  adminOnly,
  validateParams(userParamsSchema),
  validateBody(updateUserPasswordSchema),
  updateUserPassword
);

export default router;

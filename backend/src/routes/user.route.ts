import { Router } from "express";
import {
  createUser,
  listUsers,
  updateUser,
  updateUserPassword,
  updateUserStatus,
} from "../controllers/user.controller";
import { requireUserManagementPermission } from "../middleware/user-management-authorization.middleware";
import { validateBody, validateParams } from "../middleware/validate-request";
import {
  createUserSchema,
  updateUserPasswordSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userParamsSchema,
} from "../modules/user/dto/user.schema";
import { USER_AUDIT_ACTION } from "../modules/user/user-audit";

const router = Router();

router.get("/", requireUserManagementPermission(), listUsers);
router.post(
  "/",
  requireUserManagementPermission(USER_AUDIT_ACTION.CREATED),
  validateBody(createUserSchema),
  createUser
);
router.patch(
  "/:user_id",
  requireUserManagementPermission(USER_AUDIT_ACTION.PROFILE_UPDATED),
  validateParams(userParamsSchema),
  validateBody(updateUserSchema),
  updateUser
);
router.patch(
  "/:user_id/status",
  requireUserManagementPermission(USER_AUDIT_ACTION.STATUS_UPDATED),
  validateParams(userParamsSchema),
  validateBody(updateUserStatusSchema),
  updateUserStatus
);
router.put(
  "/:user_id/password",
  requireUserManagementPermission(USER_AUDIT_ACTION.PASSWORD_UPDATED),
  validateParams(userParamsSchema),
  validateBody(updateUserPasswordSchema),
  updateUserPassword
);

export default router;

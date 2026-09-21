import { Router } from "express";
import {
  createPlatformCustomer,
  createPlatformLicense,
  createPlatformMaintenance,
  platformOperationsOverview,
  updatePlatformLicense,
  updatePlatformMaintenance,
  listPlatformCustomerAdmins,
  createPlatformCustomerAdmin,
  updatePlatformCustomerAdminStatus,
  updatePlatformCustomerAdminPassword,
  createLicenseActivationRequest,
  approveLicenseActivationRequest,
  bindLicensedDevice,
  recordLicenseValidation,
  transitionSiteBoundLicense,
  transferSiteBoundLicense,
} from "../controllers/platform-operations.controller";
import { platformAuthenticationMiddleware } from "../middleware/platform-authentication.middleware";
import {
  createOwnerPlatformBackup,
  getOwnerPlatformBackupSchedule,
  getOwnerPlatformRestoreJob,
  listOwnerPlatformBackups,
  restoreOwnerPlatformBackup,
  restoreOwnerPlatformBackupForDisasterRecovery,
  updateOwnerPlatformBackupSchedule,
} from "../controllers/platform-backup.controller";
import { validateBody, validateParams, validateQuery } from "../middleware/validate-request";
import {
  createPlatformCustomerSchema,
  createPlatformLicenseSchema,
  createPlatformMaintenanceSchema,
  platformRecordParamsSchema,
  updatePlatformLicenseSchema,
  updatePlatformMaintenanceSchema,
  platformCustomerParamsSchema,
  platformCustomerAdminParamsSchema,
  createPlatformCustomerAdminSchema,
  updatePlatformCustomerAdminStatusSchema,
  updatePlatformCustomerAdminPasswordSchema,
} from "../modules/platform-operations/platform-operations.schema";
import {
  createInstallation,
  getPlatformInstallation,
  listInstallations,
  queueInstallation,
  receiveInstallation,
  reviseInstallation,
  sendInstallation,
  technicalInstallationDecision,
  validateInstallation,
} from "../controllers/installation.controller";
import {
  createInstallationSchema,
  installationDecisionSchema,
  installationListQuerySchema,
  installationParamsSchema,
  installationReceiptSchema,
  reviseInstallationSchema,
} from "../modules/installation/installation.schema";
import {
  activationDecisionSchema,
  activationParamsSchema,
  activationRequestSchema,
  bindLicenseDeviceSchema,
  licenseDatabaseParamsSchema,
  licenseTransitionSchema,
  licenseTransferSchema,
  licenseValidationSchema,
} from "../modules/licensing/licensing.schema";
import {
  listOwnerCommunicationChannels,
  saveOwnerCommunicationChannel,
  testOwnerCommunicationChannel,
} from "../controllers/communication-channel.controller";
import {
  communicationChannelListQuerySchema,
  platformCommunicationChannelParamsSchema,
  saveCommunicationChannelSchema,
  testCommunicationChannelSchema,
} from "../modules/communication-channels/communication-channel.schema";
import { platformBackupScheduleInputSchema } from "../modules/platform-backup/platform-backup-schedule.schema";

const router = Router();
router.use(platformAuthenticationMiddleware);
router.get("/", platformOperationsOverview);
router.get("/backups/schedule", getOwnerPlatformBackupSchedule);
router.put(
  "/backups/schedule",
  validateBody(platformBackupScheduleInputSchema),
  updateOwnerPlatformBackupSchedule
);
router.get("/backups", listOwnerPlatformBackups);
router.post("/backups", createOwnerPlatformBackup);
router.post("/backups/:backupId/restore", restoreOwnerPlatformBackup);
router.post("/backups/:backupId/dr-restore", restoreOwnerPlatformBackupForDisasterRecovery);
router.get("/restore-jobs/:jobId", getOwnerPlatformRestoreJob);
router.post("/customers", validateBody(createPlatformCustomerSchema), createPlatformCustomer);
router.get("/installations", validateQuery(installationListQuerySchema), listInstallations);
router.get(
  "/installations/:installationId",
  validateParams(installationParamsSchema),
  getPlatformInstallation
);
router.post(
  "/customers/:customerId/installations",
  validateParams(platformCustomerParamsSchema),
  validateBody(createInstallationSchema),
  createInstallation
);
router.get(
  "/customers/:customerId/communication-channels",
  validateParams(platformCustomerParamsSchema),
  validateQuery(communicationChannelListQuerySchema),
  listOwnerCommunicationChannels
);
router.put(
  "/customers/:customerId/communication-channels/:channel",
  validateParams(platformCommunicationChannelParamsSchema),
  validateBody(saveCommunicationChannelSchema),
  saveOwnerCommunicationChannel
);
router.post(
  "/customers/:customerId/communication-channels/:channel/test",
  validateParams(platformCommunicationChannelParamsSchema),
  validateBody(testCommunicationChannelSchema),
  testOwnerCommunicationChannel
);
router.post(
  "/licensing/licenses/:licenseId/devices",
  validateParams(licenseDatabaseParamsSchema),
  validateBody(bindLicenseDeviceSchema),
  bindLicensedDevice
);
router.post(
  "/licensing/licenses/:licenseId/validations",
  validateParams(licenseDatabaseParamsSchema),
  validateBody(licenseValidationSchema),
  recordLicenseValidation
);
router.patch(
  "/licensing/licenses/:licenseId/status",
  validateParams(licenseDatabaseParamsSchema),
  validateBody(licenseTransitionSchema),
  transitionSiteBoundLicense
);
router.post(
  "/licensing/licenses/:licenseId/transfer",
  validateParams(licenseDatabaseParamsSchema),
  validateBody(licenseTransferSchema),
  transferSiteBoundLicense
);
router.put(
  "/installations/:installationId/draft",
  validateParams(installationParamsSchema),
  validateBody(reviseInstallationSchema),
  reviseInstallation
);
router.post(
  "/installations/:installationId/validate",
  validateParams(installationParamsSchema),
  validateInstallation
);
router.post(
  "/installations/:installationId/queue",
  validateParams(installationParamsSchema),
  queueInstallation
);
router.post(
  "/installations/:installationId/send",
  validateParams(installationParamsSchema),
  sendInstallation
);
router.post(
  "/installations/:installationId/device-receipt",
  validateParams(installationParamsSchema),
  validateBody(installationReceiptSchema),
  receiveInstallation
);
router.post(
  "/installations/:installationId/technical-decision",
  validateParams(installationParamsSchema),
  validateBody(installationDecisionSchema),
  technicalInstallationDecision
);
router.get(
  "/customers/:customerId/admins",
  validateParams(platformCustomerParamsSchema),
  listPlatformCustomerAdmins
);
router.post(
  "/customers/:customerId/admins",
  validateParams(platformCustomerParamsSchema),
  validateBody(createPlatformCustomerAdminSchema),
  createPlatformCustomerAdmin
);
router.patch(
  "/customers/:customerId/admins/:userId/status",
  validateParams(platformCustomerAdminParamsSchema),
  validateBody(updatePlatformCustomerAdminStatusSchema),
  updatePlatformCustomerAdminStatus
);
router.patch(
  "/customers/:customerId/admins/:userId/password",
  validateParams(platformCustomerAdminParamsSchema),
  validateBody(updatePlatformCustomerAdminPasswordSchema),
  updatePlatformCustomerAdminPassword
);
router.post(
  "/licensing/activation-requests",
  validateBody(activationRequestSchema),
  createLicenseActivationRequest
);
router.post(
  "/licensing/activation-requests/:requestId/approve",
  validateParams(activationParamsSchema),
  validateBody(activationDecisionSchema),
  approveLicenseActivationRequest
);
router.post("/licenses", validateBody(createPlatformLicenseSchema), createPlatformLicense);
router.patch(
  "/licenses/:id",
  validateParams(platformRecordParamsSchema),
  validateBody(updatePlatformLicenseSchema),
  updatePlatformLicense
);
router.post(
  "/service-events",
  validateBody(createPlatformMaintenanceSchema),
  createPlatformMaintenance
);
router.patch(
  "/service-events/:id",
  validateParams(platformRecordParamsSchema),
  validateBody(updatePlatformMaintenanceSchema),
  updatePlatformMaintenance
);
export default router;

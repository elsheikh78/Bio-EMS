import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { PlatformOperationsRepository } from "../modules/platform-operations/platform-operations.repository";
import { customerAdminService } from "../modules/platform-operations/customer-admin.service";
import { ActivationService } from "../modules/licensing/activation.service";
import { LicensingRepository } from "../modules/licensing/licensing.repository";

const repository = new PlatformOperationsRepository();
const actor = (req: Request) => `${req.platformPrincipal!.username}#${req.platformPrincipal!.id}`;
const activationService = () => {
  const keyId = process.env.BIOEMS_LICENSE_SIGNING_KEY_ID;
  const privateKeyPem = process.env.BIOEMS_LICENSE_SIGNING_PRIVATE_KEY_PEM;
  if (!keyId || !privateKeyPem) {
    throw new Error("Central license signing configuration is unavailable");
  }
  return new ActivationService(new LicensingRepository(), { keyId, privateKeyPem });
};

export const platformOperationsOverview = asyncHandler(async (_req: Request, res: Response) =>
  res.json(repository.overview())
);
export const createPlatformCustomer = asyncHandler(async (req: Request, res: Response) =>
  res.status(201).json({ success: true, id: repository.createCustomer(req.body, actor(req)) })
);
export const createPlatformLicense = asyncHandler(async (req: Request, res: Response) =>
  res.status(201).json({ success: true, id: repository.createLicense(req.body, actor(req)) })
);
export const createPlatformMaintenance = asyncHandler(async (req: Request, res: Response) =>
  res.status(201).json({ success: true, id: repository.createMaintenance(req.body, actor(req)) })
);
export const updatePlatformLicense = asyncHandler(async (req: Request, res: Response) => {
  repository.updateLicense(Number(req.params.id), req.body, actor(req));
  res.json({ success: true });
});
export const updatePlatformMaintenance = asyncHandler(async (req: Request, res: Response) => {
  repository.updateMaintenance(Number(req.params.id), req.body, actor(req));
  res.json({ success: true });
});

export const listPlatformCustomerAdmins = asyncHandler(async (req: Request, res: Response) =>
  res.json(customerAdminService.list(Number(req.params.customerId)))
);
export const createPlatformCustomerAdmin = asyncHandler(async (req: Request, res: Response) =>
  res
    .status(201)
    .json(await customerAdminService.create(Number(req.params.customerId), req.body, actor(req)))
);
export const updatePlatformCustomerAdminStatus = asyncHandler(async (req: Request, res: Response) =>
  res.json(
    customerAdminService.updateStatus(
      Number(req.params.customerId),
      Number(req.params.userId),
      req.body.status,
      actor(req)
    )
  )
);
export const updatePlatformCustomerAdminPassword = asyncHandler(
  async (req: Request, res: Response) =>
    res.json(
      await customerAdminService.updatePassword(
        Number(req.params.customerId),
        Number(req.params.userId),
        req.body.password,
        actor(req)
      )
    )
);

export const createLicenseActivationRequest = asyncHandler(async (req: Request, res: Response) =>
  res.status(201).json(activationService().request(req.body))
);

export const approveLicenseActivationRequest = asyncHandler(async (req: Request, res: Response) =>
  res.json({
    success: true,
    certificate: activationService().approve(String(req.params.requestId), req.body, actor(req)),
  })
);

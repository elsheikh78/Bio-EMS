import { createHash } from "node:crypto";
import { AppError } from "../../errors/app-error";
import { signLicenseCertificate, type SignedLicenseCertificate } from "./license-certificate";
import { LicensingRepository } from "./licensing.repository";
import type { ActivationDecision, ActivationRequest } from "./licensing.schema";

export class ActivationService {
  constructor(
    private readonly repository: LicensingRepository,
    private readonly signing: { keyId: string; privateKeyPem: string }
  ) {}

  request(input: ActivationRequest): { id: number; status: "PENDING" } {
    return { id: this.repository.recordActivationRequest(input), status: "PENDING" };
  }

  approve(
    requestId: string,
    input: ActivationDecision,
    actor: string,
    now = new Date()
  ): SignedLicenseCertificate {
    const request = this.repository.getPendingRequest(requestId);
    if (!request)
      throw new AppError(
        "Pending activation request not found",
        404,
        "ACTIVATION_REQUEST_NOT_FOUND"
      );
    const issuedAt = now.toISOString();
    const certificate = signLicenseCertificate(
      {
        schemaVersion: 1,
        licenseId: input.licenseId,
        customerId: request.customerId,
        siteId: request.siteId,
        installationId: request.installationId,
        hardwareFingerprint: JSON.parse(request.hardwareFingerprintJson),
        status: "ACTIVE",
        licenseType: input.licenseType,
        issuedAt,
        startsAt: input.startsAt,
        expiresAt: input.expiresAt,
        maintenanceUntil: input.maintenanceUntil,
        updateEntitlement: input.updateEntitlement,
        modules: input.modules,
        maximumGateways: input.maximumGateways,
        maximumDevices: input.maximumDevices,
        maximumSensors: input.maximumSensors,
        offlineGraceSeconds: input.offlineGraceSeconds,
      },
      this.signing.keyId,
      this.signing.privateKeyPem
    );
    const json = JSON.stringify(certificate);
    this.repository.approve(
      request,
      {
        uuid: input.licenseId,
        type: input.licenseType,
        startsAt: input.startsAt,
        expiresAt: input.expiresAt,
        maintenanceUntil: input.maintenanceUntil,
        updateEntitlement: input.updateEntitlement,
        offlinePolicyJson: JSON.stringify({ graceSeconds: input.offlineGraceSeconds }),
        modules: input.modules,
        maximumGateways: input.maximumGateways,
        maximumDevices: input.maximumDevices,
        maximumSensors: input.maximumSensors,
      },
      {
        keyId: this.signing.keyId,
        json,
        sha256: createHash("sha256").update(json).digest("hex"),
        issuedAt,
      },
      actor
    );
    return certificate;
  }
}

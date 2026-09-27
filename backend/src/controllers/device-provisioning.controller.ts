import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { sqlite } from "../../database/sqlite/client";
import { AppError } from "../errors/app-error";
import type { InstallationSnapshot } from "../modules/installation/installation.schema";
import { installationService } from "../modules/installation/installation.service";
import { devicePairingService } from "../modules/device-pairing/device-pairing.service";
import { deviceProvisioningLocalClient } from "../modules/device-provisioning/device-provisioning.client";

type ActiveBinding = {
  platformBindingId: string;
  deviceId: string;
  hardwareUid: string;
  siteCode: string;
  firmwareVersion: string;
  protocolVersion: string;
  status: string;
  pairedAt: string;
};

const platformActor = (request: Request) =>
  `${request.platformPrincipal!.username}#${request.platformPrincipal!.id}`;

function recordEvent(
  installationId: number,
  revisionId: number,
  eventType: string,
  actor: string,
  evidence: object
) {
  sqlite
    .prepare(
      `INSERT INTO platform_installation_events(
         installation_id,revision_id,event_type,actor_identity,occurred_at,evidence_json
       ) VALUES(?,?,?,?,?,?)`
    )
    .run(
      installationId,
      revisionId,
      eventType,
      actor,
      new Date().toISOString(),
      JSON.stringify(evidence)
    );
}

function requireProvisioningTarget(installationUuid: string, deviceId: string) {
  const installation = sqlite
    .prepare("SELECT id,status FROM platform_installations WHERE uuid=?")
    .get(installationUuid) as { id: number; status: string } | undefined;
  if (!installation) throw new AppError("Installation not found", 404, "INSTALLATION_NOT_FOUND");
  if (installation.status !== "PENDING_DELIVERY") {
    throw new AppError(
      "Installation must be pending delivery before hardware provisioning",
      409,
      "INSTALLATION_PENDING_DELIVERY_REQUIRED"
    );
  }

  const revision = sqlite
    .prepare(
      `SELECT id,revision,checksum,snapshot_json AS snapshotJson
       FROM platform_installation_revisions
       WHERE installation_id=?
       ORDER BY revision DESC LIMIT 1`
    )
    .get(installation.id) as
    { id: number; revision: number; checksum: string; snapshotJson: string } | undefined;
  if (!revision)
    throw new AppError("Installation revision not found", 409, "INSTALLATION_REVISION_REQUIRED");

  const snapshot = JSON.parse(revision.snapshotJson) as InstallationSnapshot;
  const device = snapshot.devices.find((item) => item.deviceId === deviceId);
  if (!device) {
    throw new AppError("Device not found in installation", 404, "PROVISIONING_DEVICE_NOT_FOUND");
  }
  return { installation, revision, snapshot, device };
}

function activeBindings(installationId: string): ActiveBinding[] {
  return (devicePairingService.listBindings(installationId) as ActiveBinding[]).filter(
    (binding) => binding.status === "ACTIVE"
  );
}

function allSnapshotDevicesBound(snapshot: InstallationSnapshot, bindings: ActiveBinding[]) {
  const active = new Set(bindings.map((binding) => binding.deviceId));
  return snapshot.devices.every((device) => active.has(device.deviceId));
}

function finishIfComplete(
  installationId: string,
  snapshot: InstallationSnapshot,
  bindings: ActiveBinding[],
  actor: string
) {
  if (!allSnapshotDevicesBound(snapshot, bindings)) {
    return { allDevicesBound: false, installationStatus: "PENDING_DELIVERY" as const };
  }
  const activated = installationService.activateProvisionedInstallation(installationId, actor);
  return {
    allDevicesBound: true,
    installationStatus: activated.status,
  };
}

export const getDeviceProvisioningHealth = asyncHandler(
  async (_request: Request, response: Response) =>
    response.json(await deviceProvisioningLocalClient.health())
);

export const listDeviceProvisioningPorts = asyncHandler(
  async (_request: Request, response: Response) =>
    response.json(await deviceProvisioningLocalClient.ports())
);

export const listDeviceProvisioningTargets = asyncHandler(
  async (_request: Request, response: Response) => {
    const targets = installationService
      .list()
      .filter((installation) => installation.status === "PENDING_DELIVERY")
      .map((installation) => {
        const snapshot = installation.latestSnapshot as InstallationSnapshot;
        const bindings = activeBindings(String(installation.uuid));
        const bindingByDevice = new Map(bindings.map((binding) => [binding.deviceId, binding]));
        return {
          installationId: String(installation.uuid),
          customerName: String(installation.customerName),
          revision: Number(installation.latestRevision),
          devices: snapshot.devices.map((device) => {
            const site = snapshot.sites.find((item) => item.code === device.siteCode);
            const binding = bindingByDevice.get(device.deviceId);
            return {
              deviceId: device.deviceId,
              siteCode: device.siteCode,
              siteName: site?.name ?? device.siteCode,
              model: device.model ?? null,
              firmwareVersion: device.firmwareVersion ?? null,
              bound: Boolean(binding),
              hardwareUid: binding?.hardwareUid ?? null,
              platformBindingId: binding?.platformBindingId ?? null,
            };
          }),
        };
      });
    response.json({ targets });
  }
);

export const detectDeviceProvisioningBoard = asyncHandler(
  async (request: Request, response: Response) =>
    response.json(await deviceProvisioningLocalClient.detect(String(request.body.port)))
);

export const flashInstallationDevice = asyncHandler(
  async (request: Request, response: Response) => {
    const installationId = String(request.body.installationId);
    const deviceId = String(request.body.deviceId);
    const target = requireProvisioningTarget(installationId, deviceId);
    const result = await deviceProvisioningLocalClient.flash(String(request.body.port));
    recordEvent(
      target.installation.id,
      target.revision.id,
      "DEVICE_FIRMWARE_FLASHED",
      platformActor(request),
      {
        revision: target.revision.revision,
        device_identity: deviceId,
        port: result.port,
        firmware_version: result.firmwareVersion,
        protocol_version: result.protocolVersion,
        binding_schema_version: result.bindingSchemaVersion,
      }
    );
    response.json(result);
  }
);

export const flashAndBindInstallationDevice = asyncHandler(
  async (request: Request, response: Response) => {
    const installationId = String(request.body.installationId);
    const deviceId = String(request.body.deviceId);
    const port = String(request.body.port);
    const target = requireProvisioningTarget(installationId, deviceId);
    const actor = platformActor(request);

    const existing = activeBindings(installationId).find(
      (binding) => binding.deviceId === deviceId
    );
    if (existing) {
      const bindings = activeBindings(installationId);
      const completion = finishIfComplete(installationId, target.snapshot, bindings, actor);
      response.json({
        port,
        installationId,
        deviceId,
        siteCode: existing.siteCode,
        hardwareUid: existing.hardwareUid,
        platformBindingId: existing.platformBindingId,
        firmwareVersion: existing.firmwareVersion,
        protocolVersion: existing.protocolVersion,
        bindingSchemaVersion: 1,
        recoveredExistingBinding: true,
        ...completion,
      });
      return;
    }

    const detected = await deviceProvisioningLocalClient.detect(port);
    if (!detected.supported || detected.chip !== "ESP32-S3") {
      throw new AppError(
        "Selected serial port is not a supported ESP32-S3",
        409,
        "ESP32S3_REQUIRED"
      );
    }

    const flashed = await deviceProvisioningLocalClient.flash(port);
    if (
      target.device.firmwareVersion &&
      flashed.firmwareVersion !== target.device.firmwareVersion
    ) {
      throw new AppError(
        "Controlled firmware does not match the installation device target",
        409,
        "DEVICE_FIRMWARE_VERSION_MISMATCH"
      );
    }

    recordEvent(target.installation.id, target.revision.id, "DEVICE_FIRMWARE_FLASHED", actor, {
      revision: target.revision.revision,
      device_identity: deviceId,
      port: flashed.port,
      firmware_version: flashed.firmwareVersion,
      protocol_version: flashed.protocolVersion,
      binding_schema_version: flashed.bindingSchemaVersion,
    });

    const bootstrap = devicePairingService.issuePairingCode(installationId, deviceId, actor);
    const provisioned = await deviceProvisioningLocalClient.provision(port, {
      wifiSsid: String(request.body.wifiSsid),
      wifiPassword: String(request.body.wifiPassword),
      platformUrl: String(request.body.platformUrl),
      pairingCode: bootstrap.pairing_code,
    });

    if (
      provisioned.installationId.toLowerCase() !== installationId.toLowerCase() ||
      provisioned.deviceId !== deviceId ||
      provisioned.siteCode !== target.device.siteCode
    ) {
      throw new AppError(
        "Controller reported a binding for a different logical target",
        409,
        "DEVICE_BINDING_TARGET_MISMATCH"
      );
    }

    const bindings = activeBindings(installationId);
    const verified = bindings.find(
      (binding) =>
        binding.deviceId === deviceId &&
        binding.platformBindingId.toLowerCase() === provisioned.platformBindingId.toLowerCase() &&
        binding.hardwareUid === provisioned.hardwareUid
    );
    if (!verified) {
      throw new AppError(
        "Platform binding could not be verified after device provisioning",
        409,
        "DEVICE_BINDING_VERIFICATION_FAILED"
      );
    }

    recordEvent(
      target.installation.id,
      target.revision.id,
      "DEVICE_PROVISIONING_COMPLETED",
      actor,
      {
        revision: target.revision.revision,
        device_identity: deviceId,
        port: provisioned.port,
        hardware_uid: provisioned.hardwareUid,
        platform_binding_id: provisioned.platformBindingId,
        site_code: provisioned.siteCode,
        firmware_version: flashed.firmwareVersion,
        protocol_version: flashed.protocolVersion,
        pairing_code_exposed_to_operator: false,
      }
    );

    const completion = finishIfComplete(installationId, target.snapshot, bindings, actor);
    response.json({
      port: provisioned.port,
      installationId,
      deviceId,
      siteCode: provisioned.siteCode,
      hardwareUid: provisioned.hardwareUid,
      platformBindingId: provisioned.platformBindingId,
      firmwareVersion: flashed.firmwareVersion,
      protocolVersion: flashed.protocolVersion,
      bindingSchemaVersion: flashed.bindingSchemaVersion,
      recoveredExistingBinding: false,
      ...completion,
    });
  }
);

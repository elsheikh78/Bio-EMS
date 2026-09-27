import type { Request, Response, NextFunction } from "express";
import { sqlite } from "../../database/sqlite/client";
import { AppError } from "../errors/app-error";
import type { InstallationSnapshot } from "../modules/installation/installation.schema";
import { deviceProvisioningLocalClient } from "../modules/device-provisioning/device-provisioning.client";

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
      `SELECT id,revision,snapshot_json AS snapshotJson
       FROM platform_installation_revisions
       WHERE installation_id=?
       ORDER BY revision DESC LIMIT 1`
    )
    .get(installation.id) as
    | { id: number; revision: number; snapshotJson: string }
    | undefined;
  if (!revision) throw new AppError("Installation revision not found", 409, "INSTALLATION_REVISION_REQUIRED");

  const snapshot = JSON.parse(revision.snapshotJson) as InstallationSnapshot;
  const device = snapshot.devices.find((item) => item.deviceId === deviceId);
  if (!device) {
    throw new AppError("Device not found in installation", 404, "PROVISIONING_DEVICE_NOT_FOUND");
  }
  return { installation, revision, device };
}

export async function getDeviceProvisioningHealth(
  _request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    response.json(await deviceProvisioningLocalClient.health());
  } catch (error) {
    next(error);
  }
}

export async function listDeviceProvisioningPorts(
  _request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    response.json(await deviceProvisioningLocalClient.ports());
  } catch (error) {
    next(error);
  }
}

export async function detectDeviceProvisioningBoard(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    response.json(await deviceProvisioningLocalClient.detect(String(request.body.port)));
  } catch (error) {
    next(error);
  }
}

export async function flashInstallationDevice(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const installationId = String(request.body.installationId);
    const deviceId = String(request.body.deviceId);
    const target = requireProvisioningTarget(installationId, deviceId);
    const result = await deviceProvisioningLocalClient.flash(String(request.body.port));
    recordEvent(
      target.installation.id,
      target.revision.id,
      "DEVICE_FIRMWARE_FLASHED",
      `system-owner#${request.platformPrincipal!.username}`,
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
  } catch (error) {
    next(error);
  }
}

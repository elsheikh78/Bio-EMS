import { createHash, randomInt, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { sqlite } from "../../../database/sqlite/client";
import { AppError } from "../../errors/app-error";
import type { DevicePairingClaimInput } from "./device-pairing.schema";
import type { InstallationSnapshot } from "../installation/installation.schema";

const PAIRING_TTL_MS = 10 * 60_000;
const BINDING_SCHEMA_VERSION = 1;

type InstallationRow = {
  id: number;
  uuid: string;
  status: string;
};

type RevisionRow = {
  id: number;
  revision: number;
  checksum: string;
  snapshot_json: string;
};

type PairingSessionRow = {
  id: string;
  installation_id: number;
  device_identity: string;
  status: "PENDING" | "CLAIMED" | "EXPIRED" | "REVOKED";
  expires_at: string;
};

function hashPairingCode(code: string): string {
  return createHash("sha256").update(`BIOEMS-PAIRING-V1:${code}`, "utf8").digest("hex");
}

function generatePairingCode(): string {
  return randomInt(0, 1_000_000_000_000).toString().padStart(12, "0");
}

function conflict(code: string, message = "Device pairing conflict") {
  return new AppError(message, 409, code);
}

export class DevicePairingService {
  constructor(
    private readonly database: Database.Database = sqlite,
    private readonly now: () => Date = () => new Date()
  ) {}

  issuePairingCode(installationUuid: string, deviceIdentity: string, actor: string) {
    const installation = this.findInstallation(installationUuid);
    if (
      ![
        "VALIDATED",
        "PENDING_DELIVERY",
        "SENT",
        "CONFIG_ACTIVE",
        "CUSTOMER_ACCEPTANCE_PENDING",
        "COMMISSIONED",
      ].includes(installation.status)
    ) {
      throw conflict("INSTALLATION_VALIDATION_REQUIRED");
    }

    const revision = this.latestRevision(installation.id);
    const snapshot = JSON.parse(revision.snapshot_json) as InstallationSnapshot;
    const device = snapshot.devices.find((item) => item.deviceId === deviceIdentity);
    if (!device)
      throw new AppError("Device not found in installation", 404, "PAIRING_DEVICE_NOT_FOUND");

    const existingBinding = this.database
      .prepare(
        `SELECT platform_binding_id AS platformBindingId,status
         FROM device_platform_bindings
         WHERE installation_id=? AND device_identity=? LIMIT 1`
      )
      .get(installation.id, deviceIdentity) as
      { platformBindingId: string; status: string } | undefined;

    if (existingBinding?.status === "ACTIVE") {
      throw conflict("DEVICE_ALREADY_PAIRED");
    }

    const code = generatePairingCode();
    const sessionId = randomUUID();
    const createdAt = this.now();
    const expiresAt = new Date(createdAt.getTime() + PAIRING_TTL_MS);

    this.database.transaction(() => {
      this.database
        .prepare(
          `UPDATE device_pairing_sessions
           SET status='REVOKED'
           WHERE installation_id=? AND device_identity=? AND status='PENDING'`
        )
        .run(installation.id, deviceIdentity);

      this.database
        .prepare(
          `INSERT INTO device_pairing_sessions(
             id,installation_id,device_identity,code_hash,status,expires_at,created_at,created_by
           ) VALUES(?,?,?,?,'PENDING',?,?,?)`
        )
        .run(
          sessionId,
          installation.id,
          deviceIdentity,
          hashPairingCode(code),
          expiresAt.toISOString(),
          createdAt.toISOString(),
          actor
        );

      this.recordEvent(installation.id, revision.id, "DEVICE_PAIRING_CODE_ISSUED", actor, {
        device_identity: deviceIdentity,
        pairing_session_id: sessionId,
        expires_at: expiresAt.toISOString(),
        binding_schema_version: BINDING_SCHEMA_VERSION,
      });
    })();

    return {
      pairing_code: code,
      expires_at: expiresAt.toISOString(),
      device_id: deviceIdentity,
      installation_id: installation.uuid,
      binding_schema_version: BINDING_SCHEMA_VERSION,
    };
  }

  claim(input: DevicePairingClaimInput) {
    const codeHash = hashPairingCode(input.pairing_code);
    const session = this.database
      .prepare(
        `SELECT id,installation_id,device_identity,status,expires_at
         FROM device_pairing_sessions WHERE code_hash=? LIMIT 1`
      )
      .get(codeHash) as PairingSessionRow | undefined;

    if (!session || session.status !== "PENDING") {
      throw new AppError("Pairing code is invalid", 401, "DEVICE_PAIRING_REJECTED");
    }

    const now = this.now();
    if (now.getTime() >= new Date(session.expires_at).getTime()) {
      this.database
        .prepare(
          "UPDATE device_pairing_sessions SET status='EXPIRED' WHERE id=? AND status='PENDING'"
        )
        .run(session.id);
      throw new AppError("Pairing code expired", 401, "DEVICE_PAIRING_EXPIRED");
    }

    const installation = this.database
      .prepare("SELECT id,uuid,status FROM platform_installations WHERE id=? LIMIT 1")
      .get(session.installation_id) as InstallationRow | undefined;
    if (!installation) throw new AppError("Installation not found", 404, "INSTALLATION_NOT_FOUND");

    const revision = this.latestRevision(installation.id);
    const snapshot = JSON.parse(revision.snapshot_json) as InstallationSnapshot;
    const device = snapshot.devices.find((item) => item.deviceId === session.device_identity);
    if (!device) throw conflict("PAIRING_DEVICE_REMOVED");
    const site = snapshot.sites.find((item) => item.code === device.siteCode);
    if (!site) throw conflict("PAIRING_SITE_REMOVED");

    const hardwareInUse = this.database
      .prepare(
        `SELECT platform_binding_id FROM device_platform_bindings
         WHERE hardware_uid=? AND status='ACTIVE' LIMIT 1`
      )
      .get(input.hardware_uid);
    if (hardwareInUse) throw conflict("HARDWARE_UID_ALREADY_BOUND");

    const activeForDevice = this.database
      .prepare(
        `SELECT platform_binding_id FROM device_platform_bindings
         WHERE installation_id=? AND device_identity=? AND status='ACTIVE' LIMIT 1`
      )
      .get(installation.id, session.device_identity);
    if (activeForDevice) throw conflict("DEVICE_ALREADY_PAIRED");

    const platformBindingId = randomUUID();

    this.database.transaction(() => {
      const claimed = this.database
        .prepare(
          `UPDATE device_pairing_sessions
           SET status='CLAIMED',claimed_at=?,hardware_uid=?,firmware_version=?,protocol_version=?
           WHERE id=? AND status='PENDING'`
        )
        .run(
          now.toISOString(),
          input.hardware_uid,
          input.firmware_version,
          input.protocol_version,
          session.id
        );
      if (claimed.changes !== 1) throw conflict("DEVICE_PAIRING_REPLAY");

      this.database
        .prepare(
          `INSERT INTO device_platform_bindings(
             platform_binding_id,binding_schema_version,installation_id,pairing_session_id,
             device_identity,hardware_uid,site_code,firmware_version,protocol_version,status,paired_at
           ) VALUES(?,?,?,?,?,?,?,?,?,'ACTIVE',?)`
        )
        .run(
          platformBindingId,
          BINDING_SCHEMA_VERSION,
          installation.id,
          session.id,
          session.device_identity,
          input.hardware_uid,
          site.code,
          input.firmware_version,
          input.protocol_version,
          now.toISOString()
        );

      this.recordEvent(installation.id, revision.id, "DEVICE_PLATFORM_PAIRED", input.hardware_uid, {
        device_identity: session.device_identity,
        platform_binding_id: platformBindingId,
        hardware_uid: input.hardware_uid,
        firmware_version: input.firmware_version,
        protocol_version: input.protocol_version,
        binding_schema_version: BINDING_SCHEMA_VERSION,
      });
    })();

    return {
      binding_schema_version: BINDING_SCHEMA_VERSION,
      platform_binding_id: platformBindingId,
      installation_id: installation.uuid,
      device_id: session.device_identity,
      site_code: site.code,
      firmware_version: input.firmware_version,
      protocol_version: input.protocol_version,
      paired_at: now.toISOString(),
      configuration: {
        revision: revision.revision,
        checksum: revision.checksum,
        device,
      },
      mqtt: {
        telemetry_topic: `bioems/${site.code}/telemetry/${session.device_identity}`,
        heartbeat_topic: `bioems/${site.code}/heartbeat/${session.device_identity}`,
      },
    };
  }

  listBindings(installationUuid: string) {
    const installation = this.findInstallation(installationUuid);
    return this.database
      .prepare(
        `SELECT
           platform_binding_id AS platformBindingId,
           binding_schema_version AS bindingSchemaVersion,
           device_identity AS deviceId,
           hardware_uid AS hardwareUid,
           site_code AS siteCode,
           firmware_version AS firmwareVersion,
           protocol_version AS protocolVersion,
           status,
           paired_at AS pairedAt,
           revoked_at AS revokedAt
         FROM device_platform_bindings
         WHERE installation_id=?
         ORDER BY paired_at DESC`
      )
      .all(installation.id);
  }

  private findInstallation(uuid: string): InstallationRow {
    const installation = this.database
      .prepare("SELECT id,uuid,status FROM platform_installations WHERE uuid=? LIMIT 1")
      .get(uuid) as InstallationRow | undefined;
    if (!installation) throw new AppError("Installation not found", 404, "INSTALLATION_NOT_FOUND");
    return installation;
  }

  private latestRevision(installationId: number): RevisionRow {
    return this.database
      .prepare(
        `SELECT id,revision,checksum,snapshot_json
         FROM platform_installation_revisions
         WHERE installation_id=? ORDER BY revision DESC LIMIT 1`
      )
      .get(installationId) as RevisionRow;
  }

  private recordEvent(
    installationId: number,
    revisionId: number,
    eventType: string,
    actor: string,
    evidence: object
  ): void {
    this.database
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
        this.now().toISOString(),
        JSON.stringify(evidence)
      );
  }
}

export const devicePairingService = new DevicePairingService();

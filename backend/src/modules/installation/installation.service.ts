import { createHash, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { sqlite } from "../../../database/sqlite/client";
import { AppError } from "../../errors/app-error";
import type { InstallationSnapshot } from "./installation.schema";

type InstallationStatus =
  | "DRAFT"
  | "VALIDATED"
  | "PENDING_DELIVERY"
  | "SENT"
  | "CONFIG_ACTIVE"
  | "CUSTOMER_ACCEPTANCE_PENDING"
  | "COMMISSIONED"
  | "CORRECTION_REQUIRED";
type RevisionRow = {
  id: number;
  revision: number;
  status: string;
  snapshot_json: string;
  checksum: string;
};
type InstallationRow = {
  id: number;
  uuid: string;
  customer_id: number;
  status: InstallationStatus;
  active_revision_id: number | null;
};

export class InstallationService {
  constructor(private readonly database: Database.Database = sqlite) {}

  list(customerId?: number) {
    const where = customerId ? "WHERE i.customer_id = ?" : "";
    const rows = this.database
      .prepare(
        `SELECT i.id,i.uuid,i.customer_id AS customerId,c.name AS customerName,i.status,
      i.active_revision_id AS activeRevisionId,i.created_at AS createdAt,i.updated_at AS updatedAt,
      (SELECT MAX(revision) FROM platform_installation_revisions r WHERE r.installation_id=i.id) AS latestRevision,
      (SELECT snapshot_json FROM platform_installation_revisions r WHERE r.installation_id=i.id ORDER BY revision DESC LIMIT 1) AS snapshotJson
      FROM platform_installations i JOIN platform_customers c ON c.id=i.customer_id ${where} ORDER BY i.id DESC`
      )
      .all(...(customerId ? [customerId] : [])) as Array<
      Record<string, unknown> & { snapshotJson: string }
    >;
    return rows.map(({ snapshotJson, ...row }) => {
      const latestSnapshot = JSON.parse(snapshotJson) as InstallationSnapshot;
      return { ...row, latestSnapshot, summary: summarize(latestSnapshot) };
    });
  }

  get(uuid: string) {
    const installation = this.find(uuid);
    const revisionRows = this.database
      .prepare(
        `SELECT revision,status,checksum,reason,created_at AS createdAt,created_by AS createdBy,snapshot_json AS snapshotJson
      FROM platform_installation_revisions WHERE installation_id=? ORDER BY revision DESC`
      )
      .all(installation.id);
    const revisions = (
      revisionRows as Array<Record<string, unknown> & { snapshotJson: string }>
    ).map(({ snapshotJson, ...row }) => ({
      ...row,
      snapshot: JSON.parse(snapshotJson),
      summary: summarize(JSON.parse(snapshotJson) as InstallationSnapshot),
    }));
    const latest = this.latest(installation.id);
    const receipts = this.database
      .prepare(
        `SELECT device_identity AS deviceIdentity,received_checksum AS receivedChecksum,matched,received_at AS receivedAt
      FROM platform_installation_receipts WHERE installation_id=? ORDER BY id`
      )
      .all(installation.id);
    const decisions = this.database
      .prepare(
        `SELECT stage,decision,actor_identity AS actorIdentity,note,decided_at AS decidedAt
      FROM platform_installation_decisions WHERE installation_id=? ORDER BY id`
      )
      .all(installation.id);
    return {
      uuid: installation.uuid,
      customerId: installation.customer_id,
      status: installation.status,
      activeRevisionId: installation.active_revision_id,
      latestRevision: latest.revision,
      snapshot: JSON.parse(latest.snapshot_json),
      revisions,
      receipts,
      decisions,
    };
  }

  getForCustomerUser(uuid: string, userId: number) {
    const installation = this.find(uuid);
    this.assertUserBinding(installation.customer_id, userId);
    return this.get(uuid);
  }

  create(customerId: number, snapshot: InstallationSnapshot, actor: string) {
    this.assertCustomer(customerId);
    this.validateSnapshot(snapshot);
    return this.database.transaction(() => {
      const now = new Date().toISOString();
      const uuid = randomUUID();
      const canonical = canonicalize(snapshot);
      const result = this.database
        .prepare(
          `INSERT INTO platform_installations(uuid,customer_id,status,created_at,created_by,updated_at)
        VALUES(?,?,'DRAFT',?,?,?)`
        )
        .run(uuid, customerId, now, actor, now);
      const id = Number(result.lastInsertRowid);
      const revisionId = this.insertRevision(id, 1, "DRAFT", canonical, null, actor);
      this.event(id, revisionId, "INSTALLATION_DRAFT_CREATED", actor, { revision: 1 });
      return { uuid, revision: 1, checksum: checksum(canonical) };
    })();
  }

  revise(uuid: string, snapshot: InstallationSnapshot, reason: string, actor: string) {
    this.validateSnapshot(snapshot);
    const installation = this.find(uuid);
    return this.database.transaction(() => {
      const latest = this.latest(installation.id);
      const revision = latest.revision + 1;
      const canonical = canonicalize(snapshot);
      const revisionId = this.insertRevision(
        installation.id,
        revision,
        "DRAFT",
        canonical,
        reason,
        actor
      );
      this.setStatus(installation.id, "DRAFT");
      this.event(installation.id, revisionId, "INSTALLATION_REVISION_CREATED", actor, {
        revision,
        reason,
      });
      return { uuid, revision, checksum: checksum(canonical) };
    })();
  }

  validate(uuid: string, actor: string) {
    return this.transition(uuid, "DRAFT", "VALIDATED", "INSTALLATION_VALIDATED", actor);
  }
  queue(uuid: string, actor: string) {
    return this.transition(uuid, "VALIDATED", "PENDING_DELIVERY", "INSTALLATION_QUEUED", actor);
  }
  send(uuid: string, actor: string) {
    return this.transition(uuid, "PENDING_DELIVERY", "SENT", "INSTALLATION_SENT", actor);
  }

  receipt(uuid: string, input: { revision: number; checksum: string; deviceIdentity: string }) {
    const installation = this.find(uuid);
    const latest = this.latest(installation.id);
    if (installation.status !== "SENT") throw conflict("INSTALLATION_NOT_SENT");
    const matched = latest.revision === input.revision && latest.checksum === input.checksum;
    const result = this.database.transaction(() => {
      const now = new Date().toISOString();
      this.database
        .prepare(
          `INSERT INTO platform_installation_receipts(installation_id,revision_id,device_identity,received_checksum,matched,received_at) VALUES(?,?,?,?,?,?)`
        )
        .run(
          installation.id,
          latest.id,
          input.deviceIdentity,
          input.checksum,
          matched ? 1 : 0,
          now
        );
      this.event(
        installation.id,
        latest.id,
        matched ? "DEVICE_RECEIPT_MATCHED" : "DEVICE_RECEIPT_REJECTED",
        input.deviceIdentity,
        { revision: input.revision }
      );
      if (matched) {
        this.materialize(installation);
        this.database
          .prepare("UPDATE platform_installation_revisions SET status='ACTIVE' WHERE id=?")
          .run(latest.id);
        this.database
          .prepare("UPDATE platform_installations SET active_revision_id=? WHERE id=?")
          .run(latest.id, installation.id);
        this.setStatus(installation.id, "CONFIG_ACTIVE");
      }
      return matched ? this.get(uuid) : null;
    })();
    if (!result) throw conflict("DEVICE_RECEIPT_MISMATCH");
    return result;
  }

  technicalDecision(
    uuid: string,
    decision: "ACCEPT" | "REJECT",
    note: string | null | undefined,
    actor: string
  ) {
    const installation = this.find(uuid);
    if (installation.status !== "CONFIG_ACTIVE") throw conflict("ACTIVE_CONFIGURATION_REQUIRED");
    return this.database.transaction(() =>
      this.decide(
        installation,
        "TECHNICAL",
        decision,
        note,
        actor,
        decision === "ACCEPT" ? "CUSTOMER_ACCEPTANCE_PENDING" : "CORRECTION_REQUIRED"
      )
    )();
  }

  customerDecision(
    uuid: string,
    userId: number,
    decision: "ACCEPT" | "REJECT",
    note?: string | null
  ) {
    const installation = this.find(uuid);
    const binding = this.database
      .prepare(
        `SELECT u.role FROM customer_user_bindings b JOIN users u ON u.id=b.user_id
      WHERE b.customer_id=? AND b.user_id=? AND u.status='active'`
      )
      .get(installation.customer_id, userId) as { role: string } | undefined;
    if (binding?.role !== "ADMIN") throw new AppError("Forbidden", 403, "FORBIDDEN");
    if (installation.status !== "CUSTOMER_ACCEPTANCE_PENDING")
      throw conflict("TECHNICAL_COMMISSIONING_REQUIRED");
    return this.database.transaction(() => {
      return this.decide(
        installation,
        "CUSTOMER_ACCEPTANCE",
        decision,
        note,
        `customer-user#${userId}`,
        decision === "ACCEPT" ? "COMMISSIONED" : "CORRECTION_REQUIRED"
      );
    })();
  }

  private transition(
    uuid: string,
    expected: InstallationStatus,
    next: InstallationStatus,
    event: string,
    actor: string
  ) {
    const installation = this.find(uuid);
    if (installation.status !== expected) throw conflict(`INSTALLATION_${expected}_REQUIRED`);
    const latest = this.latest(installation.id);
    return this.database.transaction(() => {
      const revisionStatus = next === "VALIDATED" ? "VALIDATED" : next === "SENT" ? "SENT" : null;
      if (revisionStatus)
        this.database
          .prepare("UPDATE platform_installation_revisions SET status=? WHERE id=?")
          .run(revisionStatus, latest.id);
      this.setStatus(installation.id, next);
      this.event(installation.id, latest.id, event, actor, {
        revision: latest.revision,
        checksum: latest.checksum,
      });
      return this.get(uuid);
    })();
  }

  private decide(
    installation: InstallationRow,
    stage: string,
    decision: string,
    note: string | null | undefined,
    actor: string,
    status: InstallationStatus
  ) {
    const latest = this.latest(installation.id);
    const now = new Date().toISOString();
    this.database
      .prepare(
        `INSERT INTO platform_installation_decisions(installation_id,revision_id,stage,decision,actor_identity,note,decided_at) VALUES(?,?,?,?,?,?,?)`
      )
      .run(installation.id, latest.id, stage, decision, actor, note ?? null, now);
    this.setStatus(installation.id, status);
    this.event(installation.id, latest.id, `${stage}_${decision}`, actor, { note: note ?? null });
    return this.get(installation.uuid);
  }

  private materialize(installation: InstallationRow) {
    const snapshot = JSON.parse(this.latest(installation.id).snapshot_json) as InstallationSnapshot;
    const siteIds = new Map<string, number>();
    const areaIds = new Map<string, number>();
    const deviceIds = new Map<string, number>();
    for (const site of snapshot.sites) {
      const owned = this.database
        .prepare(
          `SELECT s.id FROM sites s JOIN customer_site_bindings b ON b.site_id=s.id WHERE b.customer_id=? AND s.code=?`
        )
        .get(installation.customer_id, site.code) as { id: number } | undefined;
      const siteId =
        owned?.id ??
        Number(
          this.database
            .prepare(`INSERT INTO sites(code,name,location,timezone) VALUES(?,?,?,?)`)
            .run(site.code, site.name, site.location ?? null, site.timezone).lastInsertRowid
        );
      if (owned)
        this.database
          .prepare(`UPDATE sites SET name=?,location=?,timezone=? WHERE id=?`)
          .run(site.name, site.location ?? null, site.timezone, siteId);
      else
        this.database
          .prepare(
            `INSERT INTO customer_site_bindings(customer_id,site_id,bound_at,bound_by) VALUES(?,?,?,?)`
          )
          .run(
            installation.customer_id,
            siteId,
            new Date().toISOString(),
            "INSTALLATION_ACTIVATION"
          );
      siteIds.set(site.code, siteId);
      for (const area of site.areas) {
        const existing = this.database
          .prepare(`SELECT id FROM rooms WHERE site_id=? AND code=?`)
          .get(siteId, area.code) as { id: number } | undefined;
        const areaId =
          existing?.id ??
          Number(
            this.database
              .prepare(`INSERT INTO rooms(uuid,site_id,code,name,description) VALUES(?,?,?,?,?)`)
              .run(randomUUID(), siteId, area.code, area.name, area.description ?? null)
              .lastInsertRowid
          );
        if (existing)
          this.database
            .prepare(`UPDATE rooms SET name=?,description=?,active=1,updated_at=? WHERE id=?`)
            .run(area.name, area.description ?? null, new Date().toISOString(), areaId);
        areaIds.set(`${site.code}/${area.code}`, areaId);
      }
    }
    for (const device of snapshot.devices) {
      const siteId = siteIds.get(device.siteCode)!;
      const existing = this.database
        .prepare(`SELECT id,site_id AS siteId FROM devices WHERE device_id=?`)
        .get(device.deviceId) as { id: number; siteId: number } | undefined;
      if (existing && existing.siteId !== siteId) throw conflict("DEVICE_SITE_CONFLICT");
      const deviceId =
        existing?.id ??
        Number(
          this.database
            .prepare(
              `INSERT INTO devices(uuid,device_id,site_id,device_type,protocol,manufacturer,model,firmware_version,status,activated) VALUES(?,?,?,?,?,?,?,?, 'active',1)`
            )
            .run(
              randomUUID(),
              device.deviceId,
              siteId,
              device.type,
              device.protocol,
              device.manufacturer ?? null,
              device.model ?? null,
              device.firmwareVersion ?? null
            ).lastInsertRowid
        );
      if (existing)
        this.database
          .prepare(
            `UPDATE devices SET device_type=?,protocol=?,manufacturer=?,model=?,firmware_version=?,status='active',activated=1,updated_at=? WHERE id=?`
          )
          .run(
            device.type,
            device.protocol,
            device.manufacturer ?? null,
            device.model ?? null,
            device.firmwareVersion ?? null,
            new Date().toISOString(),
            deviceId
          );
      deviceIds.set(device.deviceId, deviceId);
    }
    for (const site of snapshot.sites)
      for (const area of site.areas)
        for (const telemetry of area.telemetries) {
          const mapping = snapshot.devices
            .flatMap((d) => d.mappings.map((m) => ({ d, m })))
            .find(
              (x) =>
                x.d.siteCode === site.code &&
                x.m.areaCode === area.code &&
                x.m.telemetryCode === telemetry.code
            );
          if (!mapping) throw conflict("TELEMETRY_MAPPING_REQUIRED");
          const roomId = areaIds.get(`${site.code}/${area.code}`)!;
          const deviceId = deviceIds.get(mapping.d.deviceId)!;
          const existing = this.database
            .prepare(`SELECT id FROM sensors WHERE room_id=? AND code=?`)
            .get(roomId, telemetry.code) as { id: number } | undefined;
          if (existing)
            this.database
              .prepare(
                `UPDATE sensors SET device_id=?,channel=?,name=?,sensor_type=?,unit=?,warning_low=?,alarm_low=?,warning_high=?,alarm_high=?,warning_delay_seconds=?,critical_delay_seconds=?,calibration_offset=?,enabled=1,updated_at=? WHERE id=?`
              )
              .run(
                deviceId,
                mapping.m.channel,
                telemetry.name,
                telemetry.type,
                telemetry.unit,
                telemetry.warningLow ?? null,
                telemetry.alarmLow ?? null,
                telemetry.warningHigh ?? null,
                telemetry.alarmHigh ?? null,
                telemetry.warningDelaySeconds,
                telemetry.criticalDelaySeconds,
                telemetry.calibrationOffset,
                new Date().toISOString(),
                existing.id
              );
          else
            this.database
              .prepare(
                `INSERT INTO sensors(uuid,room_id,device_id,channel,code,name,sensor_type,unit,warning_low,alarm_low,warning_high,alarm_high,warning_delay_seconds,critical_delay_seconds,calibration_offset) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
              )
              .run(
                randomUUID(),
                roomId,
                deviceId,
                mapping.m.channel,
                telemetry.code,
                telemetry.name,
                telemetry.type,
                telemetry.unit,
                telemetry.warningLow ?? null,
                telemetry.alarmLow ?? null,
                telemetry.warningHigh ?? null,
                telemetry.alarmHigh ?? null,
                telemetry.warningDelaySeconds,
                telemetry.criticalDelaySeconds,
                telemetry.calibrationOffset
              );
        }
  }

  private validateSnapshot(snapshot: InstallationSnapshot) {
    unique(
      snapshot.sites.map((x) => x.code),
      "DUPLICATE_SITE_CODE"
    );
    unique(
      snapshot.devices.map((x) => x.deviceId),
      "DUPLICATE_DEVICE_ID"
    );
    const sites = new Set(snapshot.sites.map((x) => x.code));
    const telemetryKeys = new Set<string>();
    for (const site of snapshot.sites) {
      unique(
        site.areas.map((x) => x.code),
        "DUPLICATE_AREA_CODE"
      );
      for (const area of site.areas) {
        unique(
          area.telemetries.map((x) => x.code),
          "DUPLICATE_TELEMETRY_CODE"
        );
        for (const t of area.telemetries) telemetryKeys.add(`${site.code}/${area.code}/${t.code}`);
      }
    }
    const mapped = new Set<string>();
    for (const device of snapshot.devices) {
      if (!sites.has(device.siteCode)) throw conflict("DEVICE_SITE_NOT_FOUND");
      unique(
        device.mappings.map((x) => x.channel),
        "DUPLICATE_DEVICE_CHANNEL"
      );
      for (const m of device.mappings) {
        const key = `${device.siteCode}/${m.areaCode}/${m.telemetryCode}`;
        if (!telemetryKeys.has(key)) throw conflict("MAPPING_TELEMETRY_NOT_FOUND");
        if (mapped.has(key)) throw conflict("TELEMETRY_MAPPED_MORE_THAN_ONCE");
        mapped.add(key);
      }
    }
    if (mapped.size !== telemetryKeys.size) throw conflict("TELEMETRY_MAPPING_REQUIRED");
  }
  private find(uuid: string) {
    const row = this.database
      .prepare("SELECT * FROM platform_installations WHERE uuid=?")
      .get(uuid) as InstallationRow | undefined;
    if (!row) throw new AppError("Installation not found", 404, "INSTALLATION_NOT_FOUND");
    return row;
  }
  private latest(id: number) {
    return this.database
      .prepare(
        "SELECT * FROM platform_installation_revisions WHERE installation_id=? ORDER BY revision DESC LIMIT 1"
      )
      .get(id) as RevisionRow;
  }
  private assertCustomer(id: number) {
    if (
      !this.database
        .prepare("SELECT 1 FROM platform_customers WHERE id=? AND status<>'CLOSED'")
        .get(id)
    )
      throw new AppError("Customer not found or closed", 404, "CUSTOMER_NOT_FOUND");
  }
  private assertUserBinding(customerId: number, userId: number) {
    if (
      !this.database
        .prepare("SELECT 1 FROM customer_user_bindings WHERE customer_id=? AND user_id=?")
        .get(customerId, userId)
    )
      throw new AppError("Installation not found", 404, "INSTALLATION_NOT_FOUND");
  }
  private insertRevision(
    id: number,
    revision: number,
    status: string,
    canonical: string,
    reason: string | null,
    actor: string
  ) {
    return Number(
      this.database
        .prepare(
          `INSERT INTO platform_installation_revisions(installation_id,revision,status,snapshot_json,checksum,reason,created_at,created_by) VALUES(?,?,?,?,?,?,?,?)`
        )
        .run(
          id,
          revision,
          status,
          canonical,
          checksum(canonical),
          reason,
          new Date().toISOString(),
          actor
        ).lastInsertRowid
    );
  }
  private setStatus(id: number, status: InstallationStatus) {
    this.database
      .prepare("UPDATE platform_installations SET status=?,updated_at=? WHERE id=?")
      .run(status, new Date().toISOString(), id);
  }
  private event(
    id: number,
    revisionId: number | null,
    type: string,
    actor: string,
    evidence: object
  ) {
    this.database
      .prepare(
        `INSERT INTO platform_installation_events(installation_id,revision_id,event_type,actor_identity,occurred_at,evidence_json) VALUES(?,?,?,?,?,?)`
      )
      .run(id, revisionId, type, actor, new Date().toISOString(), JSON.stringify(evidence));
  }
}

function canonicalize(value: InstallationSnapshot) {
  return JSON.stringify(value);
}
function checksum(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
function conflict(code: string) {
  return new AppError("Installation lifecycle conflict", 409, code);
}
function unique(values: (string | number)[], code: string) {
  if (new Set(values).size !== values.length) throw conflict(code);
}
function summarize(snapshot: InstallationSnapshot) {
  return {
    sites: snapshot.sites.length,
    areas: snapshot.sites.reduce((n, s) => n + s.areas.length, 0),
    telemetries: snapshot.sites.reduce(
      (n, s) => n + s.areas.reduce((m, a) => m + a.telemetries.length, 0),
      0
    ),
    devices: snapshot.devices.length,
    mappings: snapshot.devices.reduce((n, d) => n + d.mappings.length, 0),
  };
}
export const installationService = new InstallationService();

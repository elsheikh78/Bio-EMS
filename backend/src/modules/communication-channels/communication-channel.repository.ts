import type Database from "better-sqlite3";
import { sqlite } from "../../../database/sqlite/client";
import {
  communicationChannelConfigSchema,
  type CommunicationChannel,
  type CommunicationChannelConfig,
  type CommunicationChannelScope,
  type CommunicationChannelSecrets,
} from "./communication-channel.schema";
import {
  decryptCommunicationSecrets,
  encryptCommunicationSecrets,
} from "./communication-channel-crypto";

interface StoredRow {
  id: number;
  customerId: number;
  siteId: number | null;
  channel: CommunicationChannel;
  enabled: number;
  priority: number;
  configJson: string;
  secretsEncrypted: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface RedactedCommunicationChannelConfig {
  id: number;
  customerId: number;
  siteId: number | null;
  config: CommunicationChannelConfig;
  secretsConfigured: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface RuntimeCommunicationChannelConfig {
  config: CommunicationChannelConfig;
  secrets: CommunicationChannelSecrets;
}

export class CommunicationChannelRepository {
  constructor(
    private readonly encryptionKey: Buffer,
    private readonly database: Database.Database = sqlite
  ) {}

  upsert(
    scope: CommunicationChannelScope,
    config: CommunicationChannelConfig,
    secrets: CommunicationChannelSecrets,
    actor: string,
    now = new Date().toISOString()
  ): RedactedCommunicationChannelConfig {
    const parsed = communicationChannelConfigSchema.parse(config);
    const encrypted = encryptCommunicationSecrets(
      secrets,
      this.encryptionKey,
      scope,
      parsed.channel
    );
    this.database
      .prepare(
        `
      INSERT INTO communication_channel_configs
        (customer_id,site_id,channel,enabled,priority,config_json,secrets_encrypted,created_at,updated_at,updated_by)
      VALUES (?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT DO UPDATE SET enabled=excluded.enabled,priority=excluded.priority,
        config_json=excluded.config_json,secrets_encrypted=excluded.secrets_encrypted,
        updated_at=excluded.updated_at,updated_by=excluded.updated_by
    `
      )
      .run(
        scope.customerId,
        scope.siteId,
        parsed.channel,
        Number(parsed.enabled),
        parsed.priority,
        JSON.stringify(parsed),
        encrypted,
        now,
        now,
        actor
      );
    const result = this.find(scope, parsed.channel);
    if (!result) throw new Error("Communication configuration was not persisted");
    return result;
  }

  find(
    scope: CommunicationChannelScope,
    channel: CommunicationChannel
  ): RedactedCommunicationChannelConfig | null {
    const row = this.getStored(scope, channel);
    return row ? this.redact(row) : null;
  }

  list(scope: CommunicationChannelScope): RedactedCommunicationChannelConfig[] {
    const rows = this.database
      .prepare(
        `SELECT id,customer_id AS customerId,site_id AS siteId,channel,enabled,priority,
          config_json AS configJson,secrets_encrypted AS secretsEncrypted,
          created_at AS createdAt,updated_at AS updatedAt,updated_by AS updatedBy
         FROM communication_channel_configs
         WHERE customer_id=? AND site_id IS ? ORDER BY priority,channel`
      )
      .all(scope.customerId, scope.siteId) as StoredRow[];
    return rows.map((row) => this.redact(row));
  }

  getRuntimeSecrets(
    scope: CommunicationChannelScope,
    channel: CommunicationChannel
  ): CommunicationChannelSecrets {
    const row = this.getStored(scope, channel);
    if (!row) throw new Error("Communication configuration not found");
    return decryptCommunicationSecrets(row.secretsEncrypted, this.encryptionKey, scope, channel);
  }

  resolveRuntimeForSite(
    siteId: number,
    channel: CommunicationChannel
  ): RuntimeCommunicationChannelConfig | null {
    const row = this.database
      .prepare(
        `SELECT c.id,c.customer_id AS customerId,c.site_id AS siteId,c.channel,c.enabled,c.priority,
          c.config_json AS configJson,c.secrets_encrypted AS secretsEncrypted,
          c.created_at AS createdAt,c.updated_at AS updatedAt,c.updated_by AS updatedBy
         FROM customer_site_bindings b
         JOIN communication_channel_configs c ON c.customer_id=b.customer_id
         WHERE b.site_id=? AND c.channel=? AND c.enabled=1
           AND (c.site_id=? OR c.site_id IS NULL)
         ORDER BY CASE WHEN c.site_id=? THEN 0 ELSE 1 END LIMIT 1`
      )
      .get(siteId, channel, siteId, siteId) as StoredRow | undefined;
    if (!row) return null;
    const scope = { customerId: row.customerId, siteId: row.siteId };
    return {
      config: communicationChannelConfigSchema.parse(JSON.parse(row.configJson)),
      secrets: decryptCommunicationSecrets(
        row.secretsEncrypted,
        this.encryptionKey,
        scope,
        channel
      ),
    };
  }

  private getStored(
    scope: CommunicationChannelScope,
    channel: CommunicationChannel
  ): StoredRow | undefined {
    return this.database
      .prepare(
        `
      SELECT id,customer_id AS customerId,site_id AS siteId,channel,enabled,priority,
        config_json AS configJson,secrets_encrypted AS secretsEncrypted,
        created_at AS createdAt,updated_at AS updatedAt,updated_by AS updatedBy
      FROM communication_channel_configs
      WHERE customer_id=? AND site_id IS ? AND channel=?
    `
      )
      .get(scope.customerId, scope.siteId, channel) as StoredRow | undefined;
  }

  private redact(row: StoredRow): RedactedCommunicationChannelConfig {
    const config = communicationChannelConfigSchema.parse(JSON.parse(row.configJson));
    return {
      id: row.id,
      customerId: row.customerId,
      siteId: row.siteId,
      config,
      secretsConfigured: row.secretsEncrypted.length > 0,
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy,
    };
  }
}

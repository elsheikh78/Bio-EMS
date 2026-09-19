import { randomBytes } from "node:crypto";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration018 } from "../../../database/sqlite/migrations/018_create_commercial_operations";
import { migration027 } from "../../../database/sqlite/migrations/027_create_communication_channel_configs";
import {
  decryptCommunicationSecrets,
  encryptCommunicationSecrets,
  parseCommunicationConfigEncryptionKey,
} from "./communication-channel-crypto";
import { CommunicationChannelRepository } from "./communication-channel.repository";

const scope = { customerId: 1, siteId: null };
const emailConfig = {
  channel: "EMAIL" as const,
  enabled: true,
  priority: 1,
  host: "smtp.example.test",
  port: 587,
  security: "STARTTLS" as const,
  senderName: "BIO EMS",
  senderAddress: "alerts@example.test",
  username: "alerts@example.test",
};

describe("communication channel encrypted configuration", () => {
  let database: Database.Database;
  let key: Buffer;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    database.exec("CREATE TABLE sites (id INTEGER PRIMARY KEY)");
    migration018.up(database);
    migration027.up(database);
    database
      .prepare(
        "INSERT INTO platform_customers (id,code,name,status,created_at,created_by) VALUES (1,'C1','Customer','ACTIVE',?,?)"
      )
      .run(new Date().toISOString(), "test");
    key = randomBytes(32);
  });

  afterEach(() => database.close());

  it("parses only canonical 32-byte base64 keys", () => {
    expect(parseCommunicationConfigEncryptionKey(key.toString("base64"))).toEqual(key);
    expect(() => parseCommunicationConfigEncryptionKey("not-a-key")).toThrow(/32 bytes/);
  });

  it("uses a fresh nonce and authenticates the scope and channel", () => {
    const secrets = { password: "smtp-secret-value" };
    const first = encryptCommunicationSecrets(secrets, key, scope, "EMAIL");
    const second = encryptCommunicationSecrets(secrets, key, scope, "EMAIL");

    expect(first).not.toBe(second);
    expect(decryptCommunicationSecrets(first, key, scope, "EMAIL")).toEqual(secrets);
    expect(() =>
      decryptCommunicationSecrets(first, key, { customerId: 2, siteId: null }, "EMAIL")
    ).toThrow(/authentication failed/);
    const tampered = first.split(".");
    tampered[3] = `${tampered[3][0] === "A" ? "B" : "A"}${tampered[3].slice(1)}`;
    expect(() => decryptCommunicationSecrets(tampered.join("."), key, scope, "EMAIL")).toThrow(
      /authentication failed/
    );
  });

  it("returns redacted data while runtime access decrypts the secret", () => {
    const repository = new CommunicationChannelRepository(key, database);
    const result = repository.upsert(
      scope,
      emailConfig,
      { password: "smtp-secret-value" },
      "owner"
    );

    expect(result.secretsConfigured).toBe(true);
    expect(JSON.stringify(result)).not.toContain("smtp-secret-value");
    expect(repository.getRuntimeSecrets(scope, "EMAIL")).toEqual({
      password: "smtp-secret-value",
    });

    const stored = database
      .prepare(
        "SELECT config_json AS configJson,secrets_encrypted AS encrypted FROM communication_channel_configs"
      )
      .get() as { configJson: string; encrypted: string };
    expect(stored.configJson).not.toContain("smtp-secret-value");
    expect(stored.encrypted).not.toContain("smtp-secret-value");
  });

  it("upserts one configuration per customer scope and channel", () => {
    const repository = new CommunicationChannelRepository(key, database);
    repository.upsert(scope, emailConfig, { password: "first-secret" }, "admin");
    repository.upsert(
      scope,
      { ...emailConfig, host: "smtp.changed.test", enabled: false },
      { password: "second-secret" },
      "owner"
    );

    expect(
      (
        database.prepare("SELECT COUNT(*) AS count FROM communication_channel_configs").get() as {
          count: number;
        }
      ).count
    ).toBe(1);
    expect(repository.find(scope, "EMAIL")?.config).toEqual(
      expect.objectContaining({ host: "smtp.changed.test", enabled: false })
    );
    expect(repository.getRuntimeSecrets(scope, "EMAIL")).toEqual({ password: "second-secret" });
  });
});

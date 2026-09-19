import { randomBytes } from "node:crypto";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration003 } from "../../../database/sqlite/migrations/003_create_users";
import { migration018 } from "../../../database/sqlite/migrations/018_create_commercial_operations";
import { migration019 } from "../../../database/sqlite/migrations/019_create_customer_ownership";
import { migration027 } from "../../../database/sqlite/migrations/027_create_communication_channel_configs";
import { CommunicationChannelRepository } from "./communication-channel.repository";
import { CommunicationChannelService } from "./communication-channel.service";

const config = {
  channel: "TELEGRAM" as const,
  enabled: true,
  priority: 1,
};

describe("CommunicationChannelService authorization scope", () => {
  let database: Database.Database;
  let key: Buffer;
  let service: CommunicationChannelService;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    database.exec("CREATE TABLE sites (id INTEGER PRIMARY KEY)");
    migration003.up(database);
    migration018.up(database);
    migration019.up(database);
    migration027.up(database);
    database
      .prepare(
        "INSERT INTO platform_customers (id,code,name,status,created_at,created_by) VALUES (1,'C1','One','ACTIVE',?,?), (2,'C2','Two','ACTIVE',?,?)"
      )
      .run("2026-01-01T00:00:00.000Z", "test", "2026-01-01T00:00:00.000Z", "test");
    database.prepare("INSERT INTO sites (id) VALUES (10),(20)").run();
    database
      .prepare(
        "INSERT INTO users (id,username,password_hash,role,status) VALUES (7,'admin','hash','ADMIN','active')"
      )
      .run();
    database
      .prepare(
        "INSERT INTO customer_user_bindings (customer_id,user_id,bound_at,bound_by) VALUES (1,7,?,?)"
      )
      .run("2026-01-01T00:00:00.000Z", "test");
    database
      .prepare(
        "INSERT INTO customer_site_bindings (customer_id,site_id,bound_at,bound_by) VALUES (1,10,?,?),(2,20,?,?)"
      )
      .run("2026-01-01T00:00:00.000Z", "test", "2026-01-01T00:00:00.000Z", "test");
    key = randomBytes(32);
    service = new CommunicationChannelService(key, database);
  });

  afterEach(() => database.close());

  it("infers an ADMIN customer and rejects a site owned by another customer", () => {
    expect(service.scopeForAdmin(7, 10)).toEqual({ customerId: 1, siteId: 10 });
    expect(() => service.scopeForAdmin(7, 20)).toThrow(/outside customer scope/);
  });

  it("lets SYSTEM_OWNER choose an existing customer but enforces site ownership", () => {
    expect(service.scopeForOwner(2, 20)).toEqual({ customerId: 2, siteId: 20 });
    expect(() => service.scopeForOwner(2, 10)).toThrow(/outside customer scope/);
  });

  it("keeps stored secrets when update fields are blank", () => {
    const scope = service.scopeForAdmin(7, null);
    service.save(
      scope,
      "TELEGRAM",
      { siteId: null, config, secrets: { botToken: "first-token" } },
      "admin#7"
    );
    service.save(
      scope,
      "TELEGRAM",
      { siteId: null, config: config, secrets: { botToken: "" } },
      "admin#7"
    );

    expect(
      new CommunicationChannelRepository(key, database).getRuntimeSecrets(scope, "TELEGRAM")
    ).toEqual({ botToken: "first-token" });
  });

  it("allows initial LOCAL_MODEM SMS configuration without a provider secret", () => {
    const scope = service.scopeForAdmin(7, null);
    expect(() =>
      service.save(
        scope,
        "SMS",
        {
          siteId: null,
          config: {
            channel: "SMS",
            enabled: true,
            priority: 4,
            transport: "LOCAL_MODEM",
            simNumber: "+201000000000",
            operator: "test",
            apn: "",
            comPort: "COM3",
            providerUrl: "",
            providerAccount: "",
          },
          secrets: {},
        },
        "admin#7"
      )
    ).not.toThrow();

    expect(
      new CommunicationChannelRepository(key, database).getRuntimeSecrets(scope, "SMS")
    ).toEqual({});
  });

  it("still requires a provider secret for initial HTTP SMS configuration", () => {
    const scope = service.scopeForAdmin(7, null);
    expect(() =>
      service.save(
        scope,
        "SMS",
        {
          siteId: null,
          config: {
            channel: "SMS",
            enabled: true,
            priority: 4,
            transport: "HTTP",
            simNumber: "",
            operator: "",
            apn: "",
            comPort: "",
            providerUrl: "https://sms.example.test/send",
            providerAccount: "bio-ems",
          },
          secrets: {},
        },
        "admin#7"
      )
    ).toThrow(/initial configuration/);
  });

  it("requires a secret only on initial configuration", () => {
    expect(() =>
      service.save(
        service.scopeForAdmin(7, null),
        "TELEGRAM",
        {
          siteId: null,
          config,
          secrets: {},
        },
        "admin#7"
      )
    ).toThrow(/initial configuration/);
  });
});

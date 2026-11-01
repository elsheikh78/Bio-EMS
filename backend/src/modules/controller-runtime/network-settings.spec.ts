import Database from "better-sqlite3";
import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import { migration036 } from "../../../database/sqlite/migrations/036_main_resilience";
import { migration037 } from "../../../database/sqlite/migrations/037_controller_network_settings";
import { NetworkSettingsStore } from "./network-settings";
import { FeaturePolicyStore, defaultDevicePolicy } from "./feature-policy";
import {
  createNetworkSettingsRouter,
  requireNetworkAdmin,
} from "../../routes/network-settings.route";
import { errorMiddleware } from "../../middleware/error.middleware";
vi.mock("../../config/config", () => ({ config: { communicationConfigEncryptionKey: undefined } }));

const binding = "11111111-1111-4111-8111-111111111111",
  other = "22222222-2222-4222-8222-222222222222";
function setup(version = 1, key: Buffer | undefined = Buffer.alloc(32, 7)) {
  const db = new Database(":memory:");
  db.exec(
    `CREATE TABLE device_platform_bindings(platform_binding_id TEXT PRIMARY KEY,status TEXT,device_identity TEXT,site_code TEXT); INSERT INTO device_platform_bindings VALUES('${binding}','ACTIVE','MAIN1','SITE1');`
  );
  migration036.up(db);
  migration037.up(db);
  db.prepare("INSERT INTO controller_health VALUES(?,?,?,?)").run(
    binding,
    0,
    JSON.stringify({ networkSettingsVersion: version, transport: "ethernet" }),
    new Date().toISOString()
  );
  const store = new NetworkSettingsStore(db, key);
  return { db, store };
}
const body = {
  expectedRevision: 0,
  ethernet: true,
  wifi: true,
  bluetooth: true,
  centralBatteryInstalled: false,
  reason: "Change test network",
};
describe("bound Main network settings", () => {
  it("encrypts Wi-Fi credentials, never returns the password or stores it in history, and preserves unrelated flags", () => {
    const { db, store } = setup();
    const features = new FeaturePolicyStore(db);
    features.save(
      binding,
      {
        expectedRevision: 0,
        policy: { ...defaultDevicePolicy, automaticReplay: false },
        reason: "Pause replay",
      },
      "owner"
    );
    const saved = store.save(
      binding,
      {
        ...body,
        expectedRevision: 1,
        wifiCredentials: { ssid: "Office WiFi", password: "secret-password" },
      },
      "ADMIN:1"
    );
    expect(saved.revision).toBe(2);
    expect(saved.appliedRevision).toBe(0);
    expect(saved.ssid).toBe("Office WiFi");
    expect(JSON.stringify(saved)).not.toContain("secret-password");
    expect(
      JSON.stringify(db.prepare("SELECT * FROM controller_network_credentials").all())
    ).not.toContain("secret-password");
    expect(JSON.stringify(db.prepare("SELECT * FROM feature_policy_history").all())).not.toContain(
      "secret-password"
    );
    expect(store.credentials(binding)?.password).toBe("secret-password");
    expect(features.get(binding).policy.automaticReplay).toBe(false);
    store.save(binding, { ...body, expectedRevision: 2, wifi: false }, "SYSTEM_OWNER:owner");
    expect(store.credentials(binding)?.password).toBe("secret-password");
    expect(
      db.prepare("SELECT actor FROM feature_policy_history ORDER BY id DESC LIMIT 1").get()
    ).toEqual({ actor: "SYSTEM_OWNER:owner" });
    db.close();
  });
  it("rejects stale edits, unknown privilege fields, unsupported firmware, all paths off and bad credentials", () => {
    const { db, store } = setup();
    expect(() =>
      store.save(binding, { ...body, ethernet: false, wifi: false, bluetooth: false }, "ADMIN:1")
    ).toThrow();
    expect(() => store.save(binding, { ...body, reports: false }, "ADMIN:1")).toThrow();
    expect(() =>
      store.save(
        binding,
        { ...body, wifiCredentials: { ssid: "a".repeat(33), password: "secret123" } },
        "ADMIN:1"
      )
    ).toThrow();
    store.save(binding, body, "ADMIN:1");
    expect(() => store.save(binding, body, "owner")).toThrow(/reload/);
    const legacy = setup(0);
    expect(() => legacy.store.save(binding, body, "owner")).toThrow(/Upgrade/);
    legacy.db.close();
    db.close();
  });
  it("binds encryption to controller identity and rolls back the policy revision if encryption fails", () => {
    const { db, store } = setup();
    store.save(
      binding,
      { ...body, wifiCredentials: { ssid: "Office", password: "secret123" } },
      "owner"
    );
    db.exec(
      `INSERT INTO device_platform_bindings VALUES('${other}','ACTIVE','MAIN2','SITE1'); INSERT INTO controller_network_credentials SELECT '${other}',encrypted,updated_at FROM controller_network_credentials WHERE binding_id='${binding}';`
    );
    expect(() => store.credentials(other)).toThrow();
    const broken = new NetworkSettingsStore(db, Buffer.alloc(3));
    expect(() =>
      broken.save(
        binding,
        { ...body, expectedRevision: 1, wifiCredentials: { ssid: "New", password: "secret456" } },
        "owner"
      )
    ).toThrow();
    expect(new FeaturePolicyStore(db).get(binding).revision).toBe(1);
    db.close();
  });
  it.each([undefined, "VIEWER", "OPERATOR"])(
    "denies %s access on both read and write",
    async (role) => {
      const { db, store } = setup();
      const app = express();
      app.use(express.json());
      app.use((req, _res, next) => {
        if (role) req.user = { id: 2, username: "user", role } as never;
        next();
      });
      app.use(requireNetworkAdmin, createNetworkSettingsRouter(db, store));
      app.use(errorMiddleware);
      expect((await request(app).get("/")).status).toBe(403);
      expect((await request(app).put(`/${binding}`).send(body)).status).toBe(403);
      db.close();
    }
  );
  it("allows an admin, rejects inactive bindings and doesn't expose feature-policy write operations", async () => {
    const { db, store } = setup();
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { id: 1, username: "admin", role: "ADMIN" };
      next();
    });
    app.use(requireNetworkAdmin, createNetworkSettingsRouter(db, store));
    app.use(errorMiddleware);
    expect((await request(app).get("/")).body.controllers).toHaveLength(1);
    expect(
      (
        await request(app)
          .put(`/${binding}`)
          .send({ ...body, backups: false })
      ).status
    ).toBe(400);
    expect((await request(app).put(`/${binding}`).send(body)).status).toBe(200);
    db.prepare("UPDATE device_platform_bindings SET status='REVOKED'").run();
    expect((await request(app).get(`/${binding}`)).status).toBe(404);
    db.close();
  });
});

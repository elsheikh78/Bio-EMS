import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { generateKeyPairSync } from "node:crypto";
import worker from "../src/worker.mjs";

function setup() {
  const db = new DatabaseSync(":memory:");
  db.exec(
    readFileSync(
      new URL("../migrations/0001_company.sql", import.meta.url),
      "utf8",
    ),
  );
  const adapter = {
    prepare(sql) {
      let args = [];
      return {
        bind(...values) {
          args = values;
          return this;
        },
        async first() {
          return db.prepare(sql).get(...args) || null;
        },
        async all() {
          return { results: db.prepare(sql).all(...args) };
        },
        async run() {
          return db.prepare(sql).run(...args);
        },
      };
    },
    async batch(statements) {
      return Promise.all(statements.map((s) => s.run()));
    },
  };
  const env = {
    DB: adapter,
    COMPANY_ADMIN_TOKEN: "a".repeat(40),
    SESSION_SECRET: "b".repeat(40),
    ASSETS: { fetch: async () => new Response("asset") },
  };
  let cookie;
  async function call(path, method = "GET", data, extra = {}) {
    const headers = {
      ...(method === "GET" ? {} : { Origin: "https://test.workers.dev" }),
      ...(cookie ? { Cookie: cookie } : {}),
      ...extra,
    };
    return worker.fetch(
      new Request(`https://test.workers.dev${path}`, {
        method,
        headers,
        body: data === undefined ? undefined : JSON.stringify(data),
      }),
      env,
    );
  }
  async function login() {
    const response = await call("/api/company/login", "POST", {
      token: env.COMPANY_ADMIN_TOKEN,
    });
    assert.equal(response.status, 200);
    cookie = response.headers.get("Set-Cookie").split(";")[0];
    return response;
  }
  async function enroll(name = "Site") {
    const customer = await (
      await call("/api/company/customers", "POST", { name: "BIO EGYPT" })
    ).json();
    return (
      await call("/api/company/sites", "POST", {
        name,
        customerId: customer.id,
      })
    ).json();
  }
  return {
    db,
    env,
    call,
    login,
    enroll,
    getCookie: () => cookie,
    setCookie: (value) => (cookie = value),
  };
}
const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicKey = pair.publicKey.export({ format: "jwk" });
const heartbeat = {
  publicKey,
  status: "UP",
  version: "0.20.0",
  uptime: 1,
  remoteControl: true,
};
const auth = (site) => ({ Authorization: `Bearer ${site.token}` });
test("company session protects customer data, requires same origin, and is HttpOnly", async () => {
  const s = setup();
  assert.equal((await s.call("/api/company/overview")).status, 401);
  assert.equal(
    (
      await s.call(
        "/api/company/login",
        "POST",
        { token: s.env.COMPANY_ADMIN_TOKEN },
        { Origin: "https://evil.example" },
      )
    ).status,
    403,
  );
  const response = await s.login();
  assert.match(
    response.headers.get("Set-Cookie"),
    /Secure; HttpOnly; SameSite=Strict/,
  );
  assert.equal(
    (
      await s.call(
        "/api/company/customers",
        "POST",
        { name: "Test" },
        { Origin: "https://evil.example" },
      )
    ).status,
    403,
  );
  s.setCookie(s.getCookie() + "tampered");
  assert.equal((await s.call("/api/company/overview")).status, 401);
});
test("login is rate limited and short/unconfigured secrets fail closed", async () => {
  const s = setup();
  for (let i = 0; i < 10; i++)
    assert.equal(
      (await s.call("/api/company/login", "POST", { token: "wrong" })).status,
      401,
    );
  assert.equal(
    (
      await s.call("/api/company/login", "POST", {
        token: s.env.COMPANY_ADMIN_TOKEN,
      })
    ).status,
    429,
  );
  s.env.SESSION_SECRET = "short";
  assert.equal(
    (
      await s.call("/api/company/login", "POST", {
        token: s.env.COMPANY_ADMIN_TOKEN,
      })
    ).status,
    503,
  );
});
test("enrollment token is one-time output, hashed in DB, and absent from overview", async () => {
  const s = setup();
  await s.login();
  const site = await s.enroll();
  assert.ok(site.token);
  const row = s.db.prepare("SELECT * FROM sites").get();
  assert.notEqual(row.agent_hash, site.token);
  const overview = await (await s.call("/api/company/overview")).json();
  assert.equal(overview.sites[0].connection, "pending");
  assert.equal(overview.licenseEnforcement, false);
  assert.ok(!JSON.stringify(overview).includes(site.token));
  assert.equal(overview.sites[0].agent_hash, undefined);
});
test("site authentication, enrollment public key pinning and last-seen transitions", async () => {
  const s = setup();
  await s.login();
  const site = await s.enroll();
  assert.equal(
    (
      await s.call(`/api/agent/${site.id}/heartbeat`, "POST", heartbeat, {
        Authorization: "Bearer wrong",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await s.call(
        `/api/agent/${site.id}/heartbeat`,
        "POST",
        heartbeat,
        auth(site),
      )
    ).status,
    200,
  );
  let overview = await (await s.call("/api/company/overview")).json();
  assert.equal(overview.sites[0].connection, "online");
  const next = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  }).publicKey.export({ format: "jwk" });
  assert.equal(
    (
      await s.call(
        `/api/agent/${site.id}/heartbeat`,
        "POST",
        { ...heartbeat, publicKey: next },
        auth(site),
      )
    ).status,
    409,
  );
  s.db.prepare("UPDATE sites SET last_seen=?").run(Date.now() - 200_000);
  overview = await (await s.call("/api/company/overview")).json();
  assert.equal(overview.sites[0].connection, "offline");
});
test("site licenses validate limits, expire, renew and remain monitor-only", async () => {
  const s = setup();
  await s.login();
  const site = await s.enroll();
  const data = {
    siteId: site.id,
    startsAt: Date.now() - 20000,
    expiresAt: Date.now() - 1000,
    sensorLimit: 20,
    deviceLimit: 4,
    status: "trial",
  };
  assert.equal(
    (await s.call("/api/company/licenses", "POST", { ...data, sensorLimit: 0 }))
      .status,
    400,
  );
  const license = await (
    await s.call("/api/company/licenses", "POST", data)
  ).json();
  let overview = await (await s.call("/api/company/overview")).json();
  assert.equal(overview.licenses[0].effective_status, "expired");
  assert.equal(
    (
      await s.call(`/api/company/licenses/${license.id}`, "PATCH", {
        ...data,
        expiresAt: Date.now() + 100000,
        status: "active",
      })
    ).status,
    200,
  );
  overview = await (await s.call("/api/company/overview")).json();
  assert.equal(overview.licenses[0].effective_status, "active");
  assert.equal(overview.licenseEnforcement, false);
});
test("remote commands require online opted-in site and cannot be claimed/completed by another site", async () => {
  const s = setup();
  await s.login();
  const a = await s.enroll("A"),
    b = await s.enroll("B");
  const id = crypto.randomUUID(),
    envelope = { key: "wrapped", iv: "iv", ciphertext: "encrypted" };
  assert.equal(
    (
      await s.call(`/api/company/sites/${a.id}/commands`, "POST", {
        id,
        envelope,
      })
    ).status,
    409,
  );
  await s.call(`/api/agent/${a.id}/heartbeat`, "POST", heartbeat, auth(a));
  assert.equal(
    (
      await s.call(`/api/company/sites/${a.id}/commands`, "POST", {
        id,
        envelope,
      })
    ).status,
    202,
  );
  const wrong = await (
    await s.call(`/api/agent/${b.id}/claim`, "POST", {}, auth(b))
  ).json();
  assert.equal(wrong.job, null);
  const claim = await (
    await s.call(`/api/agent/${a.id}/claim`, "POST", {}, auth(a))
  ).json();
  assert.equal(claim.job.id, id);
  const again = await (
    await s.call(`/api/agent/${a.id}/claim`, "POST", {}, auth(a))
  ).json();
  assert.equal(again.job, null);
  const result = { iv: "iv", ciphertext: "encrypted result" };
  assert.equal(
    (await s.call(`/api/agent/${b.id}/result`, "POST", { id, result }, auth(b)))
      .status,
    409,
  );
  assert.equal(
    (await s.call(`/api/agent/${a.id}/result`, "POST", { id, result }, auth(a)))
      .status,
    200,
  );
  assert.equal(
    (await s.call(`/api/agent/${a.id}/result`, "POST", { id, result }, auth(a)))
      .status,
    409,
  );
  assert.equal(
    (await s.call(`/api/company/sites/${b.id}/commands/${id}`)).status,
    404,
  );
  const read = await (
    await s.call(`/api/company/sites/${a.id}/commands/${id}`)
  ).json();
  assert.equal(read.state, "completed");
  assert.deepEqual(read.result, result);
});
test("revoking site blocks agent and expires pending commands", async () => {
  const s = setup();
  await s.login();
  const site = await s.enroll();
  await s.call(
    `/api/agent/${site.id}/heartbeat`,
    "POST",
    heartbeat,
    auth(site),
  );
  const id = crypto.randomUUID();
  await s.call(`/api/company/sites/${site.id}/commands`, "POST", {
    id,
    envelope: { key: "x", iv: "x", ciphertext: "x" },
  });
  assert.equal(
    (await s.call(`/api/company/sites/${site.id}/revoke`, "POST", {})).status,
    200,
  );
  assert.equal(
    (await s.call(`/api/agent/${site.id}/claim`, "POST", {}, auth(site)))
      .status,
    401,
  );
  assert.equal(s.db.prepare("SELECT state FROM jobs").get().state, "expired");
});
test("expired jobs are never claimed; scheduled cleanup erases encrypted payloads", async () => {
  const s = setup();
  await s.login();
  const site = await s.enroll();
  await s.call(
    `/api/agent/${site.id}/heartbeat`,
    "POST",
    heartbeat,
    auth(site),
  );
  await s.call(`/api/company/sites/${site.id}/commands`, "POST", {
    id: crypto.randomUUID(),
    envelope: { key: "x", iv: "x", ciphertext: "x" },
  });
  s.db.prepare("UPDATE jobs SET expires_at=?").run(Date.now() - 1);
  const claim = await (
    await s.call(`/api/agent/${site.id}/claim`, "POST", {}, auth(site))
  ).json();
  assert.equal(claim.job, null);
  await worker.scheduled({}, s.env);
  const row = s.db.prepare("SELECT * FROM jobs").get();
  assert.equal(row.state, "expired");
  assert.equal(row.envelope, "");
});
test("body limits and security headers apply to error and asset responses", async () => {
  const s = setup();
  await s.login();
  assert.equal(
    (
      await s.call("/api/company/customers", "POST", {
        name: "x".repeat(600001),
      })
    ).status,
    413,
  );
  const response = await s.call("/");
  assert.equal(response.headers.get("X-Frame-Options"), "DENY");
  assert.match(
    response.headers.get("Content-Security-Policy"),
    /connect-src 'self'/,
  );
});

test("owner routes serve canonical HTML without redirecting the browser away from owner login", async () => {
  const s = setup();
  await s.login();
  s.env.ASSETS.fetch = async (request) => {
    const url = new URL(request.url);
    if (url.pathname === "/owner.html")
      return Response.redirect(new URL("/owner", url), 307);
    if (url.pathname === "/owner")
      return new Response("<html>Owner application</html>", {
        headers: { "Content-Type": "text/html" },
      });
    return new Response("Not found", { status: 404 });
  };
  for (const path of [
    "/system-owner/login",
    "/system-owner",
    "/system-owner/installations",
  ]) {
    const response = await s.call(path);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Location"), null);
    assert.match(await response.text(), /Owner application/);
  }
  s.setCookie(undefined);
  assert.equal((await s.call("/system-owner/login")).status, 401);
});

test("heartbeat synchronizes only the authenticated site's pilot licenses including renewals", async () => {
  const s = setup();
  await s.login();
  const a = await s.enroll("A");
  const b = await s.enroll("B");
  s.db
    .prepare("INSERT INTO licenses VALUES (?,?,?,?,?,?,?,?)")
    .run("lic-a", a.id, 1, 100, 7, 1, "trial", 1);
  s.db
    .prepare("INSERT INTO licenses VALUES (?,?,?,?,?,?,?,?)")
    .run("lic-b", b.id, 1, 100, 20, 2, "active", 1);
  const poll = async () =>
    (
      await s.call(`/api/agent/${a.id}/heartbeat`, "POST", heartbeat, {
        Authorization: `Bearer ${a.token}`,
      })
    ).json();
  let result = await poll();
  assert.equal(result.licenseSnapshot.enforcement, false);
  assert.equal(result.licenseSnapshot.siteId, a.id);
  assert.deepEqual(
    result.licenseSnapshot.licenses.map((x) => x.id),
    ["lic-a"],
  );
  s.db.prepare("UPDATE licenses SET expires_at=200 WHERE id='lic-a'").run();
  result = await poll();
  assert.equal(result.licenseSnapshot.licenses[0].expires_at, 200);
  s.db.prepare("DELETE FROM licenses WHERE id='lic-a'").run();
  result = await poll();
  assert.deepEqual(result.licenseSnapshot.licenses, []);
});

test("company removal requires auth and same origin, isolates other sites and clears dependent records", async () => {
  const s = setup();
  await s.login();
  const a = await s.enroll("A"),
    b = await s.enroll("B");
  s.db
    .prepare("INSERT INTO licenses VALUES (?,?,?,?,?,?,?,?)")
    .run("remove-me", a.id, 1, 200, 7, 1, "trial", 1);
  s.db
    .prepare("INSERT INTO licenses VALUES (?,?,?,?,?,?,?,?)")
    .run("keep-me", b.id, 1, 200, 7, 1, "trial", 1);
  const cookie = s.getCookie();
  s.setCookie(undefined);
  assert.equal(
    (await s.call("/api/company/licenses/remove-me", "DELETE")).status,
    401,
  );
  s.setCookie(cookie);
  assert.equal(
    (
      await s.call("/api/company/licenses/remove-me", "DELETE", undefined, {
        Origin: "https://evil.invalid",
      })
    ).status,
    403,
  );
  assert.equal(
    (await s.call("/api/company/licenses/remove-me", "DELETE")).status,
    200,
  );
  assert.equal(
    s.db.prepare("SELECT count(*) AS n FROM licenses WHERE site_id=?").get(a.id)
      .n,
    0,
  );
  assert.ok(s.db.prepare("SELECT * FROM sites WHERE id=?").get(a.id));
  s.db
    .prepare("INSERT INTO licenses VALUES (?,?,?,?,?,?,?,?)")
    .run("site-license", a.id, 1, 200, 7, 1, "trial", 1);
  s.db
    .prepare("INSERT INTO jobs VALUES (?,?,?,?,?,?,?)")
    .run("job-a", a.id, "encrypted", null, "queued", 1, Date.now() + 60000);
  assert.equal(
    (await s.call(`/api/company/sites/${a.id}`, "DELETE")).status,
    200,
  );
  assert.equal(
    (await s.call(`/api/agent/${a.id}/heartbeat`, "POST", heartbeat, auth(a)))
      .status,
    401,
  );
  assert.equal(
    s.db.prepare("SELECT count(*) AS n FROM jobs WHERE site_id=?").get(a.id).n,
    0,
  );
  assert.equal(
    s.db.prepare("SELECT count(*) AS n FROM licenses WHERE site_id=?").get(a.id)
      .n,
    0,
  );
  assert.ok(s.db.prepare("SELECT * FROM licenses WHERE id='keep-me'").get());
  assert.ok(s.db.prepare("SELECT * FROM sites WHERE id=?").get(b.id));
  assert.equal(
    s.db
      .prepare(
        "SELECT count(*) AS n FROM audit WHERE action IN ('site.deleted','license.deleted')",
      )
      .get().n,
    2,
  );
  assert.equal(
    (await s.call(`/api/company/sites/${a.id}`, "DELETE")).status,
    404,
  );
});

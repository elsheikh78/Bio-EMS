const enc = new TextEncoder();
const MAX_BODY = 600_000;
const SESSION_MS = 30 * 60_000;
const idPattern = /^[a-zA-Z0-9-]{1,64}$/;
export const b64 = (bytes) => btoa(String.fromCharCode(...bytes));
export const unb64 = (value) =>
  Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
export async function hash(value) {
  return b64(
    new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(value))),
  );
}
function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}
function text(value, max = 160) {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    fail(400, "Invalid text");
  return value.trim();
}
function integer(value, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max)
    fail(400, "Invalid number");
  return value;
}
async function body(req) {
  // Stream enforcement also covers chunked requests without Content-Length.
  const reader = req.body?.getReader();
  let size = 0;
  const chunks = [];
  if (!reader) fail(400, "Missing body");
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BODY) {
      await reader.cancel();
      fail(413, "Body too large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    fail(400, "Invalid JSON");
  }
}
function secure(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Frame-Options", "DENY");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'",
  );
  return new Response(response.body, { status: response.status, headers });
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return b64(
    new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(value))),
  );
}
async function same(a, b) {
  return (
    typeof a === "string" &&
    typeof b === "string" &&
    (await hash(a)) === (await hash(b))
  );
}
async function admin(req, env) {
  if (
    !env.SESSION_SECRET ||
    !env.COMPANY_ADMIN_TOKEN ||
    env.SESSION_SECRET.length < 32 ||
    env.COMPANY_ADMIN_TOKEN.length < 32
  )
    fail(503, "Company authentication is not configured");
  const cookie = req.headers
    .get("Cookie")
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("__Host-bioems="))
    ?.slice(14);
  if (!cookie) fail(401, "Sign in to the company portal");
  const [expires, nonce, signature] = cookie.split(".");
  if (
    !expires ||
    !nonce ||
    !signature ||
    Number(expires) <= Date.now() ||
    Number(expires) > Date.now() + SESSION_MS
  )
    fail(401, "Session expired");
  if (
    !(await same(
      signature,
      await sign(`${expires}.${nonce}`, env.SESSION_SECRET),
    ))
  )
    fail(401, "Invalid session");
}
function origin(req) {
  if (
    !["GET", "HEAD"].includes(req.method) &&
    req.headers.get("Origin") !== new URL(req.url).origin
  )
    fail(403, "Same-origin request required");
}
async function audit(env, action, target) {
  await env.DB.prepare("INSERT INTO audit VALUES (?,?,?,?)")
    .bind(crypto.randomUUID(), action, target, Date.now())
    .run();
}
async function site(req, env, id) {
  const record = await env.DB.prepare(
    "SELECT * FROM sites WHERE id=? AND revoked=0",
  )
    .bind(id)
    .first();
  const token = req.headers.get("Authorization")?.match(/^Bearer (\S+)$/)?.[1];
  if (!record || !token || !(await same(await hash(token), record.agent_hash)))
    fail(401, "Agent authentication failed");
  return record;
}
async function handle(req, env) {
  const url = new URL(req.url),
    path = url.pathname;
  if (path === "/api/company/login" && req.method === "POST") {
    origin(req);
    if (
      !env.SESSION_SECRET ||
      env.SESSION_SECRET.length < 32 ||
      !env.COMPANY_ADMIN_TOKEN ||
      env.COMPANY_ADMIN_TOKEN.length < 32
    )
      fail(503, "Company authentication is not configured");
    const bucket = `${req.headers.get("CF-Connecting-IP") || "unknown"}:${Math.floor(Date.now() / 600_000)}`;
    const attempt = await env.DB.prepare(
      "INSERT INTO login_attempts VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET attempts=attempts+1 RETURNING attempts",
    )
      .bind(bucket, Date.now() + 600_000)
      .first();
    if (attempt.attempts > 10) fail(429, "Too many login attempts");
    const data = await body(req);
    if (!(await same(data.token, env.COMPANY_ADMIN_TOKEN)))
      fail(401, "Invalid company access key");
    const value = `${Date.now() + SESSION_MS}.${crypto.randomUUID()}`;
    const response = json({ ok: true });
    response.headers.set(
      "Set-Cookie",
      `__Host-bioems=${value}.${await sign(value, env.SESSION_SECRET)}; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=1800`,
    );
    return response;
  }
  const agent = path.match(
    /^\/api\/agent\/([a-zA-Z0-9-]{1,64})\/(heartbeat|claim|result)$/,
  );
  if (agent) {
    if (req.method !== "POST") fail(405, "POST required");
    const record = await site(req, env, agent[1]);
    const data = await body(req);
    if (agent[2] === "heartbeat") {
      if (
        !data.publicKey ||
        typeof data.publicKey !== "object" ||
        data.publicKey.kty !== "RSA" ||
        data.publicKey.e !== "AQAB" ||
        typeof data.publicKey.n !== "string" ||
        !/^[a-zA-Z0-9_-]{342}$/.test(data.publicKey.n) ||
        data.publicKey.d
      )
        fail(400, "RSA public key required");
      const publicKey = JSON.stringify({
        kty: "RSA",
        n: data.publicKey.n,
        e: "AQAB",
        alg: "RSA-OAEP-256",
        ext: true,
      });
      if (record.public_key && record.public_key !== publicKey)
        fail(409, "Agent key changed; enroll a new site connection");
      const heartbeat = {
        status: ["UP", "DOWN"].includes(data.status) ? data.status : "DOWN",
        version: text(data.version, 40),
        uptime: integer(data.uptime, 0, 1e12),
        remoteControl: data.remoteControl === true,
      };
      heartbeat.summary = data.summary
        ? Object.fromEntries(
            [
              "sensorCount",
              "deviceCount",
              "offlineDevices",
              "activeAlarms",
              "unacknowledgedAlarms",
            ].map((key) => [key, integer(data.summary[key], 0, 1e9)]),
          )
        : null;
      await env.DB.prepare(
        "UPDATE sites SET public_key=?,heartbeat=?,last_seen=? WHERE id=?",
      )
        .bind(publicKey, JSON.stringify(heartbeat), Date.now(), record.id)
        .run();
      const licenses = await env.DB.prepare(
        "SELECT id,starts_at,expires_at,sensor_limit,device_limit,status FROM licenses WHERE site_id=? ORDER BY created_at DESC,id DESC LIMIT 1000",
      )
        .bind(record.id)
        .all();
      return json({
        ok: true,
        licenseSnapshot: {
          siteId: record.id,
          enforcement: false,
          licenses: licenses.results,
        },
      });
    }
    if (agent[2] === "claim") {
      // Atomic claim; a command is never retried after claim. A lost response is indeterminate.
      const job = await env.DB.prepare(
        "UPDATE jobs SET state='claimed' WHERE id=(SELECT id FROM jobs WHERE site_id=? AND state='queued' AND expires_at>? ORDER BY created_at LIMIT 1) AND state='queued' RETURNING id,envelope,expires_at",
      )
        .bind(record.id, Date.now())
        .first();
      return json({ job: job || null });
    }
    if (
      !idPattern.test(data.id) ||
      !data.result ||
      typeof data.result.iv !== "string" ||
      typeof data.result.ciphertext !== "string"
    )
      fail(400, "Invalid result");
    const result = await env.DB.prepare(
      "UPDATE jobs SET result=?,state='completed' WHERE id=? AND site_id=? AND state='claimed' AND expires_at>? RETURNING id",
    )
      .bind(JSON.stringify(data.result), data.id, record.id, Date.now())
      .first();
    if (!result) fail(409, "Command is expired or already completed");
    await audit(env, "remote.completed", data.id);
    return json({ ok: true });
  }
  if (path.startsWith("/api/company/")) {
    await admin(req, env);
    origin(req);
    if (path === "/api/company/logout" && req.method === "POST") {
      const response = json({ ok: true });
      response.headers.set(
        "Set-Cookie",
        "__Host-bioems=; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
      );
      return response;
    }
    if (path === "/api/company/overview" && req.method === "GET") {
      const [customers, sites, licenses, events] = await Promise.all([
        env.DB.prepare(
          "SELECT * FROM customers ORDER BY created_at DESC LIMIT 1000",
        ).all(),
        env.DB.prepare(
          "SELECT id,customer_id,name,public_key,heartbeat,last_seen,revoked FROM sites ORDER BY name LIMIT 1000",
        ).all(),
        env.DB.prepare(
          "SELECT * FROM licenses ORDER BY created_at DESC LIMIT 1000",
        ).all(),
        env.DB.prepare(
          "SELECT * FROM audit ORDER BY created_at DESC LIMIT 100",
        ).all(),
      ]);
      return json({
        customers: customers.results,
        sites: sites.results.map((s) => ({
          ...s,
          public_key: s.public_key ? JSON.parse(s.public_key) : null,
          heartbeat: s.heartbeat ? JSON.parse(s.heartbeat) : null,
          connection: s.revoked
            ? "revoked"
            : !s.last_seen
              ? "pending"
              : Date.now() - s.last_seen < 180_000
                ? "online"
                : "offline",
        })),
        licenses: licenses.results.map((l) => ({
          ...l,
          effective_status:
            l.expires_at < Date.now()
              ? "expired"
              : l.starts_at > Date.now()
                ? "scheduled"
                : l.status,
        })),
        audit: events.results,
        licenseEnforcement: false,
      });
    }
    if (path === "/api/company/customers" && req.method === "POST") {
      const data = await body(req),
        id = crypto.randomUUID();
      await env.DB.prepare("INSERT INTO customers VALUES (?,?,?)")
        .bind(id, text(data.name), Date.now())
        .run();
      await audit(env, "customer.created", id);
      return json({ id }, 201);
    }
    if (path === "/api/company/sites" && req.method === "POST") {
      const data = await body(req),
        id = crypto.randomUUID();
      if (
        !idPattern.test(data.customerId) ||
        !(await env.DB.prepare("SELECT id FROM customers WHERE id=?")
          .bind(data.customerId)
          .first())
      )
        fail(400, "Unknown customer");
      const token = b64(crypto.getRandomValues(new Uint8Array(32)));
      await env.DB.prepare(
        "INSERT INTO sites(id,customer_id,name,agent_hash) VALUES (?,?,?,?)",
      )
        .bind(id, data.customerId, text(data.name), await hash(token))
        .run();
      await audit(env, "site.created", id);
      return json({ id, token }, 201);
    }
    const revoke = path.match(
      /^\/api\/company\/sites\/([a-zA-Z0-9-]{1,64})\/revoke$/,
    );
    if (revoke && req.method === "POST") {
      const updated = await env.DB.prepare(
        "UPDATE sites SET revoked=1 WHERE id=? RETURNING id",
      )
        .bind(revoke[1])
        .first();
      if (!updated) fail(404, "Unknown site");
      await env.DB.prepare(
        "UPDATE jobs SET state='expired',envelope='',result=NULL WHERE site_id=? AND state IN ('queued','claimed')",
      )
        .bind(revoke[1])
        .run();
      await audit(env, "site.revoked", revoke[1]);
      return json({ ok: true });
    }
    if (path === "/api/company/licenses" && req.method === "POST") {
      const data = await body(req),
        id = crypto.randomUUID();
      if (
        !idPattern.test(data.siteId) ||
        !(await env.DB.prepare("SELECT id FROM sites WHERE id=? AND revoked=0")
          .bind(data.siteId)
          .first())
      )
        fail(400, "Unknown site");
      const start = integer(data.startsAt, 0, 9e15),
        end = integer(data.expiresAt, start + 1, 9e15);
      if (!["trial", "active", "suspended"].includes(data.status))
        fail(400, "Invalid license status");
      await env.DB.prepare("INSERT INTO licenses VALUES (?,?,?,?,?,?,?,?)")
        .bind(
          id,
          data.siteId,
          start,
          end,
          integer(data.sensorLimit, 1, 10000),
          integer(data.deviceLimit, 1, 10000),
          data.status,
          Date.now(),
        )
        .run();
      await audit(env, "license.created", id);
      return json({ id }, 201);
    }
    const license = path.match(
      /^\/api\/company\/licenses\/([a-zA-Z0-9-]{1,64})$/,
    );
    if (license && req.method === "PATCH") {
      const data = await body(req);
      const current = await env.DB.prepare("SELECT * FROM licenses WHERE id=?")
        .bind(license[1])
        .first();
      if (!current) fail(404, "Unknown license");
      if (!["trial", "active", "suspended"].includes(data.status))
        fail(400, "Invalid status");
      await env.DB.prepare(
        "UPDATE licenses SET expires_at=?,status=?,sensor_limit=?,device_limit=? WHERE id=?",
      )
        .bind(
          integer(data.expiresAt, current.starts_at + 1, 9e15),
          data.status,
          integer(data.sensorLimit, 1, 10000),
          integer(data.deviceLimit, 1, 10000),
          license[1],
        )
        .run();
      await audit(env, "license.updated", license[1]);
      return json({ ok: true });
    }
    const command = path.match(
      /^\/api\/company\/sites\/([a-zA-Z0-9-]{1,64})\/commands$/,
    );
    if (command && req.method === "POST") {
      const record = await env.DB.prepare(
        "SELECT heartbeat,last_seen,public_key FROM sites WHERE id=? AND revoked=0",
      )
        .bind(command[1])
        .first();
      if (
        !record ||
        !record.public_key ||
        Date.now() - record.last_seen > 180_000 ||
        !JSON.parse(record.heartbeat).remoteControl
      )
        fail(409, "Site is offline or remote control is disabled");
      const data = await body(req);
      if (
        !idPattern.test(data.id) ||
        !data.envelope ||
        typeof data.envelope.key !== "string" ||
        typeof data.envelope.iv !== "string" ||
        typeof data.envelope.ciphertext !== "string"
      )
        fail(400, "Invalid encrypted command");
      const pending = await env.DB.prepare(
        "SELECT count(*) AS n FROM jobs WHERE site_id=? AND state IN ('queued','claimed') AND expires_at>?",
      )
        .bind(command[1], Date.now())
        .first();
      if (pending.n >= 20) fail(429, "Too many pending commands");
      const inserted = await env.DB.prepare(
        "INSERT INTO jobs VALUES (?,?,?,NULL,'queued',?,?) ON CONFLICT(id) DO NOTHING RETURNING id",
      )
        .bind(
          data.id,
          command[1],
          JSON.stringify(data.envelope),
          Date.now(),
          Date.now() + 120_000,
        )
        .first();
      if (!inserted) fail(409, "Command ID already used");
      await audit(env, "remote.queued", `${command[1]}:${data.id}`);
      return json({ id: data.id }, 202);
    }
    const job = path.match(
      /^\/api\/company\/sites\/([a-zA-Z0-9-]{1,64})\/commands\/([a-zA-Z0-9-]{1,64})$/,
    );
    if (job && req.method === "GET") {
      const record = await env.DB.prepare(
        "SELECT state,result,expires_at FROM jobs WHERE id=? AND site_id=?",
      )
        .bind(job[2], job[1])
        .first();
      if (!record) fail(404, "Unknown command");
      return json({
        state: record.expires_at < Date.now() ? "expired" : record.state,
        result: record.result ? JSON.parse(record.result) : null,
      });
    }
    fail(404, "Unknown company endpoint");
  }
  if (path.startsWith("/api/")) fail(404, "Unknown endpoint");
  if (!["GET", "HEAD"].includes(req.method)) fail(405, "Read only");
  if (path.startsWith("/system-owner") || path === "/login") {
    await admin(req, env);
    // Fetch the canonical asset path: /owner.html redirects to /owner under
    // Cloudflare HTML handling, which would change the browser router location.
    return env.ASSETS.fetch(new Request(new URL("/owner", req.url), req));
  }
  return env.ASSETS.fetch(req);
}
export default {
  async fetch(req, env) {
    try {
      return secure(await handle(req, env));
    } catch (error) {
      return secure(
        json(
          { error: error.status ? error.message : "Internal error" },
          error.status || 500,
        ),
      );
    }
  },
  async scheduled(_event, env) {
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE jobs SET state='expired',envelope='',result=NULL WHERE expires_at<?",
      ).bind(Date.now()),
      env.DB.prepare("DELETE FROM jobs WHERE created_at<?").bind(
        Date.now() - 86_400_000,
      ),
      env.DB.prepare("DELETE FROM login_attempts WHERE expires_at<?").bind(
        Date.now(),
      ),
      env.DB.prepare("DELETE FROM audit WHERE created_at<?").bind(
        Date.now() - 90 * 86_400_000,
      ),
    ]);
  },
};

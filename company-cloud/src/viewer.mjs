import webpush from "web-push";

const SESSION_MS = 8 * 60 * 60_000;
const SNAPSHOT_FRESH_MS = 180_000;
const READING_FRESH_MS = 300_000;
const MAX_SENSORS = 500;
const MAX_ROOMS = 250;
const MAX_ALARMS = 1000;
const PASSWORD_ITERATIONS = 100_000;
const encoder = new TextEncoder();
const error = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const base64 = (bytes) => btoa(String.fromCharCode(...bytes));
const decode = (value) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
const random = () => base64(crypto.getRandomValues(new Uint8Array(32)));
export async function digest(value) {
  return base64(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", encoder.encode(value)),
    ),
  );
}
export async function passwordHash(password, salt = random()) {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  )
    error(400, "Use a password of 12–128 characters");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: decode(salt),
      iterations: PASSWORD_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return `${salt}.${base64(new Uint8Array(bits))}`;
}
function text(value, max = 160) {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    error(400, "Invalid text");
  return value.trim();
}
function timestamp(value, nullable = false) {
  if (nullable && value === null) return null;
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d\d-\d\dT/.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    error(400, "Invalid timestamp");
  return new Date(value).toISOString();
}
function valueNumber(value) {
  if (value !== null && (typeof value !== "number" || !Number.isFinite(value)))
    error(400, "Invalid reading");
  return value;
}
export function validateSnapshot(data, now = Date.now()) {
  if (
    !data ||
    data.schemaVersion !== 1 ||
    typeof data.telemetryAvailable !== "boolean" ||
    !Array.isArray(data.rooms) ||
    !Array.isArray(data.sensors) ||
    !Array.isArray(data.alarms) ||
    data.rooms.length > MAX_ROOMS ||
    data.sensors.length > MAX_SENSORS ||
    data.alarms.length > MAX_ALARMS
  )
    error(400, "Invalid snapshot");
  const capturedAt = timestamp(data.capturedAt);
  if (Math.abs(now - Date.parse(capturedAt)) > SNAPSHOT_FRESH_MS)
    error(400, "Snapshot clock is out of range");
  const rooms = data.rooms.map((r) => ({
    id: text(r.id, 64),
    name: text(r.name),
    code: text(r.code, 64),
  }));
  const roomIds = new Set(rooms.map((r) => r.id));
  if (roomIds.size !== rooms.length) error(400, "Duplicate room");
  const sensors = data.sensors.map((s) => {
    const roomId = text(s.roomId, 64);
    if (!roomIds.has(roomId)) error(400, "Unknown room");
    const recordedAt = timestamp(s.recordedAt, true),
      value = valueNumber(s.value);
    if (
      (value === null) !== (recordedAt === null) ||
      (recordedAt && Date.parse(recordedAt) > now + SNAPSHOT_FRESH_MS)
    )
      error(400, "Invalid reading time");
    return {
      id: text(s.id, 64),
      roomId,
      name: text(s.name),
      code: text(s.code, 64),
      type: text(s.type, 64),
      unit:
        typeof s.unit === "string" && s.unit.length <= 24
          ? s.unit
          : error(400, "Invalid unit"),
      value,
      recordedAt,
    };
  });
  const sensorIds = new Map(sensors.map((s) => [s.id, s]));
  if (sensorIds.size !== sensors.length) error(400, "Duplicate sensor");
  const alarms = data.alarms.map((a) => {
    if (
      !sensorIds.has(a.sensorId) ||
      sensorIds.get(a.sensorId).roomId !== a.roomId ||
      !["TRIGGERED", "ACKNOWLEDGED", "RECOVERED"].includes(a.status)
    )
      error(400, "Invalid alarm");
    return {
      id: text(a.id, 160),
      sensorId: a.sensorId,
      roomId: a.roomId,
      type: text(a.type, 64),
      severity: text(a.severity, 32),
      status: a.status,
      value: valueNumber(a.value),
      triggeredAt: timestamp(a.triggeredAt),
      recoveredAt: timestamp(a.recoveredAt, true),
    };
  });
  if (new Set(alarms.map((a) => a.id)).size !== alarms.length)
    error(400, "Duplicate alarm");
  return {
    schemaVersion: 1,
    capturedAt,
    telemetryAvailable: data.telemetryAvailable,
    rooms,
    sensors,
    alarms,
  };
}
export async function saveSnapshot(env, site, data) {
  const snapshot = validateSnapshot(data),
    now = Date.now();
  const previous = await env.DB.prepare(
    "SELECT received_at,payload FROM viewer_snapshots WHERE site_id=?",
  )
    .bind(site.id)
    .first();
  if (
    previous &&
    Date.parse(JSON.parse(previous.payload).capturedAt) >
      Date.parse(snapshot.capturedAt)
  )
    error(409, "Older snapshot");
  // Sanitized fields only. Never persist arbitrary agent payloads.
  await env.DB.prepare(
    "INSERT INTO viewer_snapshots VALUES (?,?,?) ON CONFLICT(site_id) DO UPDATE SET payload=excluded.payload,received_at=excluded.received_at WHERE json_extract(excluded.payload,'$.capturedAt') >= json_extract(viewer_snapshots.payload,'$.capturedAt')",
  )
    .bind(site.id, JSON.stringify(snapshot), now)
    .run();
  const subscriptions = await env.DB.prepare(
    "SELECT p.id,p.created_at FROM viewer_subscriptions p JOIN viewer_users u ON u.id=p.user_id WHERE u.customer_id=? AND u.disabled=0",
  )
    .bind(site.customer_id)
    .all();
  // Recovered events in the last day also capture alarms shorter than the export interval.
  const fresh = snapshot.alarms.filter(
    (a) => now - Date.parse(a.triggeredAt) < 86_400_000,
  );
  // Idempotent inserts on every snapshot heal interrupted enqueue attempts. Never
  // replay alarms that predate a newly subscribed device (30s clock allowance).
  const jobs = fresh.flatMap((a) =>
    subscriptions.results
      .filter((s) => Date.parse(a.triggeredAt) >= s.created_at - 30_000)
      .map((s) =>
        env.DB.prepare(
          "INSERT OR IGNORE INTO viewer_push_jobs(id,site_id,subscription_id,alarm_key,next_at,created_at) VALUES (?,?,?,?,?,?)",
        ).bind(crypto.randomUUID(), site.id, s.id, a.id, now, now),
      ),
  );
  for (let i = 0; i < jobs.length; i += 50)
    await env.DB.batch(jobs.slice(i, i + 50));
  return json({ ok: true });
}
export async function companyViewer(req, env, path, body, audit) {
  if (path === "/api/company/viewers" && req.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT id,customer_id,username,name,disabled,created_at FROM viewer_users ORDER BY created_at DESC LIMIT 1000",
    ).all();
    return json({ users: rows.results });
  }
  if (path === "/api/company/viewers" && req.method === "POST") {
    const data = await body(req),
      username = text(data.username, 100).toLowerCase();
    if (!/^[a-z0-9][a-z0-9._@-]{2,99}$/.test(username))
      error(400, "Invalid username");
    if (
      !(await env.DB.prepare("SELECT id FROM customers WHERE id=?")
        .bind(text(data.customerId, 64))
        .first())
    )
      error(400, "Unknown customer");
    if (
      await env.DB.prepare("SELECT id FROM viewer_users WHERE username=?")
        .bind(username)
        .first()
    )
      error(409, "Username already exists");
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO viewer_users(id,customer_id,username,name,password_hash,created_at) VALUES (?,?,?,?,?,?)",
    )
      .bind(
        id,
        data.customerId,
        username,
        text(data.name),
        await passwordHash(data.password),
        Date.now(),
      )
      .run();
    await audit(env, "viewer.created", id);
    return json({ id, role: "VIEWER" }, 201);
  }
  const user = path.match(/^\/api\/company\/viewers\/([a-zA-Z0-9-]{1,64})$/);
  if (user && req.method === "PATCH") {
    const data = await body(req);
    if (
      !(await env.DB.prepare("SELECT id FROM viewer_users WHERE id=?")
        .bind(user[1])
        .first())
    )
      error(404, "Unknown viewer");
    if (typeof data.disabled !== "boolean")
      error(400, "Disabled flag required");
    const updates = [
      env.DB.prepare("UPDATE viewer_users SET disabled=? WHERE id=?").bind(
        data.disabled ? 1 : 0,
        user[1],
      ),
      env.DB.prepare("DELETE FROM viewer_sessions WHERE user_id=?").bind(
        user[1],
      ),
      env.DB.prepare("DELETE FROM viewer_subscriptions WHERE user_id=?").bind(
        user[1],
      ),
    ];
    if (data.password !== undefined)
      updates.push(
        env.DB.prepare(
          "UPDATE viewer_users SET password_hash=? WHERE id=?",
        ).bind(await passwordHash(data.password), user[1]),
      );
    await env.DB.batch(updates);
    await audit(env, "viewer.updated", user[1]);
    return json({ ok: true });
  }
  return null;
}
function mobileToken(req) {
  const header = req.headers.get("Authorization") || "";
  return /^Bearer mobile\.[A-Za-z0-9+/=]{44}$/.test(header)
    ? header.slice(7)
    : null;
}
async function viewer(req, env, mobile = false) {
  const token = mobile
    ? mobileToken(req)
    : req.headers
        .get("Cookie")
        ?.split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("__Host-bioems-viewer="))
        ?.slice(21);
  if (!token || (!mobile && token.startsWith("mobile.")))
    error(401, "Viewer login required");
  const user = await env.DB.prepare(
    "SELECT u.id,u.customer_id,u.name,u.username,c.name AS customer_name FROM viewer_sessions s JOIN viewer_users u ON u.id=s.user_id JOIN customers c ON c.id=u.customer_id WHERE s.token_hash=? AND s.expires_at>? AND u.disabled=0",
  )
    .bind(await digest(token), Date.now())
    .first();
  if (!user) error(401, "Viewer session expired");
  return user;
}
const cookie = (token, seconds) =>
  `__Host-bioems-viewer=${token}; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=${seconds}`;
export async function viewerRoutes(req, env, path, body, origin) {
  const mobile = path.startsWith("/api/mobile/viewer/");
  if (!mobile && !path.startsWith("/api/viewer/")) return null;
  // Native clients use bearer sessions only, never cookies. Browser writes retain
  // same-origin protection; native clients do not send a browser Origin header.
  if (!mobile || req.headers.has("Origin")) origin(req);
  if (mobile) {
    path = path.replace("/api/mobile/viewer/", "/api/viewer/");
    if (
      ![
        "/api/viewer/login",
        "/api/viewer/logout",
        "/api/viewer/overview",
      ].includes(path)
    )
      error(405, "Mobile viewer access is read only");
  }
  if (path === "/api/viewer/login" && req.method === "POST") {
    const ip = req.headers.get("CF-Connecting-IP") || "unknown",
      now = Date.now();
    const bucket = `viewer:${ip}:${Math.floor(now / 600_000)}`;
    const attempts = await env.DB.prepare(
      "INSERT INTO login_attempts VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET attempts=attempts+1 RETURNING attempts",
    )
      .bind(bucket, now + 600_000)
      .first();
    if (attempts.attempts > 10)
      error(429, "Too many attempts; try again later");
    const data = await body(req),
      username = text(data.username, 100).toLowerCase();
    const user = await env.DB.prepare(
      "SELECT id,password_hash,disabled FROM viewer_users WHERE username=?",
    )
      .bind(username)
      .first();
    // Same expensive KDF even for unknown usernames. Password never leaves this request.
    const stored =
      user?.password_hash || `${base64(new Uint8Array(32))}.invalid`;
    const supplied = await passwordHash(data.password, stored.split(".")[0]);
    if (
      !user ||
      user.disabled ||
      (await digest(supplied)) !== (await digest(stored))
    )
      error(401, "Invalid username or password");
    const token = mobile ? `mobile.${random()}` : random();
    await env.DB.prepare("INSERT INTO viewer_sessions VALUES (?,?,?)")
      .bind(await digest(token), user.id, now + SESSION_MS)
      .run();
    if (mobile)
      return json({ token, expiresAt: now + SESSION_MS, role: "VIEWER" });
    return new Response('{"ok":true}', {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookie(token, SESSION_MS / 1000),
      },
    });
  }
  const user = await viewer(req, env, mobile);
  if (path === "/api/viewer/logout" && req.method === "POST" && mobile) {
    await env.DB.prepare("DELETE FROM viewer_sessions WHERE token_hash=?")
      .bind(await digest(mobileToken(req)))
      .run();
    return json({ ok: true });
  }
  if (path === "/api/viewer/logout" && req.method === "POST") {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM viewer_sessions WHERE user_id=?").bind(
        user.id,
      ),
      env.DB.prepare("DELETE FROM viewer_subscriptions WHERE user_id=?").bind(
        user.id,
      ),
    ]);
    return new Response('{"ok":true}', {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookie("", 0),
      },
    });
  }
  if (path === "/api/viewer/overview" && req.method === "GET") {
    const sites = await env.DB.prepare(
      "SELECT s.id,s.name,v.payload,v.received_at FROM sites s LEFT JOIN viewer_snapshots v ON v.site_id=s.id WHERE s.customer_id=? AND s.revoked=0 ORDER BY s.name LIMIT 1000",
    )
      .bind(user.customer_id)
      .all();
    return json({
      role: "VIEWER",
      name: user.name,
      customerName: user.customer_name,
      serverTime: Date.now(),
      snapshotFreshMs: SNAPSHOT_FRESH_MS,
      readingFreshMs: READING_FRESH_MS,
      sites: sites.results.map((s) => ({
        id: s.id,
        name: s.name,
        receivedAt: s.received_at,
        snapshot: s.payload ? JSON.parse(s.payload) : null,
      })),
      pushAvailable: !!(
        env.VAPID_PUBLIC_KEY &&
        env.VAPID_PRIVATE_KEY &&
        env.VAPID_SUBJECT
      ),
      vapidPublicKey: env.VAPID_PUBLIC_KEY || null,
    });
  }
  if (
    path === "/api/viewer/subscriptions" &&
    ["POST", "DELETE"].includes(req.method)
  ) {
    const data = await body(req);
    if (req.method === "DELETE") {
      await env.DB.prepare(
        "DELETE FROM viewer_subscriptions WHERE user_id=? AND endpoint=?",
      )
        .bind(user.id, text(data.endpoint, 2048))
        .run();
      return json({ ok: true });
    }
    if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT)
      error(503, "Push is not configured");
    const subscription = validateSubscription(data);
    const existing = await env.DB.prepare(
      "SELECT user_id FROM viewer_subscriptions WHERE endpoint=?",
    )
      .bind(subscription.endpoint)
      .first();
    if (existing && existing.user_id !== user.id)
      error(409, "Unsubscribe this device from its previous account first");
    const count = await env.DB.prepare(
      "SELECT count(*) AS n FROM viewer_subscriptions WHERE user_id=?",
    )
      .bind(user.id)
      .first();
    if (!existing && count.n >= 10) error(429, "Device limit reached");
    await env.DB.prepare(
      "INSERT INTO viewer_subscriptions VALUES (?,?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET subscription=excluded.subscription",
    )
      .bind(
        crypto.randomUUID(),
        user.id,
        subscription.endpoint,
        JSON.stringify(subscription),
        Date.now(),
      )
      .run();
    return json({ ok: true }, 201);
  }
  error(405, "Viewer access is read only");
}
export function validateSubscription(data) {
  const endpoint = text(data.endpoint, 2048);
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    error(400, "Invalid push endpoint");
  }
  const allowed = [
    "fcm.googleapis.com",
    "updates.push.services.mozilla.com",
    "web.push.apple.com",
    "wns.windows.com",
    "notify.windows.com",
  ];
  if (
    url.protocol !== "https:" ||
    url.port ||
    url.username ||
    url.password ||
    url.hash ||
    !allowed.some(
      (h) =>
        url.hostname === h ||
        (["wns.windows.com", "notify.windows.com"].includes(h) &&
          url.hostname.endsWith(`.${h}`)),
    )
  )
    error(400, "Unsupported push provider");
  if (
    !data.keys ||
    !/^[\w-]{87}$/.test(data.keys.p256dh) ||
    !/^[\w-]{22}$/.test(data.keys.auth)
  )
    error(400, "Invalid push encryption keys");
  return {
    endpoint,
    expirationTime: null,
    keys: { p256dh: data.keys.p256dh, auth: data.keys.auth },
  };
}
export async function deliverPush(env) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT)
    return;
  const now = Date.now();
  const jobs = await env.DB.prepare(
    "SELECT j.*,p.subscription FROM viewer_push_jobs j JOIN viewer_subscriptions p ON p.id=j.subscription_id JOIN viewer_users u ON u.id=p.user_id JOIN sites s ON s.id=j.site_id WHERE j.state='pending' AND j.next_at<=? AND j.created_at>? AND u.disabled=0 AND s.revoked=0 AND s.customer_id=u.customer_id ORDER BY j.created_at LIMIT 20",
  )
    .bind(now, now - 86_400_000)
    .all();
  for (const job of jobs.results) {
    const claimed = await env.DB.prepare(
      "UPDATE viewer_push_jobs SET next_at=? WHERE id=? AND state='pending' AND next_at<=? RETURNING id",
    )
      .bind(now + 120_000, job.id, now)
      .first();
    if (!claimed) continue;
    try {
      const subscription = validateSubscription(JSON.parse(job.subscription));
      const details = webpush.generateRequestDetails(
        subscription,
        JSON.stringify({
          title: "BIO-EMS",
          body: "New monitoring alarm · إنذار مراقبة جديد",
          url: `/viewer/?site=${encodeURIComponent(job.site_id)}#alarms`,
          tag: `${job.site_id}:${job.alarm_key}`,
        }),
        {
          TTL: 3600,
          urgency: "high",
          vapidDetails: {
            subject: env.VAPID_SUBJECT,
            publicKey: env.VAPID_PUBLIC_KEY,
            privateKey: env.VAPID_PRIVATE_KEY,
          },
        },
      );
      const response = await fetch(details.endpoint, {
        method: "POST",
        headers: details.headers,
        body: details.body,
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
      });
      if ([404, 410].includes(response.status)) {
        await env.DB.prepare("DELETE FROM viewer_subscriptions WHERE id=?")
          .bind(job.subscription_id)
          .run();
      } else if (response.ok) {
        await env.DB.prepare(
          "UPDATE viewer_push_jobs SET state='sent',attempts=attempts+1 WHERE id=?",
        )
          .bind(job.id)
          .run();
      } else throw new Error("Push delivery rejected");
    } catch {
      const attempts = job.attempts + 1;
      await env.DB.prepare(
        "UPDATE viewer_push_jobs SET attempts=?,state=?,next_at=? WHERE id=?",
      )
        .bind(
          attempts,
          attempts >= 5 ? "failed" : "pending",
          Date.now() + Math.min(3600_000, 60_000 * 2 ** attempts),
          job.id,
        )
        .run();
    }
  }
}

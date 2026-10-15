const PAGE_SIZE = 5;
function invalid(message) {
  throw Object.assign(new Error(message), { status: 400 });
}
export async function auditPage(env, cursor) {
  let at, id;
  if (cursor) {
    if (cursor.length > 300) invalid("Invalid audit cursor");
    try {
      ({ at, id } = JSON.parse(atob(cursor)));
    } catch {
      invalid("Invalid audit cursor");
    }
    if (
      !Number.isSafeInteger(at) ||
      at < 0 ||
      typeof id !== "string" ||
      !/^[a-zA-Z0-9-]{1,64}$/.test(id)
    )
      invalid("Invalid audit cursor");
  }
  const statement = cursor
    ? env.DB.prepare(
        "SELECT * FROM audit WHERE created_at<? OR (created_at=? AND id<?) ORDER BY created_at DESC,id DESC LIMIT 6",
      ).bind(at, at, id)
    : env.DB.prepare(
        "SELECT * FROM audit ORDER BY created_at DESC,id DESC LIMIT 6",
      );
  const { results } = await statement.all();
  const records = results.slice(0, PAGE_SIZE),
    last = records.at(-1);
  return {
    records,
    nextCursor:
      results.length > PAGE_SIZE
        ? btoa(JSON.stringify({ at: last.created_at, id: last.id }))
        : null,
  };
}
export function auditRange(data) {
  const { from, to } = data || {};
  if (
    !Number.isSafeInteger(from) ||
    !Number.isSafeInteger(to) ||
    from < 0 ||
    to <= from ||
    to > 8640000000000000
  )
    invalid("Invalid audit date range");
  return { from, to };
}
export async function managementRoutes(req, env, path, body, json, fail) {
  const url = new URL(req.url);
  if (path === "/api/company/audit" && req.method === "GET")
    return json(await auditPage(env, url.searchParams.get("cursor")));
  if (path === "/api/company/audit/preview" && req.method === "POST") {
    const range = auditRange(await body(req));
    // Freeze the upper bound so later events are outside this deletion request.
    range.to = Math.min(range.to, Date.now());
    if (range.to <= range.from) invalid("Date range has no elapsed time");
    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM audit WHERE created_at>=? AND created_at<?",
    )
      .bind(range.from, range.to)
      .first();
    return json({ ...range, count: row.count });
  }
  if (path === "/api/company/audit" && req.method === "DELETE") {
    const data = await body(req),
      { from, to } = auditRange(data);
    if (data.confirm !== "delete-audit-range" || to > Date.now())
      invalid("Deletion confirmation required");
    const result = await env.DB.batch([
      env.DB.prepare(
        "DELETE FROM audit WHERE created_at>=? AND created_at<?",
      ).bind(from, to),
      env.DB.prepare("INSERT INTO audit VALUES (?,?,?,?)").bind(
        crypto.randomUUID(),
        "audit.deleted",
        JSON.stringify({ from, to }),
        Date.now(),
      ),
    ]);
    return json({
      ok: true,
      deleted: result[0].meta?.changes ?? result[0].changes ?? 0,
    });
  }
  const match = path.match(/^\/api\/company\/customers\/([a-zA-Z0-9-]{1,64})$/);
  if (match && req.method === "DELETE") {
    const customer = await env.DB.prepare("SELECT * FROM customers WHERE id=?")
      .bind(match[1])
      .first();
    if (!customer) fail(404, "Unknown customer");
    const data = await body(req);
    if (data.confirmName !== customer.name)
      invalid("Customer name confirmation required");
    if (
      await env.DB.prepare("SELECT id FROM sites WHERE customer_id=? LIMIT 1")
        .bind(customer.id)
        .first()
    )
      fail(409, "CUSTOMER_HAS_SITES");
    // D1 batch is transactional. FK restrictions also prevent a concurrent site
    // enrollment from leaving viewer accounts deleted while the customer survives.
    await env.DB.batch([
      env.DB.prepare("DELETE FROM viewer_users WHERE customer_id=?").bind(
        customer.id,
      ),
      env.DB.prepare("DELETE FROM customers WHERE id=?").bind(customer.id),
      env.DB.prepare("INSERT INTO audit VALUES (?,?,?,?)").bind(
        crypto.randomUUID(),
        "customer.deleted",
        customer.id,
        Date.now(),
      ),
    ]);
    return json({ ok: true });
  }
  return null;
}

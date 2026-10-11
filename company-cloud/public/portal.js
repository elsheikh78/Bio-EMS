const $ = (id) => document.getElementById(id);
let state, enrollment;
const names = {
  online: "متصل",
  offline: "غير متصل",
  pending: "بانتظار الربط",
  revoked: "تم إلغاء الربط",
  trial: "تجريبية",
  active: "سارية",
  suspended: "معلقة",
  expired: "منتهية",
  scheduled: "لم تبدأ",
};
const date = (value) => new Date(value).toLocaleString("ar-EG");
const dateInput = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
function notice(message) {
  $("notice").textContent = message;
}
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
async function api(path, method = "GET", data) {
  const response = await fetch(`/api/company/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  let body;
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  if (!response.ok) {
    if (response.status === 401) {
      $("dashboard").hidden = true;
      $("login").hidden = false;
      $("logout").hidden = true;
    }
    throw new Error(body.error || `HTTP ${response.status}`);
  }
  return body;
}
async function action(fn) {
  try {
    notice("جارٍ التنفيذ…");
    await fn();
    notice("");
  } catch (error) {
    notice(error.message);
  }
}
function options(select, rows, label) {
  select.replaceChildren();
  const empty = element("option", "اختر…");
  empty.value = "";
  select.append(empty);
  for (const row of rows) {
    const option = element("option", label(row));
    option.value = row.id;
    select.append(option);
  }
}
async function refresh() {
  state = await api("overview");
  $("login").hidden = true;
  $("dashboard").hidden = false;
  $("logout").hidden = false;
  $("customer-count").textContent = state.customers.length;
  $("online-count").textContent = state.sites.filter(
    (s) => s.connection === "online",
  ).length;
  $("offline-count").textContent = state.sites.filter(
    (s) => s.connection === "offline",
  ).length;
  $("expiring-count").textContent = state.licenses.filter(
    (l) =>
      l.expires_at > Date.now() &&
      l.expires_at < Date.now() + 30 * 86400000 &&
      l.status !== "suspended",
  ).length;
  options($("customer-select"), state.customers, (c) => c.name);
  if (!$("license-form").elements.id.value)
    options(
      $("site-select"),
      state.sites.filter((s) => !s.revoked),
      (s) =>
        `${state.customers.find((c) => c.id === s.customer_id)?.name} / ${s.name}`,
    );
  $("sites").replaceChildren();
  if (!state.sites.length)
    $("sites").append(element("p", "أضف العميل ثم الموقع لإنشاء أول اتصال."));
  for (const site of state.sites) {
    const card = element("article", undefined, "site");
    card.append(
      element("span", names[site.connection], `badge ${site.connection}`),
      element("h3", site.name),
      element(
        "p",
        state.customers.find((c) => c.id === site.customer_id)?.name || "",
      ),
      element(
        "small",
        site.last_seen
          ? `آخر اتصال: ${date(site.last_seen)} • الإصدار ${site.heartbeat?.version || "—"}`
          : "لم يتصل جهاز العميل بعد",
      ),
    );
    const summary = site.heartbeat?.summary;
    card.append(
      element(
        "small",
        summary
          ? `آخر ملخص: ${summary.sensorCount} حساس مفعّل • ${summary.deviceCount} جهاز • ${summary.offlineDevices} جهاز منقطع/لم يتصل • ${summary.activeAlarms} إنذار قائم (${summary.unacknowledgedAlarms} لم يتم الإقرار به)`
          : "ملخص الحساسات والإنذارات غير متاح بعد",
      ),
    );
    const open = element("button", "فتح System Owner");
    open.disabled =
      site.connection !== "online" || !site.heartbeat?.remoteControl;
    open.onclick = () => {
      sessionStorage.removeItem("bioems.platform.session.v1");
      sessionStorage.setItem(
        "bioems.company.selected-site",
        JSON.stringify({ id: site.id, publicKey: site.public_key }),
      );
      location.assign("/system-owner/login");
    };
    card.append(open);
    const revoke = element("button", "إلغاء الربط", "secondary");
    revoke.disabled = !!site.revoked;
    revoke.onclick = () => {
      if (
        confirm(
          "إلغاء اتصال هذا الموقع بمنصة الشركة؟ المراقبة المحلية ستظل تعمل.",
        )
      )
        void action(async () => {
          await api(`sites/${site.id}/revoke`, "POST", {});
          await refresh();
        });
    };
    card.append(revoke);
    $("sites").append(card);
  }
  $("licenses").replaceChildren();
  for (const license of state.licenses) {
    const row = element("tr");
    const site = state.sites.find((s) => s.id === license.site_id);
    for (const text of [
      site?.name || license.site_id,
      names[license.effective_status],
      date(license.expires_at),
      `${license.sensor_limit} / ${license.device_limit}`,
    ])
      row.append(element("td", text));
    const cell = element("td");
    const button = element("button", "تجديد / تعديل", "secondary");
    button.onclick = () => {
      const form = $("license-form");
      options($("site-select"), state.sites, (s) => s.name);
      form.elements.id.value = license.id;
      form.elements.siteId.value = license.site_id;
      form.elements.siteId.disabled = true;
      form.elements.startsAt.value = dateInput(license.starts_at);
      form.elements.startsAt.disabled = true;
      form.elements.expiresAt.value = dateInput(license.expires_at);
      form.elements.sensorLimit.value = license.sensor_limit;
      form.elements.deviceLimit.value = license.device_limit;
      form.elements.status.value = license.status;
      $("license-title").textContent = `تجديد / تعديل رخصة ${site?.name || ""}`;
      form.scrollIntoView({ behavior: "smooth" });
    };
    cell.append(button);
    row.append(cell);
    $("licenses").append(row);
  }
  $("audit").replaceChildren();
  const actions = {
    "customer.created": "إضافة عميل",
    "site.created": "إضافة موقع",
    "site.revoked": "إلغاء الربط",
    "license.created": "إصدار رخصة",
    "license.updated": "تعديل رخصة",
    "remote.queued": "طلب عملية عن بُعد",
    "remote.completed": "وصول نتيجة عملية",
  };
  for (const record of state.audit)
    $("audit").append(
      element(
        "div",
        `${date(record.created_at)} — ${actions[record.action] || record.action} — ${record.target}`,
        "audit-row",
      ),
    );
}
$("login-form").onsubmit = (event) => {
  event.preventDefault();
  void action(async () => {
    const form = event.target;
    await api("login", "POST", { token: form.elements.token.value });
    form.reset();
    await refresh();
  });
};
$("logout").onclick = () =>
  void action(async () => {
    await api("logout", "POST", {});
    sessionStorage.removeItem("bioems.company.selected-site");
    sessionStorage.removeItem("bioems.platform.session.v1");
    state = null;
    $("enrollment").hidden = true;
    enrollment = null;
    $("dashboard").hidden = true;
    $("login").hidden = false;
    $("logout").hidden = true;
  });
$("refresh").onclick = () => void action(refresh);
$("customer-form").onsubmit = (event) => {
  event.preventDefault();
  void action(async () => {
    await api("customers", "POST", { name: event.target.elements.name.value });
    event.target.reset();
    await refresh();
  });
};
$("site-form").onsubmit = (event) => {
  event.preventDefault();
  void action(async () => {
    const form = event.target;
    const result = await api("sites", "POST", {
      customerId: form.elements.customerId.value,
      name: form.elements.name.value,
    });
    enrollment = {
      url: location.origin,
      siteId: result.id,
      token: result.token,
    };
    $("enrollment-data").textContent = JSON.stringify(enrollment, null, 2);
    $("enrollment").hidden = false;
    form.reset();
    await refresh();
  });
};
$("copy-enrollment").onclick = () =>
  void action(() =>
    navigator.clipboard.writeText(JSON.stringify(enrollment, null, 2)),
  );
function resetLicense() {
  const form = $("license-form");
  form.reset();
  form.elements.id.value = "";
  form.elements.siteId.disabled = false;
  form.elements.startsAt.disabled = false;
  form.elements.startsAt.value = dateInput(Date.now());
  form.elements.expiresAt.value = dateInput(Date.now() + 90 * 86400000);
  $("license-title").textContent = "إصدار رخصة متابعة";
  if (state)
    options(
      $("site-select"),
      state.sites.filter((s) => !s.revoked),
      (s) => s.name,
    );
}
$("cancel-edit").onclick = resetLicense;
$("license-form").onsubmit = (event) => {
  event.preventDefault();
  void action(async () => {
    const form = event.target,
      id = form.elements.id.value;
    const data = {
      siteId: form.elements.siteId.value,
      startsAt: new Date(`${form.elements.startsAt.value}T00:00:00`).getTime(),
      expiresAt: new Date(
        `${form.elements.expiresAt.value}T23:59:59`,
      ).getTime(),
      sensorLimit: Number(form.elements.sensorLimit.value),
      deviceLimit: Number(form.elements.deviceLimit.value),
      status: form.elements.status.value,
    };
    await api(id ? `licenses/${id}` : "licenses", id ? "PATCH" : "POST", data);
    resetLicense();
    await refresh();
  });
};
resetLicense();
void api("overview")
  .then(() => refresh())
  .catch(() => {});
setInterval(() => {
  if (state) void action(refresh);
}, 60_000);

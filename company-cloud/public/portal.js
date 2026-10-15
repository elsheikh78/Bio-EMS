import { translate } from "./locale.js";
import { currentPortfolio } from "./portfolio.js";
const $ = (id) => document.getElementById(id);
let state, enrollment;
let auditLoading = false;
let language = "ar";
try {
  language =
    localStorage.getItem("bioems.company.language") === "en" ? "en" : "ar";
} catch {
  /* Language preference is optional. */
}
const t = (key, values) => translate(language, key, values);
const names = new Proxy({}, { get: (_, key) => t(key) });
const date = (value) =>
  new Date(value).toLocaleString(language === "ar" ? "ar-EG" : "en-GB");
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
    throw new Error(
      body.error === "CUSTOMER_HAS_SITES"
        ? t("customerHasSites")
        : t("requestFailed", { status: response.status }),
    );
  }
  return body;
}
async function action(fn) {
  try {
    notice(t("working"));
    await fn();
    notice("");
  } catch (error) {
    notice(
      error instanceof Error &&
        ![
          "Failed to fetch",
          "NetworkError when attempting to fetch resource.",
        ].includes(error.message)
        ? error.message
        : t("unexpected"),
    );
  }
}
function options(select, rows, label) {
  const selected = select.value;
  select.replaceChildren();
  const empty = element("option", t("choose"));
  empty.value = "";
  select.append(empty);
  for (const row of rows) {
    const option = element("option", label(row));
    option.value = row.id;
    select.append(option);
  }
  if (rows.some((row) => row.id === selected)) select.value = selected;
}
async function refresh(keepAudit = false) {
  const previous =
    keepAudit && state?.audit.length > 5
      ? { audit: state.audit, auditNextCursor: state.auditNextCursor }
      : null;
  state = await api("overview");
  if (previous) Object.assign(state, previous);
  state.viewers = (await api("viewers")).users;
  renderState();
}
function siteLabel(site) {
  return `${site.name} · ${t(site.connection)} · ${site.id.slice(0, 8)}`;
}
function renderState() {
  const current = currentPortfolio(state);
  $("login").hidden = true;
  $("dashboard").hidden = false;
  $("logout").hidden = false;
  $("customer-count").textContent = state.customers.length;
  $("online-count").textContent = current.sites.filter(
    (s) => s.connection === "online",
  ).length;
  $("offline-count").textContent = current.sites.filter(
    (s) => s.connection === "offline",
  ).length;
  $("expiring-count").textContent = current.licenses.filter(
    (l) =>
      l.expires_at > Date.now() &&
      l.expires_at < Date.now() + 30 * 86400000 &&
      l.status !== "suspended",
  ).length;
  $("customer-list").replaceChildren();
  for (const customer of state.customers) {
    const card = element("article", undefined, "site");
    const count = state.sites.filter(
      (s) => s.customer_id === customer.id,
    ).length;
    const viewers = state.viewers.filter(
      (v) => v.customer_id === customer.id,
    ).length;
    const remove = element("button", t("removeCustomer"), "danger");
    remove.disabled = count > 0;
    remove.onclick = () => {
      if (
        prompt(t("removeCustomerConfirm", { name: customer.name, viewers })) !==
        customer.name
      )
        return;
      void action(async () => {
        await api(`customers/${customer.id}`, "DELETE", {
          confirmName: customer.name,
        });
        await refresh();
      });
    };
    card.append(
      element("h3", customer.name),
      element("p", t("customerCounts", { sites: count, viewers })),
      remove,
    );
    if (count) card.append(element("small", t("customerHasSites")));
    // Revoked sites are hidden from the current fleet but still own records.
    for (const site of state.sites.filter(
      (s) => s.customer_id === customer.id && s.revoked,
    )) {
      const removeSite = element(
        "button",
        `${t("removeSite")}: ${site.name}`,
        "danger",
      );
      removeSite.onclick = () => {
        if (!confirm(t("removeSiteConfirm", { site: site.name, id: site.id })))
          return;
        void action(async () => {
          await api(`sites/${site.id}`, "DELETE");
          await refresh();
        });
      };
      card.append(removeSite);
    }
    $("customer-list").append(card);
  }
  options($("customer-select"), state.customers, (c) => c.name);
  options($("viewer-customer"), state.customers, (c) => c.name);
  $("viewer-users").replaceChildren();
  for (const viewer of state.viewers || []) {
    const card = element("article", undefined, "site");
    card.append(
      element("h3", viewer.name),
      element(
        "p",
        `${viewer.username} · ${state.customers.find((c) => c.id === viewer.customer_id)?.name || ""} · VIEWER`,
      ),
    );
    const toggle = element(
      "button",
      t(viewer.disabled ? "enableViewer" : "disableViewer"),
      "secondary",
    );
    toggle.onclick = () =>
      void action(async () => {
        await api(`viewers/${viewer.id}`, "PATCH", {
          disabled: !viewer.disabled,
        });
        await refresh();
      });
    const form = element("form"),
      password = element("input"),
      save = element("button", t("resetViewer"));
    password.type = "password";
    password.minLength = 12;
    password.maxLength = 128;
    password.required = true;
    password.autocomplete = "new-password";
    password.setAttribute("aria-label", t("viewerPassword"));
    password.placeholder = t("viewerPassword");
    form.append(password, save);
    form.onsubmit = (event) => {
      event.preventDefault();
      void action(async () => {
        await api(`viewers/${viewer.id}`, "PATCH", {
          disabled: !!viewer.disabled,
          password: password.value,
        });
        password.value = "";
        await refresh();
      });
    };
    card.append(toggle, form);
    $("viewer-users").append(card);
  }
  if (!$("license-form").elements.id.value)
    options(
      $("site-select"),
      state.sites.filter((s) => !s.revoked),
      (s) =>
        `${state.customers.find((c) => c.id === s.customer_id)?.name} / ${siteLabel(s)}`,
    );
  $("sites").replaceChildren();
  if (!current.sites.length) $("sites").append(element("p", t("noSites")));
  for (const site of current.sites) {
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
          ? t("lastSeen", {
              date: date(site.last_seen),
              version: site.heartbeat?.version || "—",
            })
          : t("notConnected"),
      ),
    );
    const summary = site.heartbeat?.summary;
    card.append(
      element(
        "small",
        summary
          ? t("summary", {
              sensors: summary.sensorCount,
              devices: summary.deviceCount,
              offline: summary.offlineDevices,
              alarms: summary.activeAlarms,
              unack: summary.unacknowledgedAlarms,
            })
          : t("noSummary"),
      ),
    );
    card.append(
      element("small", `${t("connectionId")}: ${site.id}`, "connection-id"),
    );
    const open = element("button", t("openOwner"));
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
    const revoke = element("button", t("revoke"), "secondary");
    revoke.disabled = !!site.revoked;
    revoke.onclick = () => {
      if (confirm(t("revokeConfirm")))
        void action(async () => {
          await api(`sites/${site.id}/revoke`, "POST", {});
          await refresh();
        });
    };
    card.append(revoke);
    const remove = element("button", t("removeSite"), "danger");
    remove.setAttribute("aria-label", t("removeSiteName", { site: site.name }));
    remove.onclick = () => {
      if (confirm(t("removeSiteConfirm", { site: site.name, id: site.id })))
        void action(async () => {
          await api(`sites/${site.id}`, "DELETE");
          const selected = sessionStorage.getItem(
            "bioems.company.selected-site",
          );
          if (selected && JSON.parse(selected).id === site.id) {
            sessionStorage.removeItem("bioems.company.selected-site");
            sessionStorage.removeItem("bioems.platform.session.v1");
          }
          if (
            state.licenses.some(
              (l) =>
                l.site_id === site.id &&
                l.id === $("license-form").elements.id.value,
            )
          )
            resetLicense();
          await refresh();
        });
    };
    card.append(remove);
    $("sites").append(card);
  }
  $("licenses").replaceChildren();
  for (const license of current.licenses) {
    const row = element("tr");
    const site = state.sites.find((s) => s.id === license.site_id);
    for (const text of [
      site ? siteLabel(site) : license.site_id,
      names[license.effective_status],
      date(license.expires_at),
      `${license.sensor_limit} / ${license.device_limit}`,
    ])
      row.append(element("td", text));
    const cell = element("td");
    const button = element("button", t("renew"), "secondary");
    button.onclick = () => {
      const form = $("license-form");
      options($("site-select"), current.sites, siteLabel);
      form.elements.id.value = license.id;
      form.elements.siteId.value = license.site_id;
      form.elements.siteId.disabled = true;
      form.elements.startsAt.value = dateInput(license.starts_at);
      form.elements.startsAt.disabled = true;
      form.elements.expiresAt.value = dateInput(license.expires_at);
      form.elements.sensorLimit.value = license.sensor_limit;
      form.elements.deviceLimit.value = license.device_limit;
      form.elements.status.value = license.status;
      $("license-title").textContent = t("editLicense", {
        site: site?.name || "",
      });
      form.scrollIntoView({ behavior: "smooth" });
    };
    cell.append(button);
    const remove = element("button", t("removeLicense"), "danger");
    remove.setAttribute("aria-label", t("removeLicenseId", { id: license.id }));
    remove.onclick = () => {
      if (
        confirm(
          t("removeLicenseConfirm", {
            site: site?.name || license.site_id,
            id: license.id,
          }),
        )
      )
        void action(async () => {
          await api(`licenses/${license.id}`, "DELETE");
          if ($("license-form").elements.id.value === license.id)
            resetLicense();
          await refresh();
        });
    };
    cell.append(remove);
    row.append(cell);
    $("licenses").append(row);
  }
  if (!current.licenses.length) {
    const row = element("tr");
    const cell = element("td", t("noLicenses"));
    cell.colSpan = 5;
    row.append(cell);
    $("licenses").append(row);
  }
  const editing = current.licenses.find(
    (l) => l.id === $("license-form").elements.id.value,
  );
  $("license-title").textContent = editing
    ? t("editLicense", {
        site: state.sites.find((s) => s.id === editing.site_id)?.name || "",
      })
    : t("issueLicense");
  renderAudit();
}
function renderAudit() {
  $("audit").replaceChildren();
  if (!state.audit.length) $("audit").append(element("p", t("noActivity")));
  const actions = {
    "customer.created": t("customerCreated"),
    "customer.deleted": t("customerDeleted"),
    "audit.deleted": t("auditDeleted"),
    "site.created": t("siteCreated"),
    "site.revoked": t("siteRevoked"),
    "license.created": t("licenseCreated"),
    "license.updated": t("licenseUpdated"),
    "site.deleted": t("siteDeleted"),
    "license.deleted": t("licenseDeleted"),
    "remote.queued": t("remoteQueued"),
    "remote.completed": t("remoteCompleted"),
  };
  $("audit-more").hidden = !state.auditNextCursor;
  $("audit-more").disabled = auditLoading;
  for (const record of state.audit)
    $("audit").append(
      element(
        "div",
        `${date(record.created_at)} — ${actions[record.action] || record.action} — ${record.target}`,
        "audit-row",
      ),
    );
}
$("audit-more").onclick = () => {
  if (auditLoading || !state?.auditNextCursor) return;
  auditLoading = true;
  $("audit-more").disabled = true;
  void action(async () => {
    try {
      const page = await api(
        `audit?cursor=${encodeURIComponent(state.auditNextCursor)}`,
      );
      state.audit.push(...page.records);
      state.auditNextCursor = page.nextCursor;
    } finally {
      auditLoading = false;
      renderAudit();
    }
  });
};
$("audit-latest").onclick = () => void action(refresh);
$("audit-range").onsubmit = (event) => {
  event.preventDefault();
  const form = event.target;
  // Local calendar boundaries: end date includes the full selected day.
  const from = new Date(`${form.elements.from.value}T00:00:00`).getTime();
  const end = new Date(`${form.elements.to.value}T00:00:00`);
  end.setDate(end.getDate() + 1);
  const to = end.getTime();
  void action(async () => {
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from)
      throw new Error(t("invalidAuditRange"));
    const preview = await api("audit/preview", "POST", { from, to });
    if (!preview.count) {
      alert(t("noAuditRange"));
      return;
    }
    if (
      !confirm(
        t("deleteAuditConfirm", {
          count: preview.count,
          from: date(preview.from),
          to: date(preview.to),
        }),
      )
    )
      return;
    await api("audit", "DELETE", {
      from: preview.from,
      to: preview.to,
      confirm: "delete-audit-range",
    });
    await refresh();
  });
};
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
$("viewer-form").onsubmit = (event) => {
  event.preventDefault();
  void action(async () => {
    const form = event.target;
    await api("viewers", "POST", Object.fromEntries(new FormData(form)));
    form.reset();
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
  $("license-title").textContent = t("issueLicense");
  if (state)
    options(
      $("site-select"),
      state.sites.filter((s) => !s.revoked),
      siteLabel,
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
function applyLanguage() {
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.title = `BIO-EMS | ${t("companyWorkspace")}`;
  document
    .querySelectorAll("[data-i18n]")
    .forEach((node) => (node.textContent = t(node.dataset.i18n)));
  $("language-toggle").textContent = language === "ar" ? "English" : "العربية";
  $("language-toggle").setAttribute(
    "aria-label",
    language === "ar" ? "Switch to English" : "التبديل إلى العربية",
  );
  if (state) renderState();
}
$("language-toggle").onclick = () => {
  language = language === "ar" ? "en" : "ar";
  try {
    localStorage.setItem("bioems.company.language", language);
  } catch {
    /* Optional preference. */
  }
  applyLanguage();
};
applyLanguage();
resetLicense();
void api("overview")
  .then(() => refresh())
  .catch(() => {});
setInterval(() => {
  if (state) void action(() => refresh(true));
}, 60_000);

import { translate } from "./locale.js";
import { roomState, alarmLevel, isActive, newAlarmKeys } from "./model.js";
const $ = (id) => document.getElementById(id);
const POLL_MS = 30_000;
let language = "ar";
try {
  language =
    localStorage.getItem("bioems.viewer.language") === "en" ? "en" : "ar";
} catch {
  /* Optional preference. */
}
let state = null,
  connected = false,
  inFlight = false,
  lastSync = null,
  serverOffset = 0;
let known = new Set(),
  initialized = false,
  sound = false,
  ringing = false,
  audio,
  pendingInstall;
let selectedRoom = null;
const t = (key) => translate(language, key);
const now = () => Date.now() + serverOffset;
const date = (value) =>
  value
    ? new Date(value).toLocaleString(language === "ar" ? "ar-EG" : "en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : t("never");
function node(tag, text, className) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (className) n.className = className;
  return n;
}
function notice(key) {
  $("notice").textContent = key ? t(key) : "";
  $("notice").hidden = !key;
}
function showLogin() {
  state = null;
  connected = false;
  initialized = false;
  known = new Set();
  ringing = false;
  $("dashboard").hidden = true;
  $("login").hidden = false;
  $("logout").hidden = true;
  $("room-grid").replaceChildren();
  $("alarm-feed").replaceChildren();
  $("dialog-content").replaceChildren();
  $("dialog-title").textContent = "";
  $("site-filter").replaceChildren();
  selectedRoom = null;
  $("customer-name").textContent = "BIO-EMS";
  $("user-name").textContent = t("viewer");
  $("avatar").textContent = "V";
  if ($("room-dialog").open) $("room-dialog").close();
}
async function api(path, method = "GET", data) {
  const response = await fetch(`/api/viewer/${path}`, {
    method,
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  if (response.status === 401 && path !== "login") {
    showLogin();
    notice("expired");
  }
  if (!response.ok)
    throw Object.assign(new Error("Request failed"), {
      status: response.status,
    });
  return response.json();
}
function allRoomEntries() {
  return state.sites.flatMap((site) =>
    (site.snapshot?.rooms || []).map((room) => ({
      site,
      room,
      ...roomState(site, room, now(), state, connected),
    })),
  );
}
function filteredSites() {
  const value = $("site-filter").value;
  return state.sites.filter((s) => !value || s.id === value);
}
function empty(title, description) {
  const e = node("div", undefined, "empty");
  e.append(node("strong", t(title)), node("span", t(description)));
  return e;
}
function badge(level, label = level) {
  return node("span", t(label), `status-badge ${level}`);
}
function sensorValue(s) {
  return s.value === null
    ? "—"
    : new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-GB", {
        maximumFractionDigits: 2,
      }).format(s.value);
}
function limitsAvailable(site) {
  return (
    connected &&
    site.snapshot &&
    site.receivedAt &&
    now() - site.receivedAt <= state.snapshotFreshMs &&
    now() - Date.parse(site.snapshot.capturedAt) <= state.snapshotFreshMs
  );
}
function render() {
  if (!state) return;
  $("login").hidden = true;
  $("dashboard").hidden = false;
  $("logout").hidden = false;
  $("customer-name").textContent = state.customerName;
  $("user-name").textContent = state.name;
  $("avatar").textContent = state.name.slice(0, 1);
  const entries = allRoomEntries(),
    normal = entries.filter((r) => r.level === "normal").length;
  const alarms = state.sites
    .flatMap((s) => s.snapshot?.alarms || [])
    .filter(isActive);
  $("site-count").textContent = state.sites.length;
  $("room-count").textContent = entries.length;
  $("sensor-count").textContent = state.sites.reduce(
    (n, s) => n + (s.snapshot?.sensors.length || 0),
    0,
  );
  $("alarm-count").textContent = alarms.length;
  $("nav-alarm-count").textContent = alarms.length;
  $("alarm-caption").textContent = t(
    alarms.length ? "needsAttention" : "noActive",
  );
  const percent = entries.length
    ? Math.round((normal / entries.length) * 100)
    : null;
  $("healthy-percent").textContent = percent === null ? "—" : `${percent}%`;
  $("health-ring").style.strokeDashoffset = 308 * (1 - (percent || 0) / 100);
  const fresh =
    state.sites.length > 0 &&
    state.sites.every(
      (s) => limitsAvailable(s) && s.snapshot.telemetryAvailable,
    ) &&
    entries.every((r) => !r.stale);
  $("connection").textContent = `● ${t(fresh ? "live" : "delayed")}`;
  $("last-sync").textContent = `${t("sync")} · ${date(lastSync)}`;
  $("push-help").textContent = t(
    !state.pushAvailable
      ? "pushUnavailable"
      : !("PushManager" in window)
        ? "pushUnsupported"
        : "pushHelp",
  );
  $("push").disabled = !state.pushAvailable;
  const previous = $("site-filter").value;
  $("site-filter").replaceChildren(node("option", t("allSites")));
  $("site-filter").options[0].value = "";
  for (const site of state.sites) {
    const option = node("option", site.name);
    option.value = site.id;
    $("site-filter").append(option);
  }
  $("site-filter").value = state.sites.some((s) => s.id === previous)
    ? previous
    : "";
  renderRooms(entries);
  renderAlarms();
  $("sound").textContent = t(sound ? "soundOn" : "enableSound");
  $("mute").hidden = !ringing;
  if (selectedRoom && $("room-dialog").open) renderDetails();
}
function renderRooms(entries = allRoomEntries()) {
  const siteId = $("site-filter").value,
    status = $("status-filter").value,
    query = $("search").value.trim().toLocaleLowerCase();
  const filtered = entries.filter(
    (e) =>
      (!siteId || e.site.id === siteId) &&
      (status === "all" ||
        e.level === status ||
        (status === "offline" && e.stale)) &&
      (!query ||
        [
          e.room.name,
          e.room.code,
          e.site.name,
          ...e.sensors.flatMap((s) => [s.name, s.code]),
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(query)),
  );
  $("room-grid").replaceChildren();
  for (const e of filtered) {
    const card = node("article", undefined, `room-card ${e.level}`),
      top = node("div", undefined, "room-top"),
      heading = node("div");
    heading.append(
      node("span", e.site.name, "room-site"),
      node("h3", e.room.name),
    );
    top.append(heading, badge(e.level));
    card.append(top);
    const readings = node("div", undefined, "telemetry-list");
    for (const sensor of e.sensors.slice(0, 3)) {
      const row = node("div", undefined, "reading"),
        label = node("div", sensor.name, "reading-name"),
        value = node(
          "div",
          undefined,
          `reading-value ${e.staleReading(sensor) ? "offline" : e.level}`,
        );
      label.append(
        node(
          "small",
          `${t(sensor.type.toLowerCase())} · ${sensor.code}`,
          "reading-type",
        ),
      );
      value.append(
        node("span", sensorValue(sensor)),
        node("span", sensor.unit, "reading-unit"),
      );
      row.append(label, value);
      readings.append(row);
    }
    if (!e.sensors.length)
      readings.append(node("p", t("noSensors"), "room-empty"));
    card.append(readings);
    const times = e.sensors
        .map((s) => Date.parse(s.recordedAt))
        .filter(Number.isFinite),
      bottom = node("div", undefined, "room-bottom");
    bottom.append(
      node(
        "span",
        e.stale
          ? t("stale")
          : `${t("updated")} · ${times.length ? date(Math.max(...times)) : t("never")}`,
      ),
    );
    const details = node(
      "button",
      `${t("details")}${e.sensors.length > 3 ? ` (+${e.sensors.length - 3})` : ""}`,
    );
    details.onclick = () => {
      selectedRoom = { siteId: e.site.id, roomId: e.room.id };
      renderDetails();
      $("room-dialog").showModal();
    };
    bottom.append(details);
    card.append(bottom);
    $("room-grid").append(card);
  }
  for (const site of filteredSites().filter((s) => !s.snapshot))
    $("room-grid").append(
      empty("pendingSite", "emptyRoomsHelp"),
      node("p", site.name, "room-empty"),
    );
  if (!$("room-grid").children.length)
    $("room-grid").append(empty("emptyRooms", "emptyRoomsHelp"));
}
function renderAlarms() {
  const rows = filteredSites()
    .flatMap((site) =>
      (site.snapshot?.alarms || []).map((alarm) => ({ site, alarm })),
    )
    .filter(({ alarm }) => $("alarm-filter").value === "all" || isActive(alarm))
    .sort(
      (a, b) =>
        Date.parse(b.alarm.triggeredAt) - Date.parse(a.alarm.triggeredAt),
    );
  $("alarm-feed").replaceChildren();
  for (const { site, alarm } of rows) {
    const room = site.snapshot.rooms.find((r) => r.id === alarm.roomId),
      sensor = site.snapshot.sensors.find((s) => s.id === alarm.sensorId),
      level = isActive(alarm) ? alarmLevel(alarm) : "normal";
    const row = node("article", undefined, `alarm-row ${level}`),
      text = node("div"),
      time = node("div", undefined, "alarm-time");
    text.append(
      node("h3", `${room?.name || "—"} · ${sensor?.name || "—"}`),
      node(
        "p",
        `${site.name} · ${t(alarm.type)} · ${alarm.value ?? "—"} ${sensor?.unit || ""}`,
      ),
    );
    time.append(
      node("span", date(alarm.triggeredAt)),
      badge(level, alarm.status),
    );
    row.append(
      node("span", isActive(alarm) ? "!" : "✓", "alarm-symbol"),
      text,
      time,
    );
    $("alarm-feed").append(row);
  }
  if (!rows.length)
    $("alarm-feed").append(empty("emptyAlarms", "emptyAlarmsHelp"));
}
function renderDetails() {
  const site = state.sites.find((s) => s.id === selectedRoom.siteId),
    room = site?.snapshot?.rooms.find((r) => r.id === selectedRoom.roomId);
  if (!room) {
    $("room-dialog").close();
    return;
  }
  const e = roomState(site, room, now(), state, connected);
  $("dialog-title").textContent = room.name;
  $("dialog-content").replaceChildren(
    node("p", `${site.name} · ${room.code}`),
    badge(e.level),
  );
  if (e.stale) $("dialog-content").append(node("p", t("stale"), "offline"));
  for (const s of e.sensors) {
    const row = node("div", undefined, "detail-sensor");
    row.append(
      node("span", `${s.name} · ${s.code}`),
      node(
        "strong",
        `${sensorValue(s)} ${s.unit}`,
        e.staleReading(s) ? "offline" : e.level,
      ),
      node(
        "p",
        `${t(s.type.toLowerCase())} · ${t("readingTime")}: ${date(s.recordedAt)}`,
      ),
    );
    $("dialog-content").append(row);
  }
}
function beep() {
  if (!sound || !audio || audio.state !== "running") return;
  for (let i = 0; i < 2; i++) {
    const oscillator = audio.createOscillator(),
      gain = audio.createGain(),
      at = audio.currentTime + i * 0.28;
    oscillator.type = "sine";
    oscillator.frequency.value = i ? 880 : 660;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.12, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.2);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.22);
  }
}
async function refresh(quiet = false) {
  if (inFlight) return;
  inFlight = true;
  $("refresh").disabled = true;
  try {
    const data = await api("overview");
    serverOffset = data.serverTime - Date.now();
    state = data;
    connected = true;
    lastSync = data.serverTime;
    const arrivals = newAlarmKeys(data.sites, known);
    if (initialized && arrivals.length) {
      ringing = true;
      beep();
      notice("newAlarm");
    } else if (!quiet) notice(null);
    known = new Set(
      data.sites.flatMap((s) =>
        (s.snapshot?.alarms || []).map((a) => `${s.id}:${a.id}`),
      ),
    );
    initialized = true;
    if (!data.sites.some((s) => s.snapshot?.alarms.some(isActive)))
      ringing = false;
    if (!$("site-filter").value) {
      const requested = new URL(location.href).searchParams.get("site");
      if (requested && data.sites.some((s) => s.id === requested)) {
        const option = node("option", "");
        option.value = requested;
        $("site-filter").append(option);
        $("site-filter").value = requested;
      }
    }
    render();
  } catch (error) {
    connected = false;
    if (state) {
      render();
      notice("failed");
    } else if (error.status !== 401) notice("failed");
  } finally {
    inFlight = false;
    $("refresh").disabled = false;
  }
}
$("login-form").onsubmit = async (event) => {
  event.preventDefault();
  const form = event.currentTarget,
    button = form.querySelector("button");
  button.disabled = true;
  notice(null);
  try {
    await api("login", "POST", {
      username: form.elements.username.value,
      password: form.elements.password.value,
    });
    form.reset();
    await refresh();
  } catch {
    notice("loginFailed");
  } finally {
    button.disabled = false;
  }
};
$("logout").onclick = async () => {
  try {
    const registration =
      await navigator.serviceWorker?.getRegistration("/viewer/");
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await api("subscriptions", "DELETE", { endpoint: subscription.endpoint });
      await subscription.unsubscribe();
    }
    await api("logout", "POST", {});
    showLogin();
    notice(null);
  } catch {
    notice("failed");
  }
};
$("refresh").onclick = () => void refresh();
$("site-filter").onchange = () => render();
$("status-filter").onchange = () => renderRooms();
$("search").oninput = () => renderRooms();
$("alarm-filter").onchange = renderAlarms;
$("dialog-close").onclick = () => $("room-dialog").close();
$("sound").onclick = async () => {
  try {
    if (sound) {
      sound = false;
      ringing = false;
    } else {
      const Audio = window.AudioContext || window.webkitAudioContext;
      audio ||= new Audio();
      await audio.resume();
      sound = true;
      ringing = !!state?.sites.some((site) =>
        site.snapshot?.alarms.some(isActive),
      );
      beep();
    }
    render();
  } catch {
    notice("soundError");
  }
};
$("mute").onclick = () => {
  ringing = false;
  render();
};
setInterval(() => {
  if (ringing) beep();
}, 12_000);
function decodeKey(value) {
  return Uint8Array.from(
    atob(value.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0),
  );
}
$("push").onclick = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    notice("pushUnsupported");
    return;
  }
  $("push").disabled = true;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      notice("pushDenied");
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();
    subscription ||= await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeKey(state.vapidPublicKey),
    });
    await api("subscriptions", "POST", subscription.toJSON());
    $("push").textContent = t("pushOn");
    notice(null);
  } catch {
    notice("pushError");
  } finally {
    $("push").disabled = !state?.pushAvailable;
  }
};
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  pendingInstall = event;
  $("install").hidden = false;
});
$("install").onclick = async () => {
  if (pendingInstall) {
    await pendingInstall.prompt();
    pendingInstall = null;
    $("install").hidden = true;
  } else notice("installHelp");
};
if (!matchMedia("(display-mode: standalone)").matches)
  $("install").hidden = false;
function applyLanguage() {
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.title = `BIO-EMS | ${t("workspace")}`;
  document
    .querySelectorAll("[data-t]")
    .forEach((n) => (n.textContent = t(n.dataset.t)));
  document
    .querySelectorAll("[data-placeholder]")
    .forEach((n) => (n.placeholder = t(n.dataset.placeholder)));
  $("language").textContent = language === "ar" ? "English" : "العربية";
  render();
}
$("language").onclick = () => {
  language = language === "ar" ? "en" : "ar";
  try {
    localStorage.setItem("bioems.viewer.language", language);
  } catch {
    /* Optional preference. */
  }
  applyLanguage();
};
applyLanguage();
if ("serviceWorker" in navigator)
  navigator.serviceWorker
    .register("/viewer/sw.js", { scope: "/viewer/" })
    .catch(() => {
      /* Browsing remains available without installation. */
    });
void refresh(true);
setInterval(() => {
  if (state) void refresh(true);
}, POLL_MS);
setInterval(() => {
  if (state) render();
}, 10_000);
window.addEventListener("offline", () => {
  connected = false;
  if (state) {
    render();
    notice("failed");
  }
});
window.addEventListener("online", () => {
  if (state) void refresh();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && state) void refresh(true);
});

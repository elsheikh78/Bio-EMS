const CACHE = "bioems-viewer-shell-v1";
const SHELL = [
  "/viewer/",
  "/viewer/viewer.css",
  "/viewer/viewer.js",
  "/viewer/locale.js",
  "/viewer/model.js",
  "/viewer/fonts.css",
  "/viewer/icon-192.png",
  "/viewer/icon-512.png",
  "/bio-ems-logo-horizontal.png",
  "/bio-ems-mark.png",
];
self.addEventListener("install", (event) =>
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL))),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("bioems-viewer-shell-") && key !== CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // API/authenticated responses never enter Cache Storage, even while offline.
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !SHELL.includes(url.pathname)
  )
    return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE).then((cache) => cache.put(event.request, copy)),
          );
        }
        return response;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then((response) => response || Response.error()),
      ),
  );
});
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch {
    /* Use generic text for invalid payloads. */
  }
  const url =
    typeof data.url === "string" && data.url.startsWith("/viewer/?")
      ? data.url
      : "/viewer/";
  event.waitUntil(
    self.registration.showNotification("BIO-EMS", {
      body: "New monitoring alarm · إنذار مراقبة جديد",
      icon: "/viewer/icon-192.png",
      badge: "/viewer/icon-192.png",
      tag: typeof data.tag === "string" ? data.tag : "bioems-alarm",
      data: { url },
      requireInteraction: true,
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || "/viewer/",
    self.location.origin,
  );
  if (target.origin !== self.location.origin || target.pathname !== "/viewer/")
    return;
  event.waitUntil(self.clients.openWindow(target.href));
});

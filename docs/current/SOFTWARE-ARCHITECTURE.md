# Software Architecture and Data Flow

Updated 31 October 2026 after merged PR #316; earlier architectural responsibilities remain subject to current source and the recorded acceptance holds. [State authority](../../PROJECT_STATE.md) controls merge/deployment status. This describes observed code, while retained ADRs/specifications describe approved design intent.

## Components and trust boundaries

| Component | Source | Responsibility and limits |
| --- | --- | --- |
| Local backend | `backend/src/app.ts`, `server.ts` | Express REST, authenticated SSE, platform services, MQTT lifecycle; starts SQLite schema/migrations and scheduled processes |
| Local web UI | `frontend/src/` | React/MUI operational and System Owner workspaces; server authorization remains authoritative |
| Operational persistence | `backend/database/sqlite/`, repositories/modules | Configuration, users, alarms, audit, installations, licensing, durable jobs and backup metadata |
| Time series | `backend/database/influx/`, telemetry service | Telemetry history/query; backup/restore is distinct from SQLite |
| Notification runtime | `backend/src/modules/notification/` | Durable event/delivery/escalation state, SMTP/Telegram/WhatsApp/HTTP-SMS providers and controlled retries |
| Installation/provisioning | `modules/installation/`, `modules/device-pairing/`, owner operations | Validated installation revisions and controlled hardware binding |
| Company cloud | `company-cloud/src/worker.mjs`, `management.mjs`, `viewer.mjs` | Separate company auth, jobs, site agents, snapshots and customer Viewer |
| Hardware | `firmware/` | Physical acquisition, bus, networking, SD/RTC and explicit modem diagnostics |
| Qualification | `tools/hardware-tester/` | Standalone local evidence DB and reports; no platform login/database access |

The backend mounts platform authentication, owner operations, pairing and device telemetry routes before general customer authentication because they have separate authentication boundaries. Mount order is not permission to bypass their dedicated middleware. Customer ADMIN and platform owner are separate principals. See [security](SECURITY-AND-IDENTITY.md).

## Owner policies and hardware health

Owner-only feature settings persist versioned policy and append-only actor/reason history. Optional platform features have API/runtime gates; Main settings wait for an authenticated applied-revision report and use a rollback trial to avoid stranding a device. Controller health and critical power/storage incidents are distinct from sensor alarms. Unwired power inputs remain unknown; events are escalated at highest priority. A bounded independent NVS transition journal and the SD sample queue have different failure/retention limits. Detailed behavior and limitations: [Main resilience](MAIN-RESILIENCE-AND-FEATURE-SETTINGS.md).

## Telemetry and alarms

Main polls addressed Nano modules over the shared RS485 bus and maps their four channels into the operating sensor model. Main pilot.10 sends authenticated AES-GCM envelopes to `/api/v1/controller-runtime/exchange` over interface-bound HTTPS or through the opaque Windows BLE relay. Ethernet has first priority, then Wi-Fi, then BLE. The backend derives the active device identity from the binding, verifies/decrypts the envelope, processes telemetry or health and returns an authenticated request-matching acknowledgement with policy revision. The legacy `/api/v1/device-telemetry/:bindingId` token route remains for older controllers. The backend also retains its separate MQTT ingestion path. Do not infer a native MQTT publisher in this Main firmware merely because pairing configuration includes MQTT topic names. Shared ingest validates protocol/payload/binding, stores time-series data, updates device health and evaluates live alarms. Review `backend/src/modules/telemetry/listeners/telemetry.listener.ts`, its security tests, telemetry schemas, MQTT source and `modules/telemetry/services/telemetry.service.ts` before changing this boundary.

Live observations and replay are different. Replay retains original acquisition timestamps and does not create historical live-alarm notifications; trusted backend receipt time controls device-health freshness. Main durable SD queue and acknowledgement/retry handling require physical retention and interruption tests. The queue host suite covers FIFO/capacity/reboot/retry/corruption behavior; it is not a proof of every FAT/power-failure condition.

Alarm lifecycle, thresholds, delays and calibration belong to domain services; APIs must not write time-series/business decisions directly. Notifications are durable jobs with independent delivery state; successful provider submission is not proof that a human received or acknowledged an alarm. Local backend notification failover policy must not be confused with autonomous controller GSM fallback, which is absent.

## Data, API and reports

SQLite migrations in `backend/database/sqlite/` and repository/module code define the actual relational schema. Influx stores time-series independently. Reporting source is `backend/src/modules/reporting/` and `backend/src/routes/report.route.ts`; preview/CSV/PDF outputs must retain their selected range, filters, timezone/calibration context and scope. A report cannot certify a sensor's physical calibration without traceable reference evidence.

[Route inventory](../audit/2026-10-28/api-route-inventory.json) lists literal Express route declarations and source lines. Paths are relative to router mounts: inspect `app.ts` and composed routers to resolve full URLs. Worker conditional routes are not included in that inventory. Request schemas, middleware order, controller/service tests and runtime responses remain the contract; this inventory is not OpenAPI coverage.

The candidate's hardware archive router exposes authenticated historical GETs and rejects former writes with 410. Legacy repository mutator/evaluator code remains for data compatibility but is no longer the supported test execution entrypoint. Do not remove old records or reinterpret an old PASS using a later profile.

## Configuration and synchronization

Environment config loaders enforce production preconditions; Windows protected configuration is managed by the installer rather than customer `.env` editing. Installation revisions, pairing identity, device configuration receipt and licensing are separate controlled records. Accepted architecture includes stronger production device trust than the pilot firmware currently implements. See ADRs and the [security guide](SECURITY-AND-IDENTITY.md) for the gap.

## Change discipline

Keep transport validation, application/domain decisions and persistence separated. Existing older modules have mixed structural conventions; moving code solely for directory uniformity is outside this audit. Add contract tests for authorization, tenant/site scope, replay, idempotency and recovery whenever those behaviors change. Full repository inventory and coverage/limitations are in the audit; no line-by-line certification is implied.

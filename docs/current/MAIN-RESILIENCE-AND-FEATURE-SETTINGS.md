# Main resilience and System Owner feature settings

Integrated through PR [#316](https://github.com/elsheikh78/Bio-EMS/pull/316) on 31 October 2026 at `95ff1c9b519c49fe23fb3ed721b55e8ed559a444`. Tester `0.7.0`, Main `0.1.0-pilot.10`, product `0.20.0`, Nano `0.1.0-bench.2`. All seven reviewed-head workflows passed, including Windows lifecycle and Setup upload; see [the exact integration receipt](../hardware/evidence/MAIN-RESILIENCE-INTEGRATION-2026-10-31.json). The distributed Pilot packages identify tested PR merge `ff8b6ba53c44e74a46707b5daf99f1b808be72e4`. This does not create a new tagged release, prove a field upgrade or close physical acceptance. Open tests and follow-up reminders are controlled by [project state](../../PROJECT_STATE.md#open-tests-and-follow-up-reminders--do-not-infer-pass-from-ci).

## Connection and data behavior

The governed Main uses Ethernet first, then configured Wi-Fi, then BLE through a USB BLE adapter on the local Windows host. The authenticated application acknowledgement, rather than link or cable presence, determines delivery success. HTTPS attempts bind to the selected network interface and retain certificate/endpoint validation. Failed IP paths have a 15-second retry cooldown; an already working lower-priority connection is upgraded after the higher-priority link has remained available for 10 seconds. These are source timers, not a measured failover-time guarantee.

The bundled BLE relay discovers the dedicated service and forwards opaque AES-256-GCM envelopes to the local HTTPS backend. The device binding is authenticated as associated data. A fresh request ID is checked inside the encrypted acknowledgement. The relay stores no device token and cannot manufacture a successful acknowledgement. It supports up to four concurrent connected Main devices. The Windows backend service owns its child process; absent adapters are retried without preventing backend startup. USB adapter/driver, Windows service-account BLE access, enclosure range at 5/10 m, and reconnection still require physical qualification.

With trusted UTC and enabled/working SD storage, samples are appended before delivery. Each sample has a random persistent `sampleId`; live delivery and replay keep the same ID and timestamp. A sample remains queued until accepted. The server writes telemetry before saving its durable receipt; matching repeated deliveries are acknowledged without a second processing pass, and conflicting reuse of an ID is rejected. Influx points already written before a crash use the same sensor/timestamp on retry. This is not a transactional exactly-once guarantee across SQLite, InfluxDB and alarm side effects.

Replay is limited to eight records per acquisition cycle. Disabling replay preserves history. Disabling SD stops new sample buffering and requires replay to be disabled too; previous history is not deleted. If live delivery succeeds behind an older backlog, its write-ahead record stays in that backlog until replay acknowledges it. Queue limit is 20,000 records by default; configured queue occupancy and filesystem occupancy both contribute to the warning percentage. Do not treat card capacity alone as the retention limit. Ingress receipts currently remain in SQLite; disk capacity and long-term retention need installation planning.

The existing polling task also performs network delivery. The five-second delay is not a fixed five-second sampling guarantee during transport timeouts or long replay operations. Measure acquisition cadence, upload backlog and endurance with the actual population. Firmware changes do not establish a no-gap timing guarantee.

## Critical power and storage events

Main health contains actual/unknown mains-good and battery-low inputs, selected delivery transport, SD health, occupancy, pending records and applied policy revision. An unwired power input remains `null`; loss of communication is never used to infer power loss. Storage mount/read/write faults, including a missing card, produce an unavailable-storage condition rather than claiming a precise absent-versus-damaged diagnosis.

Critical conditions are mains loss, battery low, unavailable storage and occupancy at/above the owner threshold (default 80%, adjustable 50–95%). All use highest notification priority. Eligible CRITICAL recipients on the configured WhatsApp, Telegram, email and SMS channels enter escalation immediately, bypassing ordinary delay steps. Open unacknowledged events repeat every five minutes. ACK or measured recovery cancels open notification jobs on the next orchestrator cycle. Notifications still require configured/available providers and recipients; disabling platform notification delivery pauses dispatch.

A separate NVS journal retains up to 24 power/storage transition snapshots when SD or communications are unavailable. It is bounded and never silently overwrites unacknowledged entries: full/write/corruption conditions are logged and require service. Buffered transitions replay in order before current health. Their original timestamp is preserved. Fresh USB/server time or a valid commissioned DS3231 is required for accurate historical time. Neither NVS nor SD can retain unlimited history.

If all three host transports are lost, remote notification waits for reconnection. Autonomous SIM800L SMS alarm fallback is **not implemented** by this Pilot implementation; existing explicit modem diagnostic/test commands remain separate. This work does not build or certify the backup power supply.

## Power wiring hold

`BIOEMS_MAINS_GOOD_GPIO` and `BIOEMS_BATTERY_LOW_GPIO` default to `-1` (unwired). Before selecting pins, review all existing ESP32-S3, W5500, SD, RTC, RS485 and modem assignments and input-voltage limits. Use properly conditioned low-voltage signals from the approved supply/backup circuit. Never connect mains directly to a GPIO. The optional active-low setting applies to both inputs. Battery-low detection must come from the actual approved battery/BMS or supervision circuit; the software does not invent chemistry-specific voltage limits or charge percentages. Confirm input polarity, stability/debounce requirements, backup changeover and 30-minute full-load endurance physically before accepting power alarms.

## Owner settings

Open **System Owner → System feature settings** (`/system-owner/settings`). Select the local platform or an active Main binding. Enter a reason and save. Concurrent stale revisions are rejected; actor, reason and before/after values are retained in policy history.

| Scope | Switches |
| --- | --- |
| Main, independently per binding | Ethernet, Wi-Fi, BLE, SD buffering, automatic replay, power alarms, storage alarms, SD warning percentage |
| Local platform | Reports, calibration, notification dispatch, manual/scheduled backups, client updates |

At least one communication path must remain enabled. Replay requires storage. Firmware tests candidate path settings in RAM, persists them only after another authenticated exchange using that candidate, and rolls back after 60 seconds without confirmation. A rejected revision is not retried until the owner saves a new revision. Saved and applied revisions are displayed separately; rollback details appear in controller health. A disconnected or older-firmware device must not be labelled applied merely because a save succeeded. Reconfiguration cannot be delivered to a device with no functioning path.

Platform switches are enforced at API/runtime boundaries as well as optional navigation visibility. Core authentication, audit, owner recovery and transport security cannot be turned off here. Channel credentials/enabled states and cloud controls retain their existing configuration pages. The settings catalog is explicit; it is not a claim that every possible future subsystem has a switch.

Critical Main events are visible in the customer Alarms page and owner settings. Customer acknowledgement requires ALARM_ACKNOWLEDGE; Viewer remains read-only. Owner settings use the separate SYSTEM_OWNER session, not a customer ADMIN token.

## Rollout and qualification

1. Build backend/frontend and Windows BLE relay from the same source; apply migration 36 using the normal migration runner. Back up the installation before upgrade. The Windows setup staging now requires the built BLE relay.
2. Upgrade the client before flashing Main pilot.10; the Pilot implementation uses `/controller-runtime/exchange`. Retain the governed pilot.9 package for coordinated rollback. Do not flash new firmware against an old backend.
3. Configure Wi-Fi credentials and verify Ethernet. USB provisioning still requires an IP path; BLE is a bound-device runtime fallback, not a replacement for initial pairing.
4. Fit and qualify the USB BLE adapter. Inspect saved/applied revisions and actual received health before enabling site reliance on fallback.
5. Use Tester qualification revision **HQT-3**, with 21 mandatory steps. The three new manual evidence steps cover transport failover, owner switches/rollback, and critical power/storage escalation. Existing saved qualification runs retain their frozen plans. A manual checklist entry is not automated acquisition or independent physical proof.
6. Test offline retention across restart; exact timestamps and duplicate handling; card removal/full/write faults; mains loss/recovery and battery-low input; repeated escalation and ACK; full-load supply endurance; and the final enclosure at 5/10 m.

Preserve logs and exact firmware manifests. No physical board, USB radio or backup circuit was connected during source development. CI builds and software tests do not close these acceptance gates.

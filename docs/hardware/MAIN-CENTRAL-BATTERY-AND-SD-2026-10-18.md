# Main-unit central backup power and SD storage

Decision: 18 October 2026. Updated: 31 October 2026, revision 2; aligned with merged PRs #316 and #317.

[Current project state](../../PROJECT_STATE.md) is authoritative for acceptance. [Runtime behavior and rollout](../current/MAIN-RESILIENCE-AND-FEATURE-SETTINGS.md) describes Main 0.1.0-pilot.10, Nano 0.1.0-bench.2, Tester 0.7.0 and HQT-3 (21 steps). Product source remains 0.20.0; record exact package/image hashes.

 Bench design requirements; no purchased module or runtime is physically qualified.

## User-approved scope

One rechargeable battery assembly and charger/UPS module, installed in the Main enclosure only, must back up the Main controller AND up to four SIM-D4 units with sixteen powered DS18B20 sensors. The user-approved required backup duration is 30 minutes for the complete Main + four SIM-D4 + sixteen-sensor load. No batteries or chargers are added to the SIM units. Existing 24 V power/data cabling remains the distribution path. Sensor Interface Modules (SIM-D4) are distinct from the cellular SIM card.

## Power architecture

Feed the protected 24 V distribution bus from a ready-made DC UPS with battery charger, automatic load sharing/changeover, reverse-current blocking and low-battery disconnect. Both the Main DC converters and all four SIM power branches must be downstream of that backed-up bus. A battery connected only to the ESP32 USB/5 V input does not satisfy this design.

Battery and UPS belong in the Main enclosure; high-current battery wiring, fuse and charging circuitry must use ready-made screw-terminal/connector assemblies, not breadboard power contacts or soldered loose lithium cells. The breadboard remains the low-current prototype logic area. Use the actual module's power terminals and manufacturer wiring instructions; this document is a functional topology, not a terminal pin map.

| Assembly | Quantity | Required checks before purchase/energization |
| --- | --- | --- |
| Ready-made nominal-24 V DC UPS/charger | 1 in Main | Compatible input PSU, matched battery chemistry/series count, uninterrupted transfer, sufficient continuous/peak current, short-circuit and low-battery protection |
| Matched rechargeable battery pack | 1 assembly in Main | Capacity from full-load test and required runtime; compatible charger/BMS; mechanically secured; temperature limits respected |
| Battery fuse and disconnect | 1 set near battery positive | DC interrupt rating, cable size and manufacturer fuse recommendation |
| Protected distribution | Main + four SIM branches | Fault in one SIM must not disable remaining branches; verify converter input ranges over complete charging/discharge voltage range |
| MicroSD module and FAT-formatted card | 1 in Main | 3.3 V SPI logic; module input voltage per datasheet; tested write endurance and power-loss behavior |

A nominal-24 V battery is NOT a constant 24 V supply. Its full-charge/low-charge range and every connected converter's limits must be checked. Add correctly rated output regulation if the selected UPS does not keep the bus within the accepted range. Do not connect a 24 V bus to a single-cell charger. A single-cell USB charger board alone does not implement this central backup architecture.

Reference architectures, not approved BOM choices or claims of Egyptian stock/pricing:
- [MEAN WELL DUPS20 manufacturer datasheet](https://www.meanwell.com/Upload/PDF/DUPS20/DUPS20-spec.pdf): a 24 V DC-UPS example with external matched lead-acid batteries; its stated battery capacity/charge-current range must be observed, so it is not automatically suitable for a small lithium pack.
- [Phoenix Contact STEP-UPS 24 V / 3 A / 46 Wh](https://www.phoenixcontact.com/en-nl/products/uninterruptible-power-supply-step-ups-24dc-24dc-3-46wh-1081430): example of integrated backup packaging. Check its full datasheet, operating voltage range, output ratings and local availability before considering an actual purchase.

## Capacity and power budget

Required load includes ESP32-S3, network interface, SD writes, Main RS485 interface, four Nano/RS485 assemblies, sixteen sensors, all DC conversion losses, and the 2G modem transmit peaks if fitted/powered. Do not infer battery capacity from ESP32 current alone. Reserve PSU capacity for simultaneous load and battery recharge; the existing 24 V / 5 A PDU figure is not a measured four-SIM load.

Measure power at the backed-up bus under maximum activity, then calculate a candidate battery energy:

`pack Wh >= measured bus W * required hours / (UPS efficiency * usable battery fraction) * reserve factor`

Illustration only: 30 W for 30 minutes, efficiency 0.85, usable fraction 0.8 and reserve factor 1.25 needs approximately 27.6 Wh, or 1.15 Ah at a nominal 24 V. This is NOT a measured BIO-EMS load or a purchase specification. Cell discharge-rate, temperature, aging, peak-current limits and charger compatibility can require a larger assembly. Required backup runtime is 30 minutes at the complete design load. This is an acceptance requirement, not a physically verified runtime guarantee; battery capacity and compliance must be confirmed by the full-load acceptance test.

## SD interface on ESP32-S3

Separate SPI3 bus avoids reinitializing the W5500's SPI2 bus. Default configurable bench pins:

| SD module SPI signal | ESP32-S3 GPIO |
| --- | --- |
| MOSI / DI | 4 |
| MISO / DO | 5 |
| CLK | 6 |
| CS | 7 |
| GND | Common signal ground |
| Supply | Per purchased module specification; ESP32 SPI signals must remain 3.3 V |

Keep W5500 on GPIO11/13/12/10 and HW-519 on GPIO17/18. Confirm board-specific exposed pins and attached peripherals before wiring. There is no SD on the Nano/SIM. Never feed the SD interface from 24 V. SD formatting on mount failure is disabled to preserve existing files. Main pilot.10 supports conditioned mains-good and battery-low GPIO inputs; both default to -1 (unwired), so their state remains unknown until fitted and configured. Battery percentage measurement is not implemented. Commissioned DS3231 UTC retention is supported; its actual wiring and cold-boot retention still require acceptance. Review RTC, modem and all other pin assignments before choosing supervision GPIOs.

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

## System Owner feature settings

Open **System Owner → System feature settings** (`/system-owner/settings`). Select the local platform or an active Main binding. Enter a reason and save. Concurrent stale revisions are rejected; actor, reason and before/after values are retained in policy history.

| Scope | Switches |
| --- | --- |
| Main, independently per binding | Ethernet, Wi-Fi, BLE, SD buffering, automatic replay, power alarms, storage alarms, SD warning percentage |
| Local platform | Reports, calibration, notification dispatch, manual/scheduled backups, client updates |

At least one communication path must remain enabled. Replay requires storage. Firmware tests candidate path settings in RAM, persists them only after another authenticated exchange using that candidate, and rolls back after 60 seconds without confirmation. A rejected revision is not retried until the owner saves a new revision. Saved and applied revisions are displayed separately; rollback details appear in controller health. A disconnected or older-firmware device must not be labelled applied merely because a save succeeded. Reconfiguration cannot be delivered to a device with no functioning path.

Platform switches are enforced at API/runtime boundaries as well as optional navigation visibility. Core authentication, audit, owner recovery and transport security cannot be turned off here. Channel credentials/enabled states and cloud controls retain their existing configuration pages. The settings catalog is explicit; it is not a claim that every possible future subsystem has a switch.

Critical Main events are visible in the customer Alarms page and owner settings. Customer acknowledgement requires ALARM_ACKNOWLEDGE; Viewer remains read-only. Owner settings use the separate SYSTEM_OWNER session, not a customer ADMIN token.

## Rollout and acceptance evidence

Upgrade the matching client backend with migration 36 before flashing Main pilot.10. Retain a coordinated installation backup and governed rollback package. Configure fallback Wi-Fi during automatic commissioning; initial binding still requires an IP path. Qualify the USB BLE adapter under the actual Windows service account and final enclosure at 5 m and 10 m.

Use standalone Tester 0.7.0, HQT-3 (21 ordered steps), for all new hardware qualification. Earlier frozen plans remain historical evidence. Check every relevant open gate HW-01 through HW-12, DEP-01 and SITE-01 in [project state](../../PROJECT_STATE.md); attach exact unit IDs, hashes, dates, instruments, raw logs and reviewer disposition. Keep unperformed checks NOT TESTED. Successful builds do not establish installed hardware or site acceptance.

The checks below remain required in addition to transport loss/recovery, every Owner switch, rejected-policy rollback, real provider delivery/repeat/ACK/recovery, bounded NVS journal faults and final installed-PC upgrade/recovery.

## Mandatory physical acceptance

1. Inspect the exact UPS, charger, pack, fuse, wiring and converter datasheets and log part numbers.
2. Connect Main + four SIM-D4 + sixteen sensors; confirm branch protection and measure rails at the furthest SIM.
3. Exercise network transmit, SD writes and fitted modem load simultaneously; capture minimum rail voltages and peak current with suitable instruments.
4. Remove the external PSU repeatedly while recording uptime/RS485 error counters. Require no reset in Main or any SIM and no corrupt SD records; restore PSU and verify uninterrupted operation and recharge.
5. Run for at least the required 30 minutes at full load (Main + four SIM-D4 + sixteen powered sensors), with capacity margin included in battery sizing; measure temperatures, usable energy and recharge time. Verify low-battery disconnect and orderly recovery without repeated brownout cycling.
6. With the platform disconnected, store at least 30 minutes of samples. Reconnect, verify historical times/values/channel mapping and no replay alarm evaluation; confirm current readings continue.
7. Test card missing/full/corrupt, failed HTTP acknowledgement, reboot with pending records and repeated replay. Preserve failed records; do not report success solely because live delivery resumed.
8. A failed/disconnected SIM cable cannot be corrected by the central battery. PC/router backup is separate; acquisition may continue to SD when those lose power.

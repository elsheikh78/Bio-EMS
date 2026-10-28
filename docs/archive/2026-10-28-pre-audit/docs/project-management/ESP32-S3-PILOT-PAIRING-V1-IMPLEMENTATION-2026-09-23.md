# ESP32-S3 Pilot Platform Pairing v1 — Implementation Record

**Date:** 23 September 2026  
**Status:** SOURCE MERGED / CI GREEN / FIRMWARE BUILDS / PHYSICAL BOARD PAIRING PENDING  
**Authoritative merge:** PR #254  
**Main commit:** `57ff5748f130e09994fd3aee804197a1cf3d8193`

## 1. Purpose

This record documents the first implemented BIO-EMS Pilot mechanism for binding one physical
ESP32-S3 controller to one logical BIO-EMS installation/device identity without producing a
different firmware image for every customer or every board.

The design goal is:

- one common firmware build for the Pilot fleet;
- one unique physical hardware identity per ESP32-S3;
- one stable BIO-EMS `platform_binding_id` per paired controller;
- no dependency on the current Windows PC hardware identity for the field controller binding;
- normal BIO-EMS Repair/Upgrade must not require reflashing or re-pairing the controller;
- final commercial PKI/mTLS remains a separate deferred security package.

This is a Pilot pairing foundation. It is **not** final commercial Device Trust evidence.

## 2. Version contract

The implemented Pilot contract is:

- Firmware: `0.1.0-pilot.1`
- MQTT/Application protocol: `1.3`
- Binding schema: `1`
- Controller model: `BIO-EMS-SC-V1`
- Firmware target: `ESP32-S3`

The firmware version is not used as the physical device identity. Multiple controllers may run
the same firmware build.

The identity chain is:

`logical installation UUID -> device_id -> hardware_uid -> platform_binding_id`

## 3. Hardware identity

The Pilot firmware derives `hardware_uid` from the ESP32-S3 station MAC address.

On successful pairing, the platform creates a UUID `platform_binding_id` and persists the
binding together with:

- logical installation;
- configured BIO-EMS `device_id`;
- ESP32 hardware UID;
- Site code;
- firmware version;
- protocol version;
- binding schema version;
- pairing timestamp;
- lifecycle status.

The pairing record is therefore not based on the Windows PC fingerprint.

## 4. Pairing-code workflow

The current source workflow is:

1. SYSTEM_OWNER creates/validates the installation configuration and target Device.
2. SYSTEM_OWNER generates a pairing code from Installation Configuration.
3. BIO-EMS generates a 12-digit numeric pairing code.
4. The code is valid for 10 minutes.
5. Only a SHA-256-derived hash of the code is persisted by the platform.
6. The physical ESP32-S3 is configured with Wi-Fi and the local BIO-EMS platform URL.
7. The pairing code is entered on the ESP32 serial console.
8. The controller submits:
   - pairing code;
   - hardware UID;
   - firmware version;
   - protocol version;
   - binding schema version.
9. The platform validates the installation/device/version contract.
10. The platform creates the stable `platform_binding_id`.
11. The ESP32 stores the returned installation/device/binding information in NVS.
12. The one-time pairing code is not stored by the firmware.

A newly issued pairing code revokes any earlier still-pending code for the same installation
Device. A claimed/expired/revoked pairing code cannot be reused.

## 5. Backend persistence

SQLite migration `030_create_device_platform_pairing` adds:

### `device_pairing_sessions`

Stores the temporary pairing lifecycle:

- installation;
- device identity;
- pairing-code hash;
- status: `PENDING | CLAIMED | EXPIRED | REVOKED`;
- expiry;
- creation evidence;
- claim evidence;
- reported hardware/firmware/protocol identity.

### `device_platform_bindings`

Stores the durable controller binding:

- `platform_binding_id`;
- binding schema version;
- installation;
- pairing session;
- device identity;
- hardware UID;
- Site code;
- firmware version;
- protocol version;
- status;
- paired/revoked evidence.

The migration also applies an immutable-identity trigger and retains binding rows for audit.

## 6. API / authorization boundary

### SYSTEM_OWNER protected operations

SYSTEM_OWNER can:

- generate a pairing code for an installation Device;
- list current device-platform bindings for an installation.

The Device must already exist in the governed installation snapshot.

### Controller claim operation

The controller claim endpoint is deliberately separate from the SYSTEM_OWNER session path.

The public claim endpoint:

- accepts only the one-time pairing claim contract;
- is rate-limited;
- rejects an invalid or reused code;
- rejects an expired code;
- rejects an already-bound physical hardware UID;
- rejects a Device that already has an active binding;
- rejects a firmware version that does not match the configured installation Device;
- rejects a protocol version other than the current Pilot protocol `1.3`.

The short-lived pairing code is the Pilot bootstrap credential. It is not intended to become a
fleet-wide reusable secret.

## 7. System Owner UI

System Owner -> Installation configuration now exposes the Pilot ESP32 pairing action for
configured Devices.

For each Device, SYSTEM_OWNER can generate the 12-digit pairing code and see its expiry time.

The UI explicitly warns that the pairing code:

- is single-use;
- must not be stored in firmware;
- must not be copied into project documentation.

## 8. ESP32-S3 firmware source

Firmware source is under:

`firmware/site-controller-esp32s3/`

Current serial commands:

- `status`
- `setwifi <ssid> <password>`
- `setplatform <url>`
- `pair <12-digit-code>`
- `clearbinding`

On successful pairing, NVS stores the durable Pilot binding metadata and configured topic names.

The firmware does **not** persist the one-time pairing code.

## 9. Binding-aware telemetry and heartbeat policy

Backend protocol `1.3` introduces binding evidence for paired Devices.

Once an ACTIVE platform binding exists, accepted data must match the authoritative binding:

### Telemetry

The platform checks:

- topic Device ID;
- Site code;
- `platformBindingId`;
- `hardwareUid`;
- protocol version.

### Heartbeat

The platform checks:

- topic Device ID;
- Site code;
- `platform_binding_id`;
- `hardware_uid`;
- firmware version;
- protocol version.

A paired Device that omits or mismatches this evidence is rejected.

Unpaired legacy Devices remain accepted during the controlled Pilot transition so the new source
does not silently break the pre-pairing Pilot data path.

## 10. Repair / Upgrade behavior

The controller binding is attached to the logical BIO-EMS installation identity, not to the
current PC motherboard or Windows installation.

Normal BIO-EMS Repair/Upgrade therefore preserves the intended controller identity relationship.

Future controlled platform-PC replacement/restore must restore or transfer the authoritative
logical installation and device registry rather than copy a controller identity from one board
to another.

## 11. Automated evidence

PR #254 final source evidence:

- CI run `35896866656`: Backend quality gates PASS; Frontend quality gates PASS.
- ESP32-S3 Firmware run `35896866666`: compile PASS and flashable artifact published.
- Internal Windows Setup run `35896866635`: PASS.
- Windows Manufacturer Tools run `35896866580`: PASS.

Firmware artifact:

- Artifact ID: `10767107823`
- Artifact name:
  `BIO-EMS-ESP32S3-Firmware-1e4fbfcbe7f32fecbee328aeabf6e94842ca7b78`
- Artifact SHA-256:
  `437795554793189233f64e7cf3520c697118090d1a79df0843a1c5c05fe6ab88`

Pilot Windows Setup artifact from the same source line:

- Artifact ID: `10767452470`
- SHA-256:
  `aac528a912e3b5a692b0687bcb0d3e9b873cb7ae8e965ee2cd80ae8e41259d2d`

## 12. What is complete in source

The following are complete as Pilot source capabilities:

- ESP32-S3 firmware project and reproducible CI compile;
- common Pilot firmware/version identity;
- hardware UID acquisition;
- 12-digit one-time pairing code;
- 10-minute expiry;
- hash-only server storage of pairing code;
- claim rate limiting;
- replay rejection;
- stable `platform_binding_id`;
- installation/device/hardware binding persistence;
- System Owner pairing-code UI;
- firmware/protocol compatibility gate;
- binding-aware telemetry and heartbeat backend enforcement;
- Windows Setup compatibility with the new database migration.

## 13. What is deliberately not yet complete

The following remain open and must not be represented as implemented/accepted:

- physical flashing of the user's actual ESP32 board;
- physical end-to-end pairing against the installed BIO-EMS Pilot;
- ESP32 MQTT telemetry publisher implementation in this firmware package;
- ESP32 heartbeat publisher implementation in this firmware package;
- sensor/RS485 acquisition implementation in this firmware package;
- offline buffering/replay implementation on the ESP32;
- device-specific MQTT credentials/certificate issuance;
- BIO-EMS Device CA / per-device X.509 identity;
- MQTT mTLS and broker topic ACL enforcement;
- revocation/replacement UI and full lifecycle;
- secure-element integration;
- Secure Boot;
- Flash Encryption;
- signed firmware/anti-rollback;
- clone detection;
- irreversible eFuse policy;
- physical power/reconnect/endurance/calibration evidence.

Therefore the current firmware is a **pairing/bootstrap foundation**, not yet a complete
production Site Controller firmware.

## 14. Next physical acceptance sequence

The next controlled hardware sequence is:

1. confirm the actual board is ESP32-S3 or change the firmware target before flashing;
2. flash `0.1.0-pilot.1`;
3. verify serial `status` and hardware UID;
4. configure Wi-Fi and customer BIO-EMS endpoint;
5. create one governed Device in the System Owner installation;
6. generate a pairing code;
7. perform the first physical pairing;
8. verify the same `platform_binding_id` in the ESP32 and BIO-EMS database/UI evidence;
9. power-cycle the ESP32 and confirm NVS persistence;
10. proceed to MQTT heartbeat/telemetry publishing and RS485 sensor integration.

## 15. Production security boundary

The authoritative commercial architecture remains:

`docs/security/device-registration.md`

The Pilot binding implemented by PR #254 is the bridge into that architecture, not a substitute
for it.

In Production, the intended progression remains:

- controller generates/holds its own private key;
- BIO-EMS Device CA issues one certificate per controller;
- MQTT uses mTLS;
- broker/backend authorize one Device/Site/topic namespace;
- Device revocation/replacement is auditable;
- signed firmware, Secure Boot and Flash Encryption are qualified only after recovery procedures
  are proven.

Do not burn irreversible ESP32 security eFuses on development/Pilot boards until those recovery,
manufacturing and replacement procedures are validated.

## 16. Acceptance status

**Source implementation:** PASS  
**ESP32-S3 compile:** PASS  
**Firmware artifact:** GENERATED  
**Windows integration:** PASS  
**Physical ESP32 pairing:** PENDING  
**Physical telemetry/heartbeat:** PENDING  
**Hardware bench qualification:** PENDING  
**Commercial Device Trust:** DEFERRED  
**BIO EGYPT commissioning/UAT:** NOT COMMISSIONED / NOT ACCEPTED

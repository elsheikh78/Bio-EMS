# BIO-EMS ESP32-S3 Site Controller Firmware — Pilot Pairing v1

## 30 September hardware integration boundary

This source is the ESP32-S3 pairing/provisioning foundation. It does not include a qualified SIM-D4 MCU firmware or MAIN-16 four-SIM Modbus acquisition/SIM800L fallback implementation. Wi-Fi bootstrap instructions below do not prove the proposed Ethernet bench path. Record exact source SHA and firmware manifest; shared firmware version alone does not identify a binary.

Status: **Pilot firmware foundation. Not Production device-trust evidence.**

## Identity model

One firmware build is used across the Pilot fleet:

- firmware version: `0.1.0-pilot.1`;
- MQTT protocol version: `1.3`;
- binding schema version: `1`.

The firmware version is **not** the device identity. Each physical controller derives a
hardware UID from the ESP32-S3 station MAC and receives a unique
`platform_binding_id` after one-time pairing.

The binding is:

`logical installation UUID -> device_id -> hardware_uid -> platform_binding_id`

This binding survives normal BIO-EMS Windows Repair/Upgrade because the logical installation
UUID is persisted with the customer data. Replacing the customer PC is handled by the
platform installation transfer/restore workflow, not by copying a controller identity.

## Pilot pairing flow

The normal Pilot workflow is now orchestrated by BIO-EMS:

1. Create and validate the logical installation in System Owner -> Installation configuration.
2. Queue the validated revision for Device Provisioning.
3. Open System Owner -> Device provisioning and connect the ESP32-S3 by USB.
4. Detect the controlled COM port and supported ESP32-S3.
5. Select the already-defined logical Device.
6. Enter the Pilot Wi-Fi credentials and the LAN-reachable BIO-EMS HTTPS origin.
7. Press **Flash & Bind Device**.
8. BIO-EMS flashes the governed common firmware, issues the short-lived pairing credential
   server-side, sends the bootstrap commands over the local serial connection, verifies the
   returned hardware UID and `platform_binding_id`, and records audit evidence.
9. The 12-digit pairing credential is not displayed to the operator and is never persisted on
   the controller.
10. When all logical Devices in the revision are bound, BIO-EMS materializes the runtime
    Device/Sensor inventory and transitions the installation to `CONFIG_ACTIVE`.

The serial commands `status`, `setwifi`, `setplatform`, `pair` and `clearbinding`
remain available for controlled engineering diagnostics only; they are not the normal
commissioning UX.

Current Pilot CLI parsing requires a Wi-Fi SSID without whitespace. This constraint is validated
before provisioning so an unsupported SSID cannot be silently misconfigured.

## Build

Use Espressif ESP-IDF 5.x:

```text
cd firmware/site-controller-esp32s3
idf.py set-target esp32s3
idf.py build
idf.py -p COMx flash monitor
```

## Security boundary for this Pilot foundation

The backend code hashes the short-lived pairing code, rate-limits public claim attempts,
rejects replay, prevents one active hardware UID from binding to multiple devices, verifies the
approved firmware/protocol version, and creates an immutable platform binding identity.

Once a Device has an ACTIVE platform binding, telemetry/heartbeat messages must carry the same
platform binding ID and hardware UID. Unpaired legacy devices remain accepted during the Pilot
transition; after pairing, omission or mismatch is rejected.

The current Pilot firmware intentionally does **not** claim the final commercial transport
security. The customer-local Windows HTTPS endpoint uses an installer-generated self-signed
certificate, so the Pilot build enables ESP-TLS insecure server-certificate verification only
for the short-lived bootstrap/pairing phase. This is explicitly testing-only behavior and must
not be carried into Production. The governed firmware manifest still records the exact source
commit so Pilot binaries remain traceable even while the Pilot firmware version remains
`0.1.0-pilot.1`.

The current customer-local HTTPS certificate model is not yet the final BIO-EMS Root CA /
Device CA / mTLS architecture. Before Production:

- validate the BIO-EMS server certificate against the controlled BIO-EMS CA;
- generate a per-device private key on the controller/secure element;
- issue a unique client certificate;
- require MQTT mTLS and topic authorization;
- enable Secure Boot, Flash Encryption and signed firmware after recovery procedures pass;
- add revocation/replacement and clone-detection tests.

Do not burn irreversible security eFuses on development boards during this Pilot stage.

# BIO-EMS ESP32-S3 Site Controller Firmware — Pilot Pairing v1

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

1. In System Owner -> Installation configuration, create/validate the installation and device.
2. Press **Generate pairing code** for the target device.
3. The platform displays one 12-digit code valid for 10 minutes.
4. Flash the same firmware image to the ESP32-S3.
5. Open the ESP32 serial console at 115200 baud.
6. Configure Wi-Fi:
   `setwifi <ssid> <password>`
7. Configure the local BIO-EMS URL:
   `setplatform https://<customer-platform-host>:<port>`
8. Pair:
   `pair <12-digit-code>`
9. Run `status`.

On success the ESP32 stores only the resulting installation/device/binding state in NVS.
The one-time pairing code is never stored.

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
security. The current customer-local HTTPS certificate model is not yet the final
BIO-EMS Root CA / Device CA / mTLS architecture. Before Production:

- validate the BIO-EMS server certificate against the controlled BIO-EMS CA;
- generate a per-device private key on the controller/secure element;
- issue a unique client certificate;
- require MQTT mTLS and topic authorization;
- enable Secure Boot, Flash Encryption and signed firmware after recovery procedures pass;
- add revocation/replacement and clone-detection tests.

Do not burn irreversible security eFuses on development boards during this Pilot stage.

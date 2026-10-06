# BIO-EMS ESP32-S3 Site Controller Firmware — Pilot Pairing v1

## 30 September hardware integration boundary

This source is the ESP32-S3 pairing/provisioning foundation and now includes the bench-candidate MAIN-16/SIM-D4 Modbus polling, mapping and USB scan path. That acquisition path and the separate SIM-D4 Nano firmware are not physically qualified; integrated SIM800L fallback also remains open. Wi-Fi bootstrap instructions below do not prove the proposed Ethernet bench path. Record exact source SHA and firmware manifest; shared firmware version alone does not identify a binary.

Status: **Pilot firmware foundation. Not Production device-trust evidence.**

## Identity model

One firmware build is used across the Pilot fleet:

- firmware version: `0.1.0-pilot.4`;
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

The Windows installer generates a customer-local HTTPS certificate. During USB provisioning,
the provisioner transfers its public certificate to the ESP32, which verifies the HTTPS peer
against that certificate for pairing and telemetry. The Pilot still skips hostname matching
because the certificate does not contain the LAN IP address; this is not a final commercial
identity model. USB provisioning also sets and stores the PC's UTC time so certificate
validation works after controller reboot. This bench clock can drift; the production design
needs trusted time synchronization or an RTC. The governed firmware manifest records the
exact source commit.

The current customer-local HTTPS certificate model is not yet the final BIO-EMS Root CA /
Device CA / mTLS architecture. Before Production:

- validate the BIO-EMS server certificate against the controlled BIO-EMS CA;
- generate a per-device private key on the controller/secure element;
- issue a unique client certificate;
- require MQTT mTLS and topic authorization;
- enable Secure Boot, Flash Encryption and signed firmware after recovery procedures pass;
- add revocation/replacement and clone-detection tests.

Do not burn irreversible security eFuses on development boards during this Pilot stage.
# SIM-D4 bench acquisition (draft)

An installation may declare `simModules` from 1 through 4. The ESP32 polls
Modbus addresses `1..simModules` at 9600 8N1 every five seconds. Address 1
contributes channels 1–4, address 2 channels 5–8, address 3 channels 9–12,
and address 4 channels 13–16. Any channel without an installed probe returns
an invalid status and is not a usable temperature reading. Only declare
modules that are physically present; assign consecutive addresses starting at
1 using the Nano D7/D8 jumpers.

Bench RS485 interface: HW-519 automatic-direction TTL-to-RS485. ESP32-S3
GPIO17 TX connects to HW-519 RXD and GPIO18 RX connects from HW-519 TXD.
GPIO16 is not used for RS485 direction control and must not be wired to the
HW-519. The module controls half-duplex transmit/receive direction in hardware.
Both boards must share the required signal reference for the bench setup. Verify
the purchased module markings, logic/power voltage, A+/B- polarity, termination
and grounding before energizing. UART pins can be overridden at build time with
`SIM_RS485_TX_GPIO` and `SIM_RS485_RX_GPIO`.

The controller posts only valid, mapped temperature readings to the BIO-EMS HTTPS endpoint.
The server verifies a per-binding token and resolves the site/device identity from the binding,
then uses the existing telemetry processing path. The installer MQTT listener remains bound to
loopback with backend credentials. The HTTPS delivery is not yet validated on physical hardware;
fault reporting, controller power monitoring, retries and buffering need field qualification.

## USB SIM diagnostics (Pilot 0.1.0-pilot.4)

Connect the controller USB and the powered SIM-D4 RS485 bus, select the controller COM
port, then use **Scan SIMs and sensors**. The serial `simscan` command checks addresses
1–4 regardless of the configured fitted count, and reports each response and four input
statuses/valid temperatures. A UART mutex prevents polling and diagnostics overlapping.
A missing response can mean absent hardware, wiring/power faults, wrong address or invalid
frames; it does not prove a module is absent. Duplicate physical RS485 addresses cannot be
reliably identified by this scan. The scan does not save mappings or commission the site.

Nano USB **Detect Nano / SIM** reads an ATmega328P bootloader signature without flash
writes, trying 57600 then 115200 baud. A compatible signature does not identify a particular
SIM instance or verify its sensor wiring. Flashing repeats detection and requires the baud
specified by the governed Nano firmware manifest; the current package requires 57600.

Re-save/revalidate unprovisioned installation revisions for the new controller version before
Flash & Bind. Existing sensor channel assignments are preserved; do not delete sensors.
Hardware tests of detection, USB serial scan, RS485 addressing and missing probes are still
required. USB diagnostics do not implement a remote network scan.

# SIM-D4 discovery and sensor mapping — integration candidate

This describes the merged SIM-D4 integration after the HW-519 interface correction; it is still bench software, not hardware acceptance. Controller firmware:
`0.1.0-pilot.4`; Nano firmware: `0.1.0-bench.2`.

- System Owner defines each Device's fitted SIM count (1–4) and maps sensor channels 1–16.
  Channels 1–4, 5–8, 9–12 and 13–16 map to SIM addresses 1, 2, 3 and 4 respectively.
  The SIM input is `(channel - 1) % 4 + 1`. Existing sensor records need not be deleted.
- The RS485 bench interface is **HW-519 automatic-direction TTL-to-RS485**. Nano D1/TX -> HW-519 RXD and D0/RX <- HW-519 TXD. ESP32-S3 GPIO17/TX -> HW-519 RXD and GPIO18/RX <- HW-519 TXD. Nano D6 and ESP32 GPIO16 are **not RS485 direction pins** in this hardware contract and stay unconnected.
- **Detect Nano / SIM** operates on a USB COM port. AVRDUDE reads the ATmega328P signature
  without flash writes at the supported bootloader speeds. A compatible chip response does
  not identify a unique SIM or test its probes. Flash checks detection again and rejects a
  baud mismatch with the installed firmware manifest.
- **Scan SIMs and sensors** operates on the ESP32 USB COM port while powered SIMs are
  attached over RS485. It checks all four addresses and displays valid responses and each
  input's status/temperature. The result is observational and does not alter mappings.
  No valid response may mean absent hardware or a fault. Duplicate bus addresses require
  hardware investigation; a scan is not proof of uniqueness.
- Installation, client Configuration, Commissioning and Sensors & Calibration show the
  calculated SIM/input mapping. Client sensor listings also include the logical device ID.
- If the runtime sensor register is empty, client Configuration explains that activation
  may need Device Provisioning / Flash & Bind, instead of claiming a search had no matches.
- Sender settings distinguish missing configuration, disabled channels and missing secrets.
  Delivery testing uses saved settings and is blocked while changes are unsaved. Saved
  settings do not prove delivery; actual provider tests remain necessary.

Re-save/revalidate an unprovisioned installation revision for controller firmware .4 before
Flash & Bind. This preserves channel assignments. Existing paired units need the normal
controlled firmware/binding recovery procedure, not deletion of customer sensor data.

Local TypeScript, lint and backend/frontend test suites pass. The corrected firmware, Windows
Setup and Manufacturer Tools automated gates passed before release merge; Physical USB/Nano/RS485/probe and delivery
acceptance remains required; no hardware is accessible in the development workspace.

# Hardware Tester 0.7.0 operating firmware guide

> Documentation review: 2026-10-28. Retained specification/policy; requirements are not proof of implementation. [Current implementation guide](<../../docs/current/HARDWARE-AND-FIRMWARE.md>) describes the reviewed source baseline; [Project state](<../../PROJECT_STATE.md>) controls current status. [Original pre-audit document](<../../docs/archive/2026-10-28-pre-audit/tools/hardware-tester/OPERATING_FIRMWARE_GUIDE.md>) preserves the unmodified earlier text. Claims below retain their original evidence date and do not establish current deployment or acceptance.


PR #316 is merged; software/CI completion and open physical checks are tracked in `PROJECT_STATE.md` (HW-01–HW-12, DEP-01). Do not turn a successful flash into an assembly PASS.

The tester now installs the existing operating firmware without the client platform:
Main `0.1.0-pilot.10` and Nano `0.1.0-bench.2`. This is separate from tab 5 QC images.
Use bench boards and retain an installation backup before changing a commissioned
board. Partition layout may change when returning from QC. The uploader neither
creates credentials nor binds a device, burns eFuses, or requests whole-chip erase.
Do not interpret successful upload as restoration of platform commissioning.

## Flash the Nano

1. Stop/finalize every run; wait for diagnostics/flash to finish.
2. Power OFF. Disconnect external 5V and HW-519 from D0/D1. Set address jumpers:
   address 1 has D7/D8 open. Connect one Nano to USB.
3. In Test setup enter assembly serial, operator, Nano COM and expected SIM address.
4. Open **6 Operating firmware**. Choose classic 57600 or new 115200 to match the
   actual board. The tested EMS-S-001 uses **new 115200**.
5. Click **Detect operating target**, review the result, then **Flash operating
   firmware and verify**. Confirm the intended board and wait without unplugging.
6. SUCCESS requires AVRDUDE write/readback and a valid 9600-baud Modbus identity
   response for the selected address. Wrong address, CRC, version/profile or missing
   runtime fails; inspect the retained log rather than assuming success.
7. The Modbus registers establish compatible protocol, not unique Nano identity
   or independent binary attestation of the patch version. Sensor acceptance is a
   separate run. Save the event ID; disconnect USB before RS485 operation.

## Flash the Main

1. Power OFF. Isolate external power and disconnect RS485 and other peripherals.
   Connect only the intended Main USB-UART cable.
2. Select Main COM in Test setup, retain the assembly serial/operator, then choose
   **Main ESP32-S3 pilot.10** in tab 6.
3. Detect, then flash and verify. The complete IDF bootloader/partition/app images
   are included. A hash mismatch, wrong target or unsafe layout blocks upload.
4. SUCCESS requires successful tool verification and a Main `status` response with
   pilot.10 and valid hardware UID. No network, platform login or pairing is needed.
5. Preserve logs under `%LOCALAPPDATA%/BIO-EMS-Hardware-Tester/firmware-events`.

## Reconnect and run

Power OFF before wiring. Use the verified project RS485 interface and approved
assembly supply. Nano USB must be disconnected because D0/D1 serve RS485. Connect
Main USB only after validating its external-power/USB path. Select **Main + Nano /
4 sensors via RS485**, expected address, Main COM and approved criteria. Fresh-data
gap must be at least 20 seconds. Start hardware run, inspect four channels, record
required checks, finalize, analyze and export PDF/JSON/CSV/checksums. Session flash
records for the same assembly are attached to the integrated run; physical board
continuity is operator-controlled and must be verified.

## Package and evidence boundaries

The CI builds Main and both Nano bootloaders from the same checkout. The package
contains `firmware/operating-manifest.json`, the QC manifest and checked offline
flash executables. Keep EXE, firmware and runtime together. Operator PCs do not
need Arduino, Python or internet. Tool/image hashes detect damage, not malicious
repackaging. Wrong firmware, bad readback and failed runtime verification never
produce SUCCESS. Real USB flashing and hardware acceptance remain physical tests.

Main pilot.10 requires the matching client backend and BLE relay. New qualification runs use HQT-3 (21 steps); see `docs/current/MAIN-RESILIENCE-AND-FEATURE-SETTINGS.md`. Do not infer physical pass from a successful flash.

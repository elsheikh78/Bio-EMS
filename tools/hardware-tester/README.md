# BIO-EMS Hardware Tester 0.3.0

Standalone Windows QC candidate. No platform services, login, commissioning,
MQTT, cloud or platform database. English UI and printable English PDF.

## Implemented

USB COM / 115200 newline JSON protocol; live temperature, sensor ROM and graph;
ESP32-S3 with one DS18B20 on GPIO4 or classic Nano with four independent probes
on D2-D5. SQLite durable runs, frozen acceptance criteria, manual inspection and
meter evidence, retained retests, JSON/CSV exports, hash-chain/finalized seal and
PDF quality-control record with reviewer signature fields. Demo data NEVER passes
as hardware evidence. Missing checks produce INCOMPLETE. Faults are not erased
by later successful readings. Manual retests retain earlier attempts in ledger.

RS485, network, SD, GSM, battery and integrated endurance are **manual evidence
checks** in the assembly profile, not automatic exercise of those interfaces.
Only direct sensor acquisition is automated in this version. Built-in USB upload of isolated QC firmware is provided for ESP32-S3 and both Nano bootloaders. Automatic operational firmware restoration is not included. Included QC sketch replaces operational firmware;
restore governed operating firmware afterwards. Do not erase flash or burn eFuses.
The previous plain-text single-sensor sketch is not protocol-compatible.

## Wiring and firmware

Power OFF before rewiring. USB power only for initial isolated bench. Verify probe
wire functions with supplier, not colors alone. Use stable soldered headers;
loose pins pushed into PCB holes are not reliable electrical connections.

ESP32: VDD=3V3, GND=GND, DQ=GPIO4; 4.7k from data to 3V3. **Disconnect SD and
other peripherals: GPIO4 overlaps operational SD MOSI.** USB-UART COM port;
USB CDC On Boot disabled. Never connect a 5V data signal to ESP32.
Nano: VDD=5V, GND=GND, independent DQ=D2/D3/D4/D5, separate 4.7k pull-up to 5V
per channel. Disconnect HW-519 D0/D1 or its power for USB programming AND reading.
D6 is not a direction control. Four-channel profile requires all four sensors;
use ESP32 scope for current single-sensor test.

Use tab **5 Flash QC firmware** with the bundled Windows package. No Arduino IDE,
Arduino CLI, Python installation, internet connection or platform login is needed
on the operator PC. Windows may still need the appropriate USB-UART driver.
Connect one intended board and select COM, assembly serial and operator in Test
setup, then select ESP32-S3, Nano classic 57600 or Nano new 115200 bootloader.
Click Detect selected board, then Flash QC firmware and verify. Detection can
reset the board. Flashing requires confirmation because it replaces operating
firmware. Disconnect external board power and interfering peripherals first.

The package supplies precompiled QC images, a SHA-256 manifest, a console
esptool helper and AVRDUDE/config/companions. Source compilation occurs only in
CI. Image and tool hashes are checked before launching any flash process.
ESP32-S3 writes the controlled bootloader, partition table, boot_app0 and app
without whole-chip erase or eFuse changes. Nano signature must match ATmega328P;
AVRDUDE performs normal readback verification (never use -F or -V). Upload baud
is separate from the QC runtime stream at 115200. A wrong selected bootloader
fails; choose the matching profile rather than overriding the signature check.
If ESP32 automatic reset fails, follow the exact board BOOT/RESET instructions
and retry using its USB-UART connector.

Success requires tool verification AND a matching bioems-qc/1 board/firmware
stream. Missing probes may still report a valid firmware stream; this is not a
sensor PASS. Logs and source/image hashes are saved under firmware-events next
to qc.sqlite. A successful flash is attached to the next matching sensor run
in the same session (same unit/COM/board) and appears in its PDF event ledger.
Physically control the connected unit: Nano has no unique hardware serial and
host evidence is not binary attestation. Failed uploads/runtime checks retain
their error logs. No port operation or app closure is allowed while flashing;
wait for completion, then start a separate QC run. Do not unplug during upload.

Keep the EXE, firmware and runtime folders together after extraction. Running
the EXE alone cannot supply the flash images/tools. Developer source checkouts
must build the staged flash package before flashing; no fake placeholder image
is distributed. Tool hashes detect package damage, not malicious repackaging.

Restore the governed operating firmware separately after isolated tests. This
version deliberately does not invent or overwrite platform binding credentials.
Before returning to Main integrated operation, restore pilot.7 through the
existing governed workflow and reconnect peripherals with power off.

## Workflow

1. Extract package and run BIO-EMS-Hardware-Tester.exe (no Python needed).
2. Enter unit serial, operator and controlled procedure/revision. Select scope.
3. Flash isolated QC firmware using tab 5 if needed, then review/approve limits BEFORE start. Defaults are examples, not accuracy specs.
4. Select COM, Start hardware run. Record inspection/continuity/voltage/response/
   recovery in Inspection while active. Voltage PASS requires meter ID, measured
   volts and approved numeric limits; out of range is forced FAIL.
5. Stop/finalize; select record, Analyze, Export PDF + JSON + CSV.
6. Print PDF, review/sign under company document control. New attempt = new run;
   reference predecessor ID in procedure. Prior finalized records cannot be edited.

For accuracy use a stable calibrated reference, ID/certificate and uncertainty in
observations. Hand warming is a separate functional test, not a stability run.
An open/interrupted run can be exported but never PASS. Full assembly scope
requires all listed manual checks; one-sensor PASS covers only that scope.
Report text must be English/Latin for consistent printer layout.

Records: %LOCALAPPDATA%/BIO-EMS-Hardware-Tester/qc.sqlite (+ WAL/SHM while active).
Close app before copying database. Hash chain and export checksums detect
accidental changes, not malicious administrator modification. No regulated
electronic signature, authentication or formal GMP qualification claimed.
Verify PC clock before tests. Graph keeps latest 300 samples/channel; DB keeps all.

## Build and verification

Python 3.12, pip install -r requirements.txt

    python -m unittest discover -s tests -v
    python smoke.py sample-output
    python app.py
    python -m PyInstaller --clean --noconfirm --onefile --windowed --name BIO-EMS-Hardware-Tester app.py

Windows CI additionally performs GUI and bundled-EXE report smoke and compiles
all three board/bootloader targets. Real USB upload, readings, fault injection and printing on
operator PC remain physical acceptance; source/CI PASS does not establish these.

## pilot.7 / Rev B alignment
Use `Main + 1 SIM / Rev B` for the current integrated assembly: this requires RTC evidence and explicit 2G bench SMS evidence; the unfitted central UPS is outside this selected scope. Legacy records keep their original frozen checks. Existing SQLite records are preserved.

The new **Capture Main pilot.7 USB diagnostics** button records status, storage, rtc, simscan and gsmdiag output into the active manual run and PDF ledger. It uses the operational firmware without reflashing or platform login. It never sends an SMS, pairs, changes credentials or changes the clock. Confirm the USB/external-power path before connecting; COM opening can reset a board. Review the reported firmware identity yourself. Capture timeout/missing output does not establish a pass. Actual receipt, rail measurements, RTC cold-boot retention, SD replay, network delivery and endurance still need recorded physical evidence.

The isolated sensor sketch remains `qc-sensors-0.1.0` because its wire protocol has not changed. It replaces the operational firmware and requires disconnecting SD from GPIO4; restore the governed pilot.7 firmware after using it. Do not use this isolated sketch as integrated Main firmware.

## Flash tool licensing
AVRDUDE is a separate GPL tool redistributed from the arduino:avr 1.8.6 pinned
core tool dependency, with its companion files and upstream license material.
Upstream source: https://github.com/avrdudes/avrdude (Arduino tool build 6.3.0-arduino17: https://github.com/arduino/avrdude).
The separate esptool helper uses esptool 4.8.1 (GPL-2.0-or-later); source and
license: https://github.com/espressif/esptool/tree/v4.8.1. PyInstaller collects
its distribution license metadata. These are separate executables, not an
Arduino IDE dependency on the operator PC.

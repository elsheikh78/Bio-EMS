# BIO-EMS Hardware Tester 0.1.0

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
Only direct sensor acquisition is automated in this version. No automatic
firmware upload/restore yet. Included QC sketch replaces operational firmware;
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

Upload firmware/QC_Sensors/QC_Sensors.ino using Arduino IDE, OneWire 2.3.8 and
DallasTemperature 4.0.5. Board ESP32S3 Dev Module or classic Nano ATmega328P;
select Nano Old Bootloader only if appropriate to purchased board. USB stream
baud 115200 is independent of bootloader upload baud. Nano has no unique chip
serial; enter assembly serial and physically control the connected unit.
Streamed version alone does not identify binary: record firmware SHA-256 and
source commit in the procedure/evidence. CI compiles both firmware targets.

## Workflow

1. Extract package and run BIO-EMS-Hardware-Tester.exe (no Python needed).
2. Enter unit serial, operator and controlled procedure/revision. Select scope.
3. Review/approve limits BEFORE start. Defaults are examples, not accuracy specs.
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
both firmware targets. Real USB upload, readings, fault injection and printing on
operator PC remain physical acceptance; source/CI PASS does not establish these.

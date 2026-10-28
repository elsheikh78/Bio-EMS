# SIM-D4 Nano USB flashing package

> Documentation review: 2026-10-28. Retained specification/policy; requirements are not proof of implementation. [Current implementation guide](<../../docs/current/HARDWARE-AND-FIRMWARE.md>) describes the reviewed source baseline; [Project state](<../../PROJECT_STATE.md>) controls current status. [Original pre-audit document](<../../docs/archive/2026-10-28-pre-audit/firmware/sim-d4-nano/README.md>) preserves the unmodified earlier text. Claims below retain their original evidence date and do not establish current deployment or acceptance.


## 26 October testing boundary

Operating Nano firmware remains 0.1.0-bench.2. Standalone Tester 0.3.0 can flash isolated four-probe QC firmware for D2–D5; disconnect HW-519 D0/D1 for USB upload AND reading. QC firmware is a different image: restore bench.2 before operational RS485 testing. Integrated Tester 0.4.0 remains proposed in open #309.

See [26 October checkpoint](../../docs/current/PROJECT-CHECKPOINT-2026-10-26.md).

The platform has a separate USB flash action for an ATmega328P Nano. The Windows CI builds the **bench candidate** from `SIM_D4/SIM_D4.ino`, packages its Intel HEX with a SHA-256 manifest, and installs the checksum-pinned AVRDUDE 8.3 tool in the client Setup. This is not a qualified field release.

Release layout under the application root:

```text
runtime/avrdude/**/avrdude.exe
runtime/avrdude/**/avrdude.conf
firmware/sim-d4-nano/manifest.json
firmware/sim-d4-nano/sim.hex
```

Manifest example (the build fills in the checksum):

```json
{
  "schemaVersion": 1,
  "target": "atmega328p-nano",
  "firmwareVersion": "0.1.0-bench.2",
  "hexFile": "sim.hex",
  "sha256": "<64 lowercase hex characters>",
  "baud": 57600
}
```

This build targets the **classic Nano bootloader at 57600 baud**. Confirm that the purchased Nano has this bootloader before flashing; a board with the newer 115200 baud bootloader needs a separately built and versioned manifest. The platform displays the installed firmware version automatically. The tool checks SHA-256, writes through the Nano bootloader, and relies on AVRDUDE's normal readback verification. Disconnect the RS485 transceiver from D0/D1 or its power during USB programming.

## Bench wiring and protocol

| Nano pin | Connection |
| --- | --- |
| D2, D3, D4, D5 | CH1–CH4 DS18B20 DATA; separate 4.7 kOhm pull-up from each DATA to regulated 5 V |
| D0 / RX | HW-519 TXD (shared with USB programming) |
| D1 / TX | HW-519 RXD (shared with USB programming) |
| D6 | Not used for RS485; leave unconnected |
| D7, D8 | Address bits to GND; floating = 1, D7 = 2, D8 = 3, both = 4 |
| 5 V, GND | Regulated supply and common signal ground; probes use externally powered three-wire mode |

The bench RS485 interface is the HW-519 automatic-direction TTL-to-RS485 module. Do not add or wire a DE/RE direction signal. Connect Nano D1/TX to HW-519 RXD, Nano D0/RX to HW-519 TXD, common GND, and A+ to A+ / B- to B-. RS485 is Modbus RTU 9600 baud, 8N1, slave address 1–4. Function 03 reads holding registers, zero-based addressing. One DS18B20 per channel; the code uses Skip ROM, so multiple sensors on the same channel are unsupported.

| Register | Meaning |
| --- | --- |
| 0 | Wire firmware identifier 0x0100 (register profile unchanged in bench.2) |
| 1 | Register profile 1 |
| 2 | Slave address |
| 3 | Channel count = 4 |
| 4–7 | Signed temperature in 0.1 °C, two's complement; 0x8000 means invalid |
| 8–11 | Channel status: 0 valid, 1 missing, 2 CRC fault, 3 invalid/power-on |
| 12 | Age of most recent sample in seconds |

The firmware has not been tested on a physical board. Qualify 1 m and 20 m probe runs, the four independent channels, unplug/replug and CRC failures, temperature accuracy, RS485 addressing and bus termination, and power/restart before calling it a field release. PR #280 provides ESP32-S3 Modbus polling, channel mapping and HTTPS telemetry, plus USB SIM scanning in controller firmware 0.1.0-pilot.4. Flashing the Nano alone does not bind a controller or create platform readings; complete the System Owner installation and Flash & Bind workflow. Physical acceptance is still required.

AVRDUDE is redistributed as a separate GPL-2.0 tool from the upstream release; review the upstream `COPYING` and source offer for commercial distribution. The BIO-EMS Nano sketch is a separate application and is not linked into AVRDUDE.

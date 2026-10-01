# SIM-D4 Nano USB flashing package

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
  "firmwareVersion": "0.1.0-bench.1",
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
| D0 TX, D1 RX | RS485 transceiver DI, RO (shared with USB programming) |
| D6 | RS485 DE and /RE tied together; low = receive |
| D7, D8 | Address bits to GND; floating = 1, D7 = 2, D8 = 3, both = 4 |
| 5 V, GND | Regulated supply and common signal ground; probes use externally powered three-wire mode |

RS485 is Modbus RTU 9600 baud, 8N1, slave address 1–4. Function 03 reads holding registers, zero-based addressing. One DS18B20 per channel; the code uses Skip ROM, so multiple sensors on the same channel are unsupported.

| Register | Meaning |
| --- | --- |
| 0 | Firmware version 0x0100 (bench.1) |
| 1 | Register profile 1 |
| 2 | Slave address |
| 3 | Channel count = 4 |
| 4–7 | Signed temperature in 0.1 °C, two's complement; 0x8000 means invalid |
| 8–11 | Channel status: 0 valid, 1 missing, 2 CRC fault, 3 invalid/power-on |
| 12 | Age of most recent sample in seconds |

The firmware has not been tested on a physical board. Qualify 1 m and 20 m probe runs, the four independent channels, unplug/replug and CRC failures, temperature accuracy, RS485 addressing and bus termination, and power/restart before calling it a field release. PR #280 provides ESP32-S3 Modbus polling, channel mapping and HTTPS telemetry, plus USB SIM scanning in controller firmware 0.1.0-pilot.3. Flashing the Nano alone does not bind a controller or create platform readings; complete the System Owner installation and Flash & Bind workflow. Physical acceptance is still required.

AVRDUDE is redistributed as a separate GPL-2.0 tool from the upstream release; review the upstream `COPYING` and source offer for commercial distribution. The BIO-EMS Nano sketch is a separate application and is not linked into AVRDUDE.

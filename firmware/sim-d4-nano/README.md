# SIM-D4 Nano USB flashing package

The platform has a separate USB flash action for an ATmega328P Nano. It remains disabled until a validated firmware release and AVRDUDE are installed on the BIO-EMS Windows station. No SIM firmware binary is released in this repository yet.

Release layout under the application root:

```text
runtime/avrdude/avrdude.exe
runtime/avrdude/avrdude.conf
firmware/sim-d4-nano/manifest.json
firmware/sim-d4-nano/sim.hex
```

Manifest example (replace checksum and version with those of the actual approved build):

```json
{
  "schemaVersion": 1,
  "target": "atmega328p-nano",
  "firmwareVersion": "0.1.0",
  "hexFile": "sim.hex",
  "sha256": "<64 lowercase hex characters>",
  "baud": 57600
}
```

Use 57600 for the classic Nano bootloader or 115200 for a board with the newer bootloader, as verified for the actual purchased board. The firmware version entered in the platform must match the manifest. The tool checks SHA-256, writes through the Nano bootloader, and relies on AVRDUDE's normal readback verification. A successful flash does not establish sensor or RS485 functionality; those need a separate bench test. Do not install a candidate HEX as a governed release without that test.

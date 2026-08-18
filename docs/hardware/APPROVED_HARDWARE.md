# BIO-EMS Approved Hardware Register

## Current status

**NO PRODUCTION OR PILOT HARDWARE REVISION IS RELEASED.**

The repository currently approves an architectural direction only:

- BIO-EMS Site/Zone Controller as the field hardware boundary;
- one generic BIO-EMS Device firmware identity hosted by a Controller;
- ESP32-based first implementation direction;
- industrial DS18B20 temperature Sensors for BIO EGYPT Phase 1;
- Home Run wiring from each Sensor to a dedicated Controller channel;
- MQTT telemetry/heartbeat and bounded offline replay behavior.

These decisions do not constitute an electrical schematic, PCB release, approved BOM,
cable limit, environmental rating, enclosure release, firmware release, prototype
acceptance, FAT approval, or authorization to procure the Pilot quantity.

## Release register

| Hardware item                     | Released revision | Status       | Evidence                                                                    |
| --------------------------------- | ----------------- | ------------ | --------------------------------------------------------------------------- |
| BIO-EMS Site Controller v1        | None              | NOT RELEASED | S16-04 review and S16-08 design freeze/FAT pending                          |
| Industrial DS18B20 probe assembly | None              | NOT RELEASED | assembly specification, supplier evidence, and calibration evidence pending |
| Controller enclosure/panel        | None              | NOT RELEASED | Site environment, mechanical design, and rating evidence pending            |
| Sensor cable/termination system   | None              | NOT RELEASED | cable design, route survey, and prototype limit evidence pending            |
| Controller firmware               | None              | NOT RELEASED | implementation, versioning, security, buffering, and FAT pending            |

## Release rule

An item enters this register as `RELEASED` only after the controlled design package
identifies:

1. part or assembly name and immutable revision;
2. schematic/drawing/BOM/firmware evidence as applicable;
3. approved datasheets and substitutions;
4. prototype and FAT report;
5. approver and approval date;
6. known limitations and applicable Site constraints.

Concept documents, supplier quotations, development boards, breadboards, sample
probes, and successful bench readings are not released hardware.

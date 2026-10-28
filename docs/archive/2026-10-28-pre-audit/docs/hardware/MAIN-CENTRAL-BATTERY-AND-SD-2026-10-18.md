# Main-unit central backup power and SD storage

Decision: 18 October 2026. Bench design requirements; no purchased module or runtime is physically qualified.

## User-approved scope

One rechargeable battery assembly and charger/UPS module, installed in the Main enclosure only, must back up the Main controller AND up to four SIM-D4 units with sixteen powered DS18B20 sensors. User-confirmed backup target: 30 minutes at full load. No batteries or chargers are added to the SIM units. Existing 24 V power/data cabling remains the distribution path. Sensor Interface Modules (SIM-D4) are distinct from the cellular SIM card.

## Power architecture

Feed the protected 24 V distribution bus from a ready-made DC UPS with battery charger, automatic load sharing/changeover, reverse-current blocking and low-battery disconnect. Both the Main DC converters and all four SIM power branches must be downstream of that backed-up bus. A battery connected only to the ESP32 USB/5 V input does not satisfy this design.

Battery and UPS belong in the Main enclosure; high-current battery wiring, fuse and charging circuitry must use ready-made screw-terminal/connector assemblies, not breadboard power contacts or soldered loose lithium cells. The breadboard remains the low-current prototype logic area. Use the actual module's power terminals and manufacturer wiring instructions; this document is a functional topology, not a terminal pin map.

| Assembly | Quantity | Required checks before purchase/energization |
| --- | --- | --- |
| Ready-made nominal-24 V DC UPS/charger | 1 in Main | Compatible input PSU, matched battery chemistry/series count, uninterrupted transfer, sufficient continuous/peak current, short-circuit and low-battery protection |
| Matched rechargeable battery pack | 1 assembly in Main | Capacity from full-load test and required runtime; compatible charger/BMS; mechanically secured; temperature limits respected |
| Battery fuse and disconnect | 1 set near battery positive | DC interrupt rating, cable size and manufacturer fuse recommendation |
| Protected distribution | Main + four SIM branches | Fault in one SIM must not disable remaining branches; verify converter input ranges over complete charging/discharge voltage range |
| MicroSD module and FAT-formatted card | 1 in Main | 3.3 V SPI logic; module input voltage per datasheet; tested write endurance and power-loss behavior |

A nominal-24 V battery is NOT a constant 24 V supply. Its full-charge/low-charge range and every connected converter's limits must be checked. Add correctly rated output regulation if the selected UPS does not keep the bus within the accepted range. Do not connect a 24 V bus to a single-cell charger. A single-cell USB charger board alone does not implement this central backup architecture.

Reference architectures, not approved BOM choices or claims of Egyptian stock/pricing:
- [MEAN WELL DUPS20 manufacturer datasheet](https://www.meanwell.com/Upload/PDF/DUPS20/DUPS20-spec.pdf): a 24 V DC-UPS example with external matched lead-acid batteries; its stated battery capacity/charge-current range must be observed, so it is not automatically suitable for a small lithium pack.
- [Phoenix Contact STEP-UPS 24 V / 3 A / 46 Wh](https://www.phoenixcontact.com/en-nl/products/uninterruptible-power-supply-step-ups-24dc-24dc-3-46wh-1081430): example of integrated backup packaging. Check its full datasheet, operating voltage range, output ratings and local availability before considering an actual purchase.

## Capacity and power budget

Required load includes ESP32-S3, network interface, SD writes, Main RS485 interface, four Nano/RS485 assemblies, sixteen sensors, all DC conversion losses, and the 2G modem transmit peaks if fitted/powered. Do not infer battery capacity from ESP32 current alone. Reserve PSU capacity for simultaneous load and battery recharge; the existing 24 V / 5 A PDU figure is not a measured four-SIM load.

Measure power at the backed-up bus under maximum activity, then calculate a candidate battery energy:

`pack Wh >= measured bus W * required hours / (UPS efficiency * usable battery fraction) * reserve factor`

Illustration only: 30 W for 30 minutes, efficiency 0.85, usable fraction 0.8 and reserve factor 1.25 needs approximately 27.6 Wh, or 1.15 Ah at a nominal 24 V. This is NOT a measured BIO-EMS load or a purchase specification. Cell discharge-rate, temperature, aging, peak-current limits and charger compatibility can require a larger assembly. The user-confirmed runtime target is 30 minutes. Actual pack capacity remains subject to full-load measurement and the 30-minute physical acceptance test; no measured runtime is claimed.

## SD interface on ESP32-S3

Separate SPI3 bus avoids reinitializing the W5500's SPI2 bus. Default configurable bench pins:

| SD module SPI signal | ESP32-S3 GPIO |
| --- | --- |
| MOSI / DI | 4 |
| MISO / DO | 5 |
| CLK | 6 |
| CS | 7 |
| GND | Common signal ground |
| Supply | Per purchased module specification; ESP32 SPI signals must remain 3.3 V |

Keep W5500 on GPIO11/13/12/10 and HW-519 on GPIO17/18. Confirm board-specific exposed pins and attached peripherals before wiring. There is no SD on the Nano/SIM. Never feed the SD interface from 24 V. SD formatting on mount failure is disabled to preserve existing files. The firmware does not implement battery percentage measurement, battery alarm GPIOs or RTC chip access in this change.

## Mandatory physical acceptance

1. Inspect the exact UPS, charger, pack, fuse, wiring and converter datasheets and log part numbers.
2. Connect Main + four SIM-D4 + sixteen sensors; confirm branch protection and measure rails at the furthest SIM.
3. Exercise network transmit, SD writes and fitted modem load simultaneously; capture minimum rail voltages and peak current with suitable instruments.
4. Remove the external PSU repeatedly while recording uptime/RS485 error counters. Require no reset in Main or any SIM and no corrupt SD records; restore PSU and verify uninterrupted operation and recharge.
5. Run Main plus all four SIM-D4 modules and sixteen probes for at least 30 minutes at full load, including the design margin; measure temperatures, usable energy and recharge time. Verify low-battery disconnect and orderly recovery without repeated brownout cycling.
6. With the platform disconnected, store at least 30 minutes of samples. Reconnect, verify historical times/values/channel mapping and no replay alarm evaluation; confirm current readings continue.
7. Test card missing/full/corrupt, failed HTTP acknowledgement, reboot with pending records and repeated replay. Preserve failed records; do not report success solely because live delivery resumed.
8. A failed/disconnected SIM cable cannot be corrected by the central battery. PC/router backup is separate; acquisition may continue to SD when those lose power.

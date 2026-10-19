# BIO-EMS — Hardware Inventory and Preparation Record

**Date:** 19 October 2026 (Cairo)  
**Revision:** A  
**Basis:** User statements and component photographs supplied during this session. This is an inventory and planning record, not an electrical acceptance certificate.

## 1. Agreed scope

Prepare **one Main unit and one SIM-D4 sensor unit** for the first prototype. Keep the second Nano and third RS485 module as spares. SIM-D4 means the sensor interface module; SIM800L means the cellular modem.

The prototype SIM-D4 has provision for four DS18B20 temperature channels. Expansion beyond this first pair remains outside the immediate assembly scope.

## 2. Inventory recorded today

| Component | Quantity / evidence | Current allocation or status |
|---|---|---|
| ESP32-S3 board | 1, confirmed by user; photographed previously | Main controller |
| Arduino Nano V3 | 2, confirmed by user | 1 SIM-D4; 1 spare |
| HW-519 TTL/RS485 modules | 3, confirmed by user and photos | 1 Main; 1 SIM-D4; 1 spare |
| Full-size solderless breadboards | Photographed; two planned for this build | One per unit; verify ESP32 width/access before insertion |
| HW-125 microSD SPI module | Photographed, available | Main; supply and logic compatibility still to be verified |
| DS3231 RTC module | Photographed, available; battery holder shown empty | Main; battery/charging arrangement and firmware pins unresolved |
| SIM800L modem | Photographed with loose headers and antenna | Main; power and interface preparation pending |
| DS18B20 waterproof probes | Available; user reports ordered quantities present | Allocate 4 to first SIM-D4; exact stock count not recorded |
| XL4015 adjustable buck module | Photographed, available | Supply allocation and output adjustment pending |
| LM2596 HW-411 adjustable buck | Photographed, available | Planned 5 V supply for first SIM-D4; not yet adjusted or tested |
| GOLDEN SUN S-72-24 power supply | Photographed: label states 24 V DC, 3 A, 72 W | Shared DC source; no output measurement recorded |
| Dupont leads and rigid breadboard jumper kit | Photographed, available | Low-current prototype connections |
| DC barrel/screw adapters and PCB screw terminals | User states 5 of each type | Verify fit; PCB terminals require secure soldered mounting |
| 4.7 kΩ resistors | Available; user identification and photographs | One pull-up for each independent sensor channel |
| Other resistor bags | Photographed; some values only provisionally identified | Confirm markings or measure before use |
| Electrolytic capacitors | Photographed examples marked 10 µF / 25 V | Not substitutes for the requested modem bulk capacitor |
| Ceramic capacitors | Photographed; markings not fully confirmed | Verify values before allocation |
| 2N2222A transistors | 10, confirmed by user | Stock; no circuit allocation or pinout approved |
| LEDs | Photographed; exact count and emission colour not confirmed | Stock; use with suitable series resistor |

Availability does not establish electrical compatibility, functionality, or sufficient quantity for every future expansion.

## 3. Items explicitly reported unavailable

1. **W5500 SPI Ethernet module.** Ethernet assembly and testing remain pending.
2. **1000 µF / 10 V Low ESR capacitor.** SIM800L supply completion and powered modem testing remain pending.

Other items not photographed or counted must not automatically be treated as missing. Battery backup components were not verified in this session.

## 4. First prototype allocation

| Main unit | SIM-D4 unit |
|---|---|
| ESP32-S3, one HW-519, microSD module, DS3231 | Nano, one HW-519, four DS18B20 probes |
| SIM800L reserved for later power-up | Four separate 4.7 kΩ pull-ups |
| W5500 pending procurement | LM2596 output to be measured and set to 5.00 V before connection |
| Regulated supply arrangement still to be finalised | One breadboard |
| One breadboard | Remaining Nano and HW-519 kept as spares |

## 5. Assembly decisions and outstanding checks

- Work begins with power disconnected and mechanical placement only. Nano straddles the breadboard centre gap. Confirm that the wider ESP32 leaves usable connection holes; do not force an unsuitable fit.
- Keep buck converters and modem on insulated supports beside the breadboards.
- Several photographed modules have unpopulated connection holes. Loose wire insertion is not a reliable connection. Have the supplier fit suitable soldered headers/leads for subsequent plug-in assembly.
- Never connect the 24 V output directly to ESP32, Nano, SIM800L, or their low-voltage rails.
- Measure and adjust each regulator with loads disconnected before connecting electronics. Multimeter availability has been asked about but not confirmed.
- Have a qualified electrician prepare the exposed mains input, protective earth, enclosure and terminal protection. Do not infer mains terminal positions from photographs.
- HW-519 supply and UART logic levels, especially compatibility with ESP32, remain unresolved. Its bus-side terminal marked as earth must not be assumed identical to TTL signal GND without verification.
- Verify microSD module supply requirements, RTC connection pins and battery circuit, SIM800L board pin labels and supply design before energising those modules.
- Confirm sensor wire colours against the supplied probe specification. Final wiring must agree with the firmware actually flashed.
- The requested full wiring pictures remain to be completed after the unresolved interfaces are verified. Earlier placement illustrations are not approved wiring diagrams.

## 6. Actual work status at session close

| Activity | Recorded result |
|---|---|
| Photograph review and inventory discussion | Completed for the items listed above |
| Selection of initial build scope | Agreed: 1 Main + 1 SIM-D4 |
| Physical installation / final wiring | No completion confirmed by user |
| PSU or regulator voltage measurement | No readings supplied |
| Continuity and short-circuit checks | Not recorded |
| Firmware flashing during this session | Not recorded |
| Sensor, RS485, SD, RTC, GSM or Ethernet functional tests | Not recorded |
| Battery-backup test | Not recorded |

**No hardware test is marked PASS on the basis of photographs or discussion alone. This record documents the session only; it does not change firmware or software.**

## 7. Next session sequence

1. Confirm multimeter availability and secure module connection hardware.
2. Complete unpowered placement and inspect for shorts or inaccessible pins.
3. Prepare and measure the DC source; adjust the SIM-D4 regulator to 5.00 V with the Nano disconnected.
4. Bring up the Nano and one sensor first; then extend to four channels.
5. Resolve Main supply and interface compatibility, then test individual peripherals and the RS485 link.
6. Add Ethernet and cellular testing when the outstanding parts and required supply preparations are complete.

Record measured values, firmware versions and actual PASS/FAIL results as tests are performed.

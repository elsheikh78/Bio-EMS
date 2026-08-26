# BIO-EMS Hardware Protection, BOM and Cable FAT Update — 2026-08-27

## Status

**ENGINEERING DISCUSSION / PROTOTYPE PLANNING — NOT A DESIGN FREEZE OR PROCUREMENT AUTHORIZATION**

This checkpoint records the hardware work completed after `PILOT-HARDWARE-DISCUSSION-2026-08-26.md`. It does not override `APPROVED_HARDWARE.md`: no production or Pilot hardware revision is released yet.

## 1. Standard and Advanced protection direction

Two Controller protection tiers were documented for prototype development.

### Standard

Per DS18B20 Home Run channel, the prototype protection direction is:

`Field Sensor -> 3-pin terminal -> low-capacitance ESD/TVS clamp -> series resistor -> protected 1-Wire interface/GPIO`

with externally powered 3-wire DS18B20 (`VDD / DATA / GND`), initial 4.7 kOhm DATA pull-up to 3.3 V, branch current protection, and local supply decoupling.

Prototype starting values/candidates:

- DQ ESD/TVS candidate: Nexperia `PESD3V3U1UT` or technically suitable low-capacitance 3.3 V equivalent;
- DATA series resistor: 68 Ohm initial value, with 33/47/68/100 Ohm sweep during FAT;
- DATA pull-up: 4.7 kOhm initial value, subject to waveform/cable evidence;
- branch PPTC candidate: Bourns `MF-PSMF010X` / `MF-PSMF020X` or suitable equivalent;
- local decoupling: 100 nF plus approximately 10 uF starting point.

These are prototype candidates, not released production part numbers or immutable values.

### Advanced

Advanced retains the Standard protections and adds planning provisions for:

- additional EMI filtering;
- stronger sensor-supply transient protection;
- stronger fault containment/diagnostics;
- optional galvanic isolation by bank where Site grounding/noise evidence justifies it.

Isolation is not automatically populated on every channel and remains DNP/TBD until measurements justify the cost and complexity.

## 2. Placement rule

The ESD/TVS device must be placed immediately behind the field connector with a short, low-inductance discharge path. The series resistor belongs on the protected side toward the electronics. An unprotected field trace must not traverse the PCB before the clamp.

## 3. Master BOM planning

A planning BOM was prepared for Standard and Advanced Controllers. It includes current candidates for:

- classic ESP32 development hardware for laboratory work;
- W5500 wired Ethernet;
- SIM800L-class SMS failover candidate;
- protected 24 VDC power direction and DC/DC conversion;
- RS485 prototype interface;
- 16 Home Run terminal positions and cable entries;
- IP65 enclosure candidate;
- per-channel ESD/TVS, series resistor, pull-up, PPTC and decoupling;
- Advanced-only EMI/surge/isolation/diagnostic provisions.

The planning BOM must **not** be interpreted as permission to buy the complete 13/16-channel Pilot hardware.

## 4. Architecture blocker retained

The full 13/16-channel architecture is still **UNFROZEN**. The classic 38-pin ESP32 must not be turned into a 16-channel direct-GPIO field Controller. CH01 and CH02-CH04 direct GPIO remain laboratory FAT tools only.

After four-channel FAT, deliberately select the full-channel architecture from dedicated 1-Wire master/line-driver, multiplexer, secondary-MCU/I/O architecture, or the approved dedicated-master direction, subject to local availability and evidence.

## 5. CH01 buy-now scope

The currently permitted purchase scope remains the small CH01 laboratory prototype only. Current planning items include:

- 1 classic 38-pin ESP32 development board;
- 1 full-size solderless breadboard;
- 1 genuine/traceable DS18B20 waterproof probe candidate;
- 1 4.7 kOhm pull-up resistor;
- 1 secure 3-pin terminal transition;
- short breadboard jumpers;
- representative 3-core test cable lengths;
- optional low-capacitance ESD/TVS candidate for the second test pass.

The protection network is added only after the unprotected baseline cable/link behavior is characterized, then the same FAT is repeated.

## 6. Cable FAT decision

Do not freeze shielded or unshielded cable by assumption. Compare both experimentally because shielding can improve EMI immunity while additional cable capacitance can reduce 1-Wire timing margin.

### Option A — baseline

- 3-core stranded copper control/instrumentation cable;
- nominal `3 x 0.5 mm2`;
- unshielded;
- test at 5 m, 10 m, 20 m and measured worst-case Site route.

### Option B — industrial comparison

- shielded instrumentation/control cable, LAPP UNITRONIC LiYCY `3 x 0.5 mm2` or technically equivalent;
- overall shield;
- same staged test lengths;
- initial FAT shield termination at Controller end only; do not bond the shield to Sensor GND at the far end during the initial comparison.

### Option C — deferred fallback

A `3 x 0.75 mm2` shielded option is deferred unless voltage-drop or mechanical evidence requires the larger conductor. Increasing conductor area does not by itself solve 1-Wire cable-capacitance/timing limitations.

### Cable procurement limit

For CH01, buy only test quantities. Practical planning quantity is approximately 25 m unshielded `3 x 0.5 mm2` plus approximately 25 m shielded `3 x 0.5 mm2`, or supplier-cut 5/10/20 m samples. Do not buy Pilot reels before FAT and Site route measurements.

## 7. Cable FAT evidence

For each cable option/length, run the baseline without optional DATA TVS first and then repeat with the proposed protection populated. Record at minimum:

- exact cable manufacturer/type and actual length;
- Sensor ROM ID;
- test duration;
- read count and CRC/read error count;
- disconnect/reconnect count;
- power-cycle recovery;
- Controller-end and practical Sensor-end supply voltage;
- DATA waveform/rise-time/ringing evidence where available;
- protection configuration, series resistance and pull-up value;
- Pass/Fail result.

Key stages should target approximately 24 hours of continuous operation as already established by the CH01 discussion checkpoint.

## 8. Working engineering files generated

The following latest working artifacts were generated during this checkpoint and should be retained with the engineering package:

- `BIO-EMS_Standard_DS18B20_Protection_BOM_Rev1.docx`
- `BIO-EMS_Advanced_DS18B20_Protection_BOM_Rev1.docx`
- `BIO-EMS_Hardware_Master_BOM_Planning_2026-08-27_v2.xlsx`

They are working engineering artifacts only. Their presence in a repository or document store does not change the release status in `APPROVED_HARDWARE.md`.

## 9. Resume point

1. Purchase only the CH01 laboratory BOM and cable samples.
2. Confirm exact received ESP32 and DS18B20 parts and probe pinout.
3. Run short-cable CH01 baseline.
4. Run unshielded 5/10/20 m and worst-case-route FAT.
5. Repeat with shielded 3 x 0.5 mm2 cable.
6. Repeat representative tests after adding the ESD/TVS/series protection network.
7. Expand to CH02-CH04 only after CH01 passes.
8. Freeze the full 13/16-channel 1-Wire architecture only after the four-channel evidence is reviewed.
9. Only then prepare a procurement-authorized Pilot BOM/revision.

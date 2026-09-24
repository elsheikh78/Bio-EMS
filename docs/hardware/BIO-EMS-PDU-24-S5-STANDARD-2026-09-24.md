# BIO-EMS PDU-24 Standard — Product Architecture

**Decision date:** 24 September 2026  
**Status:** APPROVED STANDARD PRODUCT ARCHITECTURE / DETAILED ELECTRICAL RELEASE OPEN  
**Applies to:** BIO-EMS Pilot and future small/medium fixed-site installations

## 1. Product decision

BIO-EMS shall not redesign the power-distribution unit for every project.

The standard product is:

**BIO-EMS PDU-24-S5**

with the following fixed product envelope:

- 230 VAC nominal input;
- industrial 24 VDC / 5 A power stage;
- 24 V field-power backbone;
- integrated DC-UPS/charger function or a standard compatible DIN-rail UPS module;
- external 24 V battery connection;
- eight protected 24 V output branches;
- AC/DC/UPS health monitoring;
- DIN-rail/serviceable construction;
- common terminal/label scheme across Sites.

Project-specific work is limited to:

- which standard outputs are used;
- field cable length/gauge;
- battery capacity/autonomy selection;
- optional surge/environment accessories;
- enclosure size only if the physical installation requires a larger standard cabinet.

The internal electrical architecture, branch numbering, nominal voltage and service procedure remain
the same across projects.

## 2. Why 24 V / 5 A is the standard size

The current conservative El Manial design envelope is approximately:

- continuous: 1.15 A @ 24 V;
- short peak: 1.95 A @ 24 V.

The current October modular architecture is expected to remain materially below 5 A even with two
Site Controllers, multiple SIM modules and one COM-CELL. Exact October verification remains part of
its later load study.

A 24 V / 5 A / 120 W unit therefore provides a useful standard size for the present Pilot class
without forcing each Site to use a different PSU.

The standard rating is a product ceiling, not an expected normal load.

If a future Site exceeds the released S5 load envelope, BIO-EMS should use a defined expansion or
higher-power product variant rather than modify the S5 wiring on an ad-hoc basis.

## 3. Standard output schedule

The PDU-24-S5 provides eight labelled protected branches:

| Output | Default role | Initial branch protection target |
| --- | --- | ---: |
| O1 | Site Controller A | 1 A |
| O2 | Site Controller B / controller expansion | 1 A |
| O3 | SIM field bus A | 1 A |
| O4 | SIM field bus B | 1 A |
| O5 | COM-CELL | 2 A |
| O6 | Auxiliary 24 V #1 | 1 A |
| O7 | Auxiliary 24 V #2 | 1 A |
| O8 | Spare / future expansion | 1 A |

The output labels are fixed product labels. A Site may leave unused branches empty.

The final fuse/eFuse values must be released against actual prototype startup and fault-current
measurements. The table above is the design target, not a substitute for electrical validation.

The sum of individual branch protection ratings may exceed 5 A because the PSU/main protection
limits the total available output and the branch ratings protect individual wiring/load faults.

## 4. Standard electrical architecture

```text
              230 VAC
                 |
          AC input terminal
             L / N / PE
                 |
        Main isolator/protection
                 |
        Industrial 24 V / 5 A PSU
                 |
        Standard DC-UPS/charger
                 |
              24 V BUS
                 |
        PDU low-voltage distribution
                 |
   +------+------+------+------+------+------+------+------+
   |      |      |      |      |      |      |      |
  O1     O2     O3     O4     O5     O6     O7     O8
  SC-A   SC-B   SIM-A  SIM-B  CELL   AUX1   AUX2   SPARE
```

The first Pilot shall continue to use certified industrial mains-side components. BIO-EMS may
design a dedicated low-voltage distribution/monitoring PCB, but should not create a custom
230 VAC switch-mode power supply for the Pilot.

## 5. Standard monitoring signals

The PDU shall expose explicit power-health information to BIO-EMS.

Minimum logical states:

- AC present;
- DC output healthy;
- UPS on battery;
- battery low/fault;
- charger/UPS fault where supported.

Preferred physical implementation:

- dry-contact outputs from industrial PSU/DC-UPS modules;
- isolated digital input path into the Site Controller or a small PDU monitoring interface.

Power failure shall not be inferred only from a Site Controller reboot or network loss.

## 6. Battery interface

The PDU output architecture remains fixed; the battery is a replaceable external energy-storage
component.

Standard battery connection:

- nominal 24 V battery bank;
- keyed/covered field-service connector or protected terminal;
- dedicated battery protection according to the selected UPS/charger datasheet;
- no exposed unprotected battery wiring.

For the El Manial four-hour autonomy target, the current preferred SLA/AGM starting point is:

**2 × 12 V / 18 Ah in series = 24 V / 18 Ah nominal**

This battery set is not an intrinsic part of the PDU electronics. A different Site may use another
approved battery capacity while using the same PDU-24-S5.

Battery chemistry must match the charger/UPS profile. SLA/AGM and LiFePO4 are not interchangeable
without an explicitly compatible charger/BMS design.

## 7. Standard field-power interface

Every standard output presents:

- +24 V;
- 0 V.

SIM field-bus wiring may carry:

- +24 V;
- 0 V;
- RS485 A;
- RS485 B;
- shield where required.

The PDU does not route RS485 internally as a power-distribution function; the Site Controller /
field-bus terminal architecture owns the communication path. Power and communication may share one
multi-pair field cable only when the released cable design permits it.

## 8. Standard construction philosophy

To keep cost competitive and serviceable:

- use one PDU product architecture for both current Pilot Sites;
- use standard DIN-rail PSU and UPS modules;
- use one low-voltage distribution board/terminal scheme;
- use replaceable branch fuses or standardized electronic protection;
- use common terminal numbers and labels;
- use one service manual;
- qualify approved alternate PSU/UPS brands without changing the customer wiring;
- keep batteries external/replaceable;
- do not over-specify redundant dual PSU hardware in the standard S5 model.

A future high-availability variant may be introduced separately if a customer requires redundant
power supplies or dual independent DC buses.

## 9. Standard terminal concept

Final connector technology remains to be selected, but terminal numbering shall follow a stable
scheme:

```text
X1  AC INPUT
    X1.1  L
    X1.2  N
    X1.3  PE

X2  BATTERY
    X2.1  BAT+
    X2.2  BAT-

X3  OUTPUT O1
    X3.1  +24V
    X3.2  0V

...

X10 OUTPUT O8
    X10.1 +24V
    X10.2 0V

X11 STATUS
    AC_OK
    DC_OK
    ON_BATTERY
    BATTERY_LOW/FAULT
    COMMON
```

The released schematic may refine contact polarity and terminal count, but the product shall keep a
stable documented terminal scheme between Sites.

## 10. Site application rule

For every new Site, engineering shall perform only a load/application check:

1. sum the released continuous and peak load of required BIO-EMS devices;
2. verify the total remains inside the PDU-24-S5 released envelope;
3. calculate the required battery autonomy;
4. verify cable voltage drop;
5. assign the fixed standard outputs;
6. record unused branches.

If the load fits the standard envelope, no PDU redesign is permitted.

If it does not fit, use a formally defined expansion/higher-power product instead of changing fuse
ratings, PSU size or internal wiring without revision control.

## 11. Current Pilot mapping

### El Manial

- O1 -> SC-01;
- O2 -> spare/future;
- O3 -> SIM field bus A: 2 × SIM-T2 + 1 × SIM-T4;
- O4 -> spare SIM bus;
- O5 -> COM-CELL;
- O6/O7/O8 -> spare/auxiliary.

### CPC / 6th of October

Expected application:

- O1 -> SC-A;
- O2 -> SC-B;
- O3 -> SIM bus A;
- O4 -> SIM bus B;
- O5 -> COM-CELL;
- O6/O7/O8 -> spare/auxiliary.

This mapping is preliminary until the October physical layout is completed, but it demonstrates why
one standard eight-output PDU architecture can serve both current Pilot Sites.

## 12. Release gates

PDU-24-S5 becomes a released hardware product only after:

- exact schematic;
- exact PSU/UPS and alternate MPNs;
- low-voltage distribution/protection design;
- enclosure/panel layout;
- thermal check;
- branch short-circuit tests;
- UPS transfer/recharge tests;
- four-hour Manial autonomy test;
- maximum released load test;
- cable-voltage-drop validation;
- AC-fail/status integration;
- BOM and installed-cost review;
- service/replacement procedure.

Until those gates pass, PDU-24-S5 is an approved standard architecture, not a production-released
device.

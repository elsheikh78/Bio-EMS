# S16-04 Closure — Site Controller v1 Hardware Design Review

## Status

**COMPLETE / CONCEPT APPROVED / MERGED / VERIFIED / CLOSED**

The Product Owner approved the 12 S16-04 engineering-direction decisions. The Hardware
Design Review was integrated into `main` through PR #47.

Remote feature commit:

`fcd277d150619e701a0c9d346b6c2b8bf58c5d2e`

Integration commit on `main`:

`93d750dbfb9afe412fd6db26eb9ed0658863bfe8`

## Objective achieved

S16-04 established the proposed detailed-design/prototype direction for:

- a 16-channel BIO-EMS Site Controller v1;
- ESP32-S3 as the first platform;
- two eight-port dedicated 1-Wire master banks;
- one externally powered three-wire industrial DS18B20 assembly per Home Run channel;
- 24 VDC nominal panel distribution with protected internal conversion;
- Ethernet-first communication with controlled Wi-Fi support;
- provision for a future approved local cellular/SMS failover interface;
- a seven-day all-channel offline-buffer design target;
- one Controller per Site as a survey-dependent planning assumption;
- prototype-only procurement before S16-08 design freeze and FAT.

The review classified `HW-001` through `HW-012`, defined the functional block diagram,
engineering gaps, field measurements, prototype/FAT tests, owners, and procurement
boundary.

## Product Owner decisions recorded

The Product Owner approved all 12 requested concept decisions, including keeping cable
limits, protection/isolation, PSU rating, enclosure/IP rating, BOM, and Site-dependent
values blocked until their evidence gates are satisfied.

This approval is for engineering direction only.

## Verification evidence

PR #47 contained two documentation artifacts and 486 added lines. Before merge:

- the PR was mergeable at the exact approved remote feature HEAD;
- Backend quality gates passed;
- Frontend quality gates passed, including typecheck, lint, formatting, tests, and
  production build;
- document formatting passed;
- `git diff --check` passed;
- hardware-requirement disposition verification passed.

GitHub Actions run: `32130588731`.

Backend job: `95690639634`.

Frontend job: `95690639772`.

## Release boundary preserved

The approved direction does not release:

- a schematic, PCB, BOM, firmware, probe assembly, cable, enclosure, or panel revision;
- a cable-length limit, protection value, electrical/thermal rating, or IP rating;
- a cellular modem, provider, SIM, recipient, or failover installation;
- a Site location, route, supply, network, or identity value;
- full Pilot procurement, installation, commissioning, or acceptance.

`docs/hardware/APPROVED_HARDWARE.md` correctly continues to state that no production or
Pilot hardware revision is released.

## Downstream decision

- controlled prototype engineering materials may be evaluated;
- S16-05 must supply the applicable BIO EGYPT field evidence;
- S16-08 owns schematic/PCB/BOM/firmware detail, prototype, FAT, and design freeze;
- the full Pilot quantity remains prohibited until S16-08 approval and applicable
  S16-05 gates.

## Closure decision

All S16-04 concept review, Product Owner approval, merge, and verification gates are
complete.

**Decision: close S16-04 and use the approved 16-channel Site Controller direction as
the controlled input to S16-05 and S16-08.**

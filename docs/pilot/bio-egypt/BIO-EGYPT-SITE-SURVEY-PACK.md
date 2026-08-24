# BIO EGYPT Pilot — Controlled Site Survey Pack

## Document control

| Field                  | Entry                                                |
| ---------------------- | ---------------------------------------------------- |
| Work item              | S16-05                                               |
| Pack status            | READY FOR REVIEW — FIELD EXECUTION NOT STARTED       |
| Customer               | United Company for Biological Industries — BIO EGYPT |
| Controlled Sites       | El Manial; CPC / 6th of October                      |
| Controlled scope       | 8 Monitored Areas; 20 temperature Sensors            |
| Controller direction   | Proposed 16-channel BIO-EMS Site Controller v1       |
| Prepared from baseline | S16-01 and S16-04 approved directions                |
| Survey revision        | S16-05-R0                                            |
| Field status           | NOT SURVEYED / NOT COMMISSIONED / NOT ACCEPTED       |

## 1. Purpose and use

This pack controls the pre-installation survey for both BIO EGYPT Pilot Sites. The
survey team uses one completed copy per Site and attaches the referenced drawings,
photographs, readings, approvals, and deviations.

The pack is an evidence form, not a questionnaire that may be completed from memory.
Every entered field must identify its source, date, and responsible person when the
source is not self-evident.

Rules:

- use `TBD — Customer`, `TBD — Field Survey`, or `TBD — Engineering` until evidence is
  obtained;
- do not copy a planned route or distance as a measured as-built value;
- do not invent contact details, thresholds, phone numbers, network settings, hardware
  ratings, serials, certificates, approvals, or signatures;
- do not include passwords, SIM PIN/PUK, Wi-Fi keys, MQTT credentials, certificates,
  private keys, or personal phone numbers in repository evidence;
- personal contact/recipient details are retained in the customer's controlled record,
  while the repository stores an approved role/reference where possible;
- photograph and drawing files use the evidence naming rule in Section 17;
- any changed Site, Monitored Area, or Sensor count is a scope-change request, not a
  survey correction.

## 2. Survey execution states

| State               | Meaning                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `PLANNED`           | task and owner identified; no field evidence collected                |
| `OBSERVED`          | value observed/measured and source recorded; not yet reviewed         |
| `REVIEWED`          | BIO-EMS engineering/quality checked the evidence                      |
| `CUSTOMER APPROVED` | authorized BIO EGYPT approver signed the applicable decision          |
| `BLOCKED`           | required evidence/access/decision is unavailable                      |
| `NOT APPLICABLE`    | justified and approved; never used merely because evidence is missing |

Only `CUSTOMER APPROVED` or the applicable engineering release may close an item that
requires approval. A field note alone does not release hardware or installation.

## 3. Required participants

| Function                     | Named representative | Organization | Present/remote | Evidence authority                     |
| ---------------------------- | -------------------- | ------------ | -------------- | -------------------------------------- |
| BIO EGYPT Project/Operations | TBD — Customer       | BIO EGYPT    | TBD            | Site/access coordination               |
| BIO EGYPT Quality            | TBD — Customer       | BIO EGYPT    | TBD            | areas, thresholds, quality approvals   |
| BIO EGYPT IT                 | TBD — Customer       | BIO EGYPT    | TBD            | network, security, notification inputs |
| BIO EGYPT Engineering/EHS    | TBD — Customer       | BIO EGYPT    | TBD            | power, earthing, penetrations, permits |
| BIO-EMS survey lead          | TBD — BIO-EMS        | BIO-EMS      | TBD            | pack completeness                      |
| BIO-EMS hardware engineer    | TBD — BIO-EMS        | BIO-EMS      | TBD            | Controller/cable evidence review       |
| Installer/electrician        | TBD — Appointment    | TBD          | TBD            | route/electrical feasibility           |

An authorized and competent electrical person performs or supervises electrical
measurements. The survey pack does not authorize opening energized equipment or
bypassing Site safety procedures.

## 4. Pre-survey release gate

Complete before travel or field work:

- [ ] Written customer permission and Site/date/time confirmed.
- [ ] Legal Site name, address reference, entry point, and access contact available in
      the controlled customer record.
- [ ] Photography permission and restricted areas confirmed.
- [ ] Work permit, induction, PPE, hygiene, gowning, escort, and tool restrictions
      confirmed.
- [ ] Latest floor plans/layouts requested in editable or clearly marked format.
- [ ] Controlled scope and 20-row Sensor map issued to the survey team.
- [ ] S16-04 concept review and unresolved hardware questions issued.
- [ ] Required participants invited and approval authority confirmed.
- [ ] Measuring instruments identified with serial and calibration/verification status.
- [ ] No live electrical or destructive work is planned without separate authorization.
- [ ] Evidence storage/naming location prepared.

Pre-survey decision: `TBD — GO / NO-GO`

Decision owner: `TBD` Date/time: `TBD`

## 5. Survey equipment register

Record only equipment actually used.

| Equipment                  | Intended use                             | Manufacturer/model | Serial | Calibration/verification due | Used by              |
| -------------------------- | ---------------------------------------- | ------------------ | ------ | ---------------------------- | -------------------- |
| Laser distance meter/tape  | cable routes and clearances              | TBD                | TBD    | TBD                          | TBD                  |
| Environmental meter/logger | Controller ambient evidence              | TBD                | TBD    | TBD                          | TBD                  |
| Network test device        | Ethernet path/DHCP/DNS/NTP evidence      | TBD                | TBD    | N/A or TBD                   | TBD                  |
| Wi-Fi survey device/app    | RSSI/channel evidence                    | TBD                | TBD    | N/A or TBD                   | TBD                  |
| Cellular survey device     | approved-carrier signal evidence         | TBD                | TBD    | N/A or TBD                   | TBD                  |
| Electrical test instrument | supply/earthing evidence when authorized | TBD                | TBD    | TBD                          | qualified person TBD |
| Camera                     | controlled photographs                   | TBD                | TBD    | N/A                          | TBD                  |

Instrument status that cannot be verified is recorded as a limitation against the
affected measurement.

## 6. Site record header — complete one copy per Site

| Field                                  | Entry                                    |
| -------------------------------------- | ---------------------------------------- |
| Controlled Site                        | `TBD — El Manial / CPC / 6th of October` |
| Legal Site name                        | TBD — Customer                           |
| Address/reference                      | TBD — Customer controlled record         |
| Survey date/time                       | TBD — Field Survey                       |
| Survey revision                        | S16-05-R0 / revised value                |
| Floor-plan title/revision              | TBD — Customer                           |
| Areas visited                          | TBD — Field Survey                       |
| Areas not accessed and reason          | TBD — Field Survey                       |
| Survey lead                            | TBD                                      |
| Customer escort/witness                | TBD — Customer                           |
| Weather/external condition if relevant | TBD — Field Survey                       |
| General Site restrictions              | TBD — Customer                           |

## 7. Scope reconciliation

### El Manial expected baseline

| Area             | Expected Sensors | Name on Site drawing | Accessed | Scope deviation |
| ---------------- | ---------------: | -------------------- | -------- | --------------- |
| Cold Room 01     |                2 | TBD                  | TBD      | TBD             |
| Anti-chamber 01  |                1 | TBD                  | TBD      | TBD             |
| Dry Warehouse 01 |                4 | TBD                  | TBD      | TBD             |
| **Total**        |            **7** |                      |          |                 |

### CPC / 6th of October expected baseline

| Area             | Expected Sensors | Name on Site drawing | Accessed | Scope deviation |
| ---------------- | ---------------: | -------------------- | -------- | --------------- |
| Cold Room 01     |                2 | TBD                  | TBD      | TBD             |
| Cold Room 02     |                2 | TBD                  | TBD      | TBD             |
| Cold Room 03     |                2 | TBD                  | TBD      | TBD             |
| Anti-chamber 01  |                1 | TBD                  | TBD      | TBD             |
| Dry Warehouse 01 |                6 | TBD                  | TBD      | TBD             |
| **Total**        |           **13** |                      |          |                 |

If the physical Site names or arrangement differ, mark the plan and raise a change
record. Do not rename the controlled configuration without approval.

## 8. Drawing and photograph control

### Drawing register

| Drawing/evidence ID | Title                                 | Customer revision | Survey markup revision | Status | Approver/reference |
| ------------------- | ------------------------------------- | ----------------- | ---------------------- | ------ | ------------------ |
| TBD                 | Site general layout                   | TBD               | TBD                    | TBD    | TBD                |
| TBD                 | Monitored Area/Sensor positions       | TBD               | TBD                    | TBD    | TBD                |
| TBD                 | Controller and power/network location | TBD               | TBD                    | TBD    | TBD                |
| TBD                 | Cable routes and penetrations         | TBD               | TBD                    | TBD    | TBD                |

### Photograph log

| Photo ID | Date/time | Site/area | Direction/subject | Related Map/route ID | Restriction/redaction | Photographer |
| -------- | --------- | --------- | ----------------- | -------------------- | --------------------- | ------------ |
| TBD      | TBD       | TBD       | TBD               | TBD                  | TBD                   | TBD          |

Minimum photograph subjects when permitted:

- each proposed Controller location from approach and service positions;
- supply board/outlet label without exposing restricted information;
- Ethernet outlet/network path and antenna constraints;
- each Sensor position context;
- representative cable routes, crossings, containment, penetrations, and fire/IP seals;
- cold-room/anti-chamber door, evaporator/airflow, and potential local heat/cold bias;
- warehouse storage layout and proposed zone coverage;
- any access, hygiene, condensation, interference, or maintainability concern.

## 9. Controller-location assessment

Evaluate at least one candidate and record rejected alternatives.

| Criterion                                       | Candidate A | Candidate B | Evidence/notes      |
| ----------------------------------------------- | ----------- | ----------- | ------------------- |
| Location ID and drawing reference               | TBD         | TBD         | TBD                 |
| Outside controlled cold space                   | TBD         | TBD         | TBD                 |
| Ambient temperature/humidity observed           | TBD         | TBD         | instrument/time TBD |
| Condensation/washdown/dust/corrosion risk       | TBD         | TBD         | TBD                 |
| Secure from unauthorized operation              | TBD         | TBD         | TBD                 |
| Maintenance access and working clearance        | TBD         | TBD         | measured TBD        |
| Mounting surface and permitted fixing           | TBD         | TBD         | TBD                 |
| Cable entry/bend radius/containment feasibility | TBD         | TBD         | TBD                 |
| Longest estimated route before measurement      | TBD         | TBD         | planning only       |
| Protected AC/24 V/UPS feasibility               | TBD         | TBD         | TBD                 |
| Ethernet/Wi-Fi feasibility                      | TBD         | TBD         | TBD                 |
| Cellular antenna/signal feasibility             | TBD         | TBD         | TBD                 |
| Fire/hygiene/permit constraints                 | TBD         | TBD         | TBD                 |
| Engineering recommendation                      | TBD         | TBD         | not final release   |

Preferred candidate: `TBD — Engineering Review`

Customer location approval: `TBD — Customer Approval`

This approval confirms the location intent only. Final enclosure, rating, clearances,
power, and cable suitability remain subject to the released S16-08 design.

## 10. Sensor position assessment

For every Map ID, mark the approved position on the controlled drawing and record:

- mounting/immersion intent and height/reference dimensions;
- product/storage distribution and representative rationale;
- distance from door, evaporator discharge/return, wall, ceiling, heater, sunlight,
  drain, traffic, cleaning impact, and physical damage risk;
- existing temperature mapping report/reference where available;
- customer Quality approval or open decision;
- photograph and drawing coordinates/references.

The survey does not claim that position is representative solely because it is central
or visually convenient.

## 11. Sensor Home Run route schedule

### El Manial

| Map ID       | From/to references | Measured route length | Vertical allowance | Service allowance | Total design input | Containment/penetrations | Interference/joints | Evidence/status |
| ------------ | ------------------ | --------------------: | -----------------: | ----------------: | -----------------: | ------------------------ | ------------------- | --------------- |
| MAN-CR01-T01 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |
| MAN-CR01-T02 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |
| MAN-AC01-T01 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |
| MAN-DW01-T01 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |
| MAN-DW01-T02 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |
| MAN-DW01-T03 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |
| MAN-DW01-T04 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |

### CPC / 6th of October

| Map ID       | From/to references | Measured route length | Vertical allowance | Service allowance | Total design input | Containment/penetrations | Interference/joints | Evidence/status |
| ------------ | ------------------ | --------------------: | -----------------: | ----------------: | -----------------: | ------------------------ | ------------------- | --------------- |
| CPC-CR01-T01 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |
| CPC-CR01-T02 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |
| CPC-CR02-T01 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |
| CPC-CR02-T02 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |
| CPC-CR03-T01 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |
| CPC-CR03-T02 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |
| CPC-AC01-T01 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |
| CPC-DW01-T01 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |
| CPC-DW01-T02 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |
| CPC-DW01-T03 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |
| CPC-DW01-T04 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |
| CPC-DW01-T05 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |
| CPC-DW01-T06 | TBD                |                   TBD |                TBD |               TBD |                TBD | TBD                      | TBD                 | TBD             |

Measurement method and instrument: `TBD`

Longest route and Map ID: `TBD — calculated only after all rows complete`

S16-08 comparison against tested cable limit: `TBD — BLOCKED`

Routes longer than the released limit or incompatible with Home Run installation
trigger an engineering/scope decision. They are not shortened on paper.

## 12. Electrical and backup-power survey

Performed/reviewed by qualified person: `TBD`

| Item                                              | Observed evidence | Status/limitation | Engineering action  |
| ------------------------------------------------- | ----------------- | ----------------- | ------------------- |
| proposed supply origin/circuit reference          | TBD               | TBD               | TBD                 |
| nominal supply and measured value when authorized | TBD               | TBD               | TBD                 |
| protective device type/rating/reference           | TBD               | TBD               | TBD                 |
| isolation method and service ownership            | TBD               | TBD               | TBD                 |
| protective earth availability/test reference      | TBD               | TBD               | TBD                 |
| Site earthing/bonding constraint                  | TBD               | TBD               | TBD                 |
| outage history/required autonomy                  | TBD — Customer    | TBD               | TBD                 |
| existing UPS capacity/output/available load       | TBD               | TBD               | load study required |
| space for DIN-rail PSU/panel and segregation      | TBD               | TBD               | TBD                 |
| cable path from supply to Controller              | TBD               | TBD               | TBD                 |
| local electrical/EHS approvals                    | TBD               | TBD               | TBD                 |

No final PSU, fuse, conductor, UPS, or earthing decision is made by this survey form.
S16-08 combines Site evidence with the released power budget and applicable rules.

## 13. Network, time, and security survey

Do not record secrets in this pack.

| Item                            | Required evidence                                      | Entry/status |
| ------------------------------- | ------------------------------------------------------ | ------------ |
| primary connection option       | Ethernet preferred; Wi-Fi alternative evidence         | TBD          |
| Ethernet outlet/switch/path     | port/path reference and customer IT confirmation       | TBD          |
| address method                  | DHCP/static decision without secret configuration      | TBD          |
| outbound Internet policy        | allowed destination/port approval reference            | TBD          |
| DNS resolution                  | approved resolver path/test result                     | TBD          |
| NTP/time source                 | approved source/path/test result                       | TBD          |
| TLS/certificate constraints     | inspection/proxy/private CA decision reference         | TBD          |
| MQTT egress                     | broker reachability test plan/reference; no credential | TBD          |
| firewall/change owner           | role and ticket/reference                              | TBD          |
| Wi-Fi at Controller candidate   | RSSI, band, channel/load, stability evidence           | TBD          |
| network outage/escalation owner | role/reference                                         | TBD          |
| production credential custodian | role/reference only                                    | TBD          |

Required follow-up test: `TBD — IT-approved connectivity test`

## 14. Cellular and SMS failover survey

| Item                                     | Entry/status                        |
| ---------------------------------------- | ----------------------------------- |
| local Controller SMS required for Pilot  | TBD — Joint decision                |
| approved carrier(s) for survey           | TBD — Customer                      |
| signal metric at Controller candidate    | TBD — device, carrier, date/time    |
| alternative antenna position/path        | TBD                                 |
| indoor antenna/cable/fire constraints    | TBD                                 |
| modem/SIM procurement owner              | TBD                                 |
| SIM registration/credit/renewal owner    | TBD                                 |
| approved test-recipient record reference | TBD — controlled outside repository |
| provider/backend alternative             | TBD                                 |
| failover test-plan owner/reference       | TBD                                 |

The S15-05 decision table remains authoritative. SMS is not the normal notification
channel and no real recipient is written in repository files.

## 15. Quality, thresholds, and notification requirements

Complete per Monitored Area and obtain BIO EGYPT Quality approval.

| Area/Map scope             | Normal operating range | Warning low/high | Critical low/high | Delay/persistence | Sampling interval | Rationale/reference | Approval/status |
| -------------------------- | ---------------------- | ---------------- | ----------------- | ----------------- | ----------------- | ------------------- | --------------- |
| El Manial Cold Room 01     | TBD                    | TBD              | TBD               | TBD               | TBD               | TBD                 | TBD             |
| El Manial Anti-chamber 01  | TBD                    | TBD              | TBD               | TBD               | TBD               | TBD                 | TBD             |
| El Manial Dry Warehouse 01 | TBD                    | TBD              | TBD               | TBD               | TBD               | TBD                 | TBD             |
| CPC Cold Room 01           | TBD                    | TBD              | TBD               | TBD               | TBD               | TBD                 | TBD             |
| CPC Cold Room 02           | TBD                    | TBD              | TBD               | TBD               | TBD               | TBD                 | TBD             |
| CPC Cold Room 03           | TBD                    | TBD              | TBD               | TBD               | TBD               | TBD                 | TBD             |
| CPC Anti-chamber 01        | TBD                    | TBD              | TBD               | TBD               | TBD               | TBD                 | TBD             |
| CPC Dry Warehouse 01       | TBD                    | TBD              | TBD               | TBD               | TBD               | TBD                 | TBD             |

Notification/escalation matrix reference: `TBD — Customer controlled record`

Required roles, not personal data:

- primary Alarm recipient role;
- escalation recipient role and timing;
- after-hours owner;
- Alarm acknowledgment responsibility;
- Device-offline responsibility;
- calibration-due responsibility;
- incident/support contact path.

## 16. Identity and calibration input register

At survey stage, confirm naming/label strategy and available evidence. Final assignment
may remain commissioning work.

| Evidence                             | Required result                      | Status/reference             |
| ------------------------------------ | ------------------------------------ | ---------------------------- |
| legal Site and `siteCode` proposal   | unique, customer-matched identity    | TBD                          |
| Controller count/location label      | one proposed per Site unless changed | TBD                          |
| Controller serial scheme             | S16-08 released scheme               | BLOCKED                      |
| Device ID proposal                   | unique and Site-bound                | TBD                          |
| channel terminal scheme              | 1–16 mapping from released design    | BLOCKED                      |
| 20 Map IDs                           | match controlled Sensor map          | available; verify in field   |
| DS18B20 ROM/probe serials            | unique and physically labeled        | TBD — hardware/commissioning |
| calibration certificates             | 20 valid linked records              | TBD — Quality                |
| certificate acceptance tolerance/due | approved quality rule                | TBD                          |
| cable labels                         | both ends match Map ID/channel       | TBD — installation           |

## 17. Evidence naming and index

Use:

`BE-<SiteCode>-SURVEY-<YYYYMMDD>-<Type>-<Sequence>-R<Revision>`

Examples of `Type`: `PLAN`, `PHOTO`, `ROUTE`, `POWER`, `NETWORK`, `CELL`, `QUALITY`,
`APPROVAL`.

Do not use customer personal names, phone numbers, credentials, or uncontrolled free
text in filenames.

| Evidence ID | File/controlled-record reference | Related section/BE item | Reviewer | Review date | Status |
| ----------- | -------------------------------- | ----------------------- | -------- | ----------- | ------ |
| TBD         | TBD                              | TBD                     | TBD      | TBD         | TBD    |

Repository evidence should contain approved/redacted records only. Restricted customer
documents may be referenced by controlled ID rather than copied.

## 18. Deviation and new open-item register

| New ID              | Finding | Site/area | Impact                      | Owner | Required evidence/action | Due date | Status |
| ------------------- | ------- | --------- | --------------------------- | ----- | ------------------------ | -------- | ------ |
| Next after `BE-012` | TBD     | TBD       | blocking/non-blocking/scope | TBD   | TBD                      | TBD      | TBD    |

Never delete an existing `BE` item. A finding that changes Site/area/Sensor totals is a
scope change and records technical and commercial impact plus customer approval.

## 19. Open-item evidence map

| ID       | Survey-pack evidence                                | Status before field execution |
| -------- | --------------------------------------------------- | ----------------------------- |
| `BE-001` | Sections 3, 4, and 6 plus `BE001-EV-001`            | CLOSED — 23 August 2026       |
| `BE-002` | Sections 7, 8, and 10                               | BLOCKING                      |
| `BE-003` | Section 9 plus S16-08 released design               | BLOCKING                      |
| `BE-004` | Sections 8 and 11 plus tested cable design          | BLOCKING                      |
| `BE-005` | Section 16 and completed Sensor map                 | BLOCKING                      |
| `BE-006` | Section 15 signed by BIO EGYPT Quality              | BLOCKING                      |
| `BE-007` | Section 16 and 20-certificate register              | BLOCKING                      |
| `BE-008` | Sections 9, 12, 13, and 14                          | BLOCKING                      |
| `BE-009` | Section 15 notification/escalation matrix           | BLOCKING                      |
| `BE-010` | Section 14 and approved failover test plan          | BLOCKING                      |
| `BE-011` | handover inputs plus approved operating pack        | BLOCKING                      |
| `BE-012` | not closed by survey; requires signed commissioning | BLOCKING                      |

This pack supplies evidence inputs. It does not automatically close the register.

## 20. Post-survey engineering review

Complete after each Site visit:

- [ ] All visited/not-visited areas reconciled against controlled scope.
- [ ] Drawings and photographs indexed and permitted for their storage location.
- [ ] Every applicable Sensor position and route row completed or marked blocked.
- [ ] Controller candidates compared and limitations identified.
- [ ] Electrical evidence reviewed by qualified engineering owner.
- [ ] Network/time/security evidence reviewed by customer IT.
- [ ] Cellular/SMS decision routed to `BE-010` owner.
- [ ] Thresholds/notifications routed to authorized BIO EGYPT Quality approver.
- [ ] Longest and highest-risk routes identified for S16-08 prototype testing.
- [ ] Site values compared against S16-04 assumptions; no silent design change.
- [ ] Deviations/new open items assigned with due dates.
- [ ] Restricted information removed from repository copy.
- [ ] Survey revision and evidence index frozen for review.

Engineering outcome:

| Decision                                      | Select |
| --------------------------------------------- | ------ |
| Sufficient input for S16-08 detailed design   | [ ]    |
| Sufficient with listed non-blocking follow-up | [ ]    |
| Additional Site evidence required             | [ ]    |
| Controlled scope/design change required       | [ ]    |

Engineering reviewer: `TBD` Date: `TBD`

## 21. Site survey acknowledgment

The signatures below acknowledge that the listed observations and attachments reflect
the survey visit. They do not constitute installation, commissioning, system
acceptance, hardware release, or commercial scope approval unless a separately
identified decision explicitly states so.

BIO-EMS survey lead: ____________________ Date: __________

BIO EGYPT Site witness: _________________ Date: __________

BIO EGYPT Quality approver for marked positions/threshold record:

Name/signature: _________________________ Date: __________

Open limitations at signature: `TBD / attach deviation register`

## 22. Survey preparation acceptance

The S16-05 preparation package is ready for field scheduling when:

- Product Owner approves this controlled pack;
- both Site access contacts and survey schedule are confirmed outside the repository;
- requested plans and participant roles are available;
- the pre-survey gate can be completed without invented data;
- equipment and safety requirements are confirmed;
- the repository CI and formatting gates pass.

S16-05 itself remains **IN PROGRESS / FIELD EVIDENCE BLOCKED** until both Site surveys
are executed, reviewed, and their controlled evidence is recorded.

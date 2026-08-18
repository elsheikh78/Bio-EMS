# Sprint 16 — S16-01 Product, Reporting, Hardware, and Evidence Requirements Baseline

## Document control

| Field             | Value                                                                         |
| ----------------- | ----------------------------------------------------------------------------- |
| Work item         | S16-01                                                                        |
| Status            | APPROVED — MERGED                                                             |
| Baseline          | Sprint 16 Master Plan on `main` at `1d5db096145e316bd05af5ba328a34e3613d715b` |
| Product owner     | Ahmed A. Elsheikh                                                             |
| Pilot customer    | United Company for Biological Industries — BIO EGYPT                          |
| Software baseline | `v0.15.0`                                                                     |
| Field status      | NOT COMMISSIONED / NOT ACCEPTED                                               |

## 1. Objective

Establish one reviewable requirements baseline for the three Sprint 16 workstreams:

1. professional Product UI/UX;
2. reproducible reporting and analytics;
3. Site Controller hardware and BIO EGYPT field readiness.

This baseline translates the approved Sprint 16 direction into traceable requirements,
acceptance gates, evidence ownership, and explicit open decisions. It authorizes design
work after approval; it does not authorize implementation, procurement, installation,
commissioning, or customer acceptance.

## 2. Authoritative context and precedence

The following records constrain S16-01:

- `docs/project-management/SPRINT-16-MASTER-PLAN.md`;
- `docs/product/product-principles.md` and `docs/product/user-journey.md`;
- current authentication, authorization, localization, routing, and Domain contracts;
- `docs/pilot/bio-egypt/BIO-EGYPT-PILOT-SCOPE.md`;
- `docs/pilot/bio-egypt/BIO-EGYPT-OPEN-ITEMS.md`;
- approved architecture decisions and Sprint 15 closure evidence.

If an older generic requirement conflicts with a merged Domain contract or approved
ADR, the merged contract and ADR take precedence. Any proposed change to an
authoritative contract requires a separate reviewed decision; S16-01 does not silently
replace it.

## 3. Controlled product scope

### 3.1 Included

- a coherent, professional, responsive Arabic/English product experience;
- executive and operational dashboards with meaningful charts and drill-downs;
- a Reports Center with preview, underlying tables, PDF, and CSV output;
- temperature, Alarm, Device-health, calibration, and available audit/operations
  report families;
- Site Controller v1 design review and preparation for prototype/FAT;
- controlled BIO EGYPT survey inputs for two Sites, eight Monitored Areas, and 20
  temperature Sensors.

### 3.2 Excluded from S16-01

- frontend or backend implementation;
- new database schema, API, or reporting calculation code;
- wireframe or final visual approval;
- hardware release, bulk purchasing, assembly, firmware implementation, or FAT;
- field measurements, installation, commissioning, or acceptance claims;
- humidity, differential pressure, door, power, particle, or other Phase 2 telemetry;
- Excel export, WhatsApp provider integration, licensing, OTA, or a customer fleet
  management service unless separately approved.

## 4. Product roles and primary decisions

| Role                   | Primary need                                                             | Controlled access principle                 |
| ---------------------- | ------------------------------------------------------------------------ | ------------------------------------------- |
| Executive/management   | rapid Site status, trends, exceptions, and decision-ready reports        | summarized authorized scope only            |
| Quality user           | excursions, Alarm evidence, calibration status, and reproducible reports | authorized Sites and records                |
| Operations user        | current area status, Device health, faults, and drill-down               | operational actions allowed by role         |
| Administrator          | configuration, users, Devices, Sensors, and system status                | privileged routes and explicit confirmation |
| Auditor/read-only user | historical evidence and exports without mutation                         | read/export only within granted scope       |

The existing authorization model remains authoritative. These roles describe product
needs and do not create permissions by themselves.

## 5. Product and UX requirements

| ID     | Requirement                                                                                                                                                 | Acceptance gate                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| UX-001 | Users navigate through business context: Site, Monitored Area/Asset context, then operational detail. Hardware remains infrastructure where possible.       | S16-02 navigation model maps every high-value screen to the current Domain and routes.           |
| UX-002 | Login, AppShell, Dashboard, Monitored Areas, Alarms, Device Health, Sensor/Calibration, Reports, Configuration, and Users use one coherent design language. | Approved token and component inventory covers every listed surface.                              |
| UX-003 | The experience supports Arabic RTL and English LTR without losing content, hierarchy, chart meaning, or action placement.                                   | Representative desktop and tablet wireframes pass bilingual direction review.                    |
| UX-004 | Primary screens remain usable on desktop and tablet; supported narrow layouts must not create inaccessible actions or hidden critical status.               | Responsive review records breakpoints and verified critical flows.                               |
| UX-005 | Keyboard navigation, visible focus, semantic headings, labels, contrast, and non-color status cues are mandatory.                                           | Accessibility checklist and automated/component coverage are defined before implementation.      |
| UX-006 | Loading, empty, error, permission-denied, offline, stale, and partial-data states are explicit and visually distinct.                                       | Each high-value wireframe contains the applicable states and recovery action.                    |
| UX-007 | Alarm severity and Device-health states use stable semantic tokens and text/icon cues; decorative colors cannot redefine Domain meaning.                    | Token review maps UI state to authoritative enums/contracts.                                     |
| UX-008 | Motion is restrained and communicates state or orientation; it must respect reduced-motion preferences.                                                     | S16-02 specifies permitted motion and reduced-motion behavior.                                   |
| UX-009 | Critical metrics and charts provide an understandable table/text equivalent and a path to authoritative detail.                                             | Wireframe review demonstrates equivalent data and drill-down.                                    |
| UX-010 | No UI control may imply a backend capability, permission, or data field that does not exist in an approved contract.                                        | Every control and widget has a contract/evidence reference or is clearly marked future/deferred. |
| UX-011 | Dates, times, units, numbers, and status wording are consistent across pages and exports.                                                                   | Formatting rules identify time zone, locale, precision, and unit source.                         |
| UX-012 | The interface must feel suitable for regulated pharmaceutical operations: clear, restrained, traceable, and printable where relevant.                       | Product Owner approves the visual direction and critical evidence flows.                         |

## 6. Dashboard and visualization requirements

| ID       | Requirement                                                                                                                                  | Acceptance gate                                                                            |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| DASH-001 | The executive overview shows authorized Site, Monitored Area, Sensor, active Alarm, and Device-health summaries.                             | Each metric has a defined backend source, filter scope, timestamp, and empty/partial rule. |
| DASH-002 | Active Warning and Critical Alarm counts remain visibly distinct and link to the filtered authoritative Alarm view.                          | Contract and wireframe demonstrate count-to-list consistency.                              |
| DASH-003 | Device status distribution presents Online, Stale, and Offline without deriving new states in the frontend.                                  | Widget consumes the approved health contract.                                              |
| DASH-004 | Temperature trends can display warning/critical thresholds and distinguish measurements, gaps, and replayed data when contracts expose them. | S16-03 defines series semantics before S16-06 implementation.                              |
| DASH-005 | Alarm visualizations support trend, severity, duration, and recurrence views where the approved records are sufficient.                      | Each chart documents calculation, grouping, and excluded/incomplete data.                  |
| DASH-006 | Calibration due/overdue visibility links to Sensor or calibration evidence without presenting an expired certificate as valid.               | Status mapping is consistent with the calibration Domain.                                  |
| DASH-007 | Site, area, Sensor, report interval, and time range filters remain synchronized only where their contracts are compatible.                   | Filter behavior, defaults, reset, and URL/navigation persistence are decided in design.    |
| DASH-008 | Every widget exposes last-updated/data-range context and honest partial-failure behavior.                                                    | Wireframes show freshness and per-widget failure treatment.                                |

## 7. Reporting requirements

### 7.1 Common report contract

Every generated report must record or display, as applicable:

- report ID and report family;
- customer and Site scope;
- selected Monitored Areas, Devices, and Sensors;
- date/time range, report time zone, interval, and aggregation;
- thresholds and calculation rules used;
- missing, delayed, and replayed-data treatment;
- generation timestamp, generating User identity, and software/report version;
- filter summary, page numbers for PDF, and approval/signature placeholders where
  required;
- partial-data or unavailable-evidence warnings.

Display, preview, charts, tables, PDF, and CSV must derive from the same approved
backend result/calculation contract.

### 7.2 Report-family baseline

| ID      | Family           | Required minimum output                                                                                                                       |
| ------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| REP-001 | Temperature      | chronological readings or approved aggregates, minimum, maximum, average, threshold overlay, excursion count/duration, and data gaps          |
| REP-002 | Alarm            | history, severity, source, activation/recovery time, duration, acknowledgment actor/time, current/final state, and recurrence where supported |
| REP-003 | Device health    | Online/Stale/Offline history, outage duration, heartbeat availability, reconnect, and replay evidence where supported                         |
| REP-004 | Calibration      | current status, append-only history, due/overdue, PASS/FAIL, certificate reference, Sensor identity, and actor/time evidence                  |
| REP-005 | Audit/operations | configuration and acknowledgment events that exist in approved auditable records; unavailable audit classes must be declared, not fabricated  |

### 7.3 Calculation and export gates

| ID      | Requirement                                                                                                                           | Acceptance gate                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| REP-006 | SQLite configuration/audit records and InfluxDB telemetry retain separate authoritative boundaries.                                   | S16-03 documents query ownership and correlation identifiers.     |
| REP-007 | Time-zone conversion, inclusive/exclusive range boundaries, daylight-saving behavior, and timestamp precision are deterministic.      | Contract tests cover boundary examples.                           |
| REP-008 | Raw versus aggregated data, bucket boundaries, minimum/maximum/average calculation, and rounding are explicit.                        | Calculation specification includes worked examples.               |
| REP-009 | Missing, delayed, duplicate, and LIVE/REPLAY data are handled without silently implying continuous availability.                      | Data-quality rules and test fixtures are approved.                |
| REP-010 | Query range, row/point limits, pagination, timeout, and asynchronous export needs are decided before implementation.                  | S16-03 performance decision is merged.                            |
| REP-011 | PDF output is professional, printable, bilingual-capable, branded, paginated, and traceable to the previewed result.                  | Golden/rendering tests and visual review approach are defined.    |
| REP-012 | CSV contains the approved underlying dataset using documented encoding, delimiter, column names, timestamps, and unit representation. | Machine-readable fixture and compatibility test are defined.      |
| REP-013 | Exports enforce the same authorization scope as interactive views and must not expose secrets or unauthorized customer data.          | Route/service authorization tests cover allowed and denied cases. |
| REP-014 | File names and report IDs are deterministic, safe, and collision-resistant.                                                           | Naming/version/retention decision is documented in S16-03.        |

Excel remains deferred. It may be introduced only through an explicit requirement and
architecture decision after PDF and CSV are stable.

## 8. Hardware requirements baseline

S16-01 does not confirm an electrical design. It establishes the review questions and
evidence required by S16-04 and S16-08.

| ID     | Requirement/evidence gate                                                                                                        | Required S16-04 disposition                                      |
| ------ | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| HW-001 | Site Controller v1 architecture and channel capacity support the controlled Pilot topology.                                      | `CONFIRMED`, `PROPOSED`, `BLOCKED`, or `DEFERRED`, with evidence |
| HW-002 | ESP32 selection, boot, watchdog, recovery, firmware update boundary, and secure identity are documented.                         | design evidence and owner                                        |
| HW-003 | Industrial DS18B20 probe assembly and electrical interface are defined without unsupported accuracy or environmental claims.     | datasheet/assembly evidence                                      |
| HW-004 | Cable type, topology, maximum validated length, termination, shielding, routing constraints, and fault behavior are established. | calculations plus prototype/field test plan                      |
| HW-005 | Each channel's ESD, surge, reverse-polarity, short/open fault, isolation, and fusing approach is reviewed.                       | schematic-level decision and verification method                 |
| HW-006 | Power supply, protection, earthing, backup power, power loss, restart, and brownout behavior are defined.                        | power budget and recovery tests                                  |
| HW-007 | Ethernet/Wi-Fi, optional 4G/SMS boundary, DNS/NTP, firewall, MQTT TLS, and offline behavior are explicit.                        | interface and security decision                                  |
| HW-008 | Local buffering preserves timestamp and LIVE/REPLAY identity, prevents silent loss, and defines duplicate handling.              | capacity calculation and test plan                               |
| HW-009 | Enclosure, IP target, condensation, terminals, labels, service clearance, thermal behavior, and maintainability are reviewed.    | mechanical/environment evidence                                  |
| HW-010 | BOM availability, alternatives, lifecycle, prototype quantity, cost, and approved substitutions are controlled by revision.      | reviewed BOM and risk register                                   |
| HW-011 | Hardware revision, firmware version, Controller/Device/channel/Sensor identities, and production test records are traceable.     | released identity/version scheme                                 |
| HW-012 | No Pilot quantity is released until the design revision and applicable survey gates are approved.                                | signed design-freeze decision                                    |

## 9. BIO EGYPT evidence requirements

The controlled scope remains:

| Site                 | Monitored Areas | Temperature Sensors |
| -------------------- | --------------: | ------------------: |
| El Manial            |               3 |                   7 |
| CPC / 6th of October |               5 |                  13 |
| **Total**            |           **8** |              **20** |

S16-05 must collect source evidence, approver, revision, and date for the existing
`BE-001` through `BE-012` register. At minimum this includes:

- legal Site information, contacts, access, permits, and work restrictions;
- marked floor plans and approved Sensor positions;
- Controller position/count, power, protection, earthing, UPS, and service clearance;
- measured cable paths/lengths, containment, penetrations, sealing, and photographs;
- network, DNS, NTP, firewall, Internet, and 4G survey results;
- approved warning/critical thresholds, delays, notification recipients, and
  escalation ownership;
- Device, channel, Sensor, serial, and calibration-certificate identities;
- backup, support, maintenance, handover, commissioning, and signature ownership.

Unknown values remain `TBD` or `BLOCKING`. Survey evidence may populate a `TBD`; it
cannot silently add, remove, or relocate an area or Sensor.

## 10. Evidence ownership and RACI

| Deliverable/decision                           | Accountable                  | Responsible/source           | Repository evidence                            |
| ---------------------------------------------- | ---------------------------- | ---------------------------- | ---------------------------------------------- |
| product direction and high-value UX approval   | Product Owner                | Product/UX workstream        | approved requirements and S16-02 wireframes    |
| reporting catalogue and calculations           | Product Owner                | Reporting/backend workstream | S16-03 contracts, examples, and decisions      |
| frontend accessibility and responsive behavior | Product Owner                | Frontend workstream          | component, accessibility, and visual evidence  |
| hardware architecture/design release           | Product Owner                | Hardware engineering         | S16-04 review and S16-08 released revision/FAT |
| Site facts and installation constraints        | BIO EGYPT/joint approver     | Site survey team             | dated plans, forms, photographs, measurements  |
| thresholds and escalation matrix               | BIO EGYPT Quality            | BIO EGYPT Quality/joint team | signed requirements and notification matrix    |
| calibration evidence                           | BIO-EMS Quality              | Quality/commissioning team   | certificate register and Sensor map            |
| commissioning and acceptance                   | Joint authorized signatories | Commissioning team           | signed commissioning/acceptance record         |

Conversation approval can authorize repository planning decisions. It cannot replace a
customer signature, field measurement, engineering test record, or regulated evidence.

## 11. Cross-workstream dependencies

| Consumer                        | Must wait for                                       | Reason                                                                  |
| ------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| S16-02 Design System/wireframes | approved S16-01                                     | stable product states, roles, and target screens                        |
| S16-03 Reporting architecture   | approved S16-01                                     | stable report families, metadata, and calculation questions             |
| S16-04 Hardware Design Review   | approved S16-01                                     | stable evidence gates; final design still depends on engineering review |
| S16-05 Site Survey              | customer access/schedule and controlled survey pack | field evidence cannot be invented                                       |
| S16-06 Dashboard                | merged S16-02 and approved reporting contracts      | prevent frontend-only calculations and unsupported widgets              |
| S16-07 Reports Center           | merged S16-02 and S16-03                            | consistent UX and backend report contract                               |
| S16-08 Prototype/FAT            | S16-04 and applicable S16-05 evidence               | prevent release of an unsupported hardware revision                     |
| S16-09 Integration              | verified S16-05 through S16-08 outputs              | one traceable software/hardware/field baseline                          |

After S16-01 approval, S16-02, S16-03, and S16-04 may start in parallel on independent
branches. S16-05 may proceed when customer access and the survey schedule are available.

## 12. Open decisions routed to later work items

These are not S16-01 blockers unless specifically stated:

| Decision                                                                               | Owner work item     | Current state                                               |
| -------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------- |
| exact visual theme, typography, chart library, and component variants                  | S16-02              | OPEN                                                        |
| default landing experience versus current user-journey wording                         | S16-02              | OPEN — must preserve existing route behavior until approved |
| report API shape, query engine, generation location, retention, and maximum ranges     | S16-03              | OPEN                                                        |
| detailed aggregation, gap, delayed-data, and REPLAY rules                              | S16-03              | OPEN                                                        |
| Controller circuit, channel count/redundancy, cable limits, protections, and enclosure | S16-04              | OPEN — engineering evidence required                        |
| controller positions, route lengths, utilities, network, thresholds, and recipients    | S16-05              | BLOCKED pending customer/field evidence                     |
| Excel export                                                                           | future decision     | DEFERRED                                                    |
| field commissioning and customer acceptance                                            | S16-09/field record | BLOCKED pending installation and signed evidence            |

## 13. S16-01 acceptance criteria

S16-01 may be closed only when:

- Product Owner approves this baseline;
- all requirements have stable identifiers and an owning downstream work item;
- Product UI/UX, dashboard, reports, hardware, and field-evidence boundaries are clear;
- the two-Site/eight-area/20-Sensor BIO EGYPT scope remains unchanged;
- no unsupported feature, calculation, hardware rating, measurement, signature, or
  acceptance statement is introduced;
- the parallel-start dependencies for S16-02, S16-03, S16-04, and S16-05 are explicit;
- repository formatting and CI quality gates pass;
- the approved document is merged through its dedicated Pull Request.

## 14. Approval decision

Approval of S16-01 means:

- S16-02, S16-03, and S16-04 may start concurrently from the merged baseline;
- S16-05 preparation may start, but field execution remains dependent on BIO EGYPT
  access and schedule;
- downstream teams must retain the requirement IDs in designs, contracts, tests, and
  review evidence;
- changes to this baseline require an explicit reviewed amendment.

Approval does **not** mean that software is implemented, hardware is released, the Site
is surveyed or commissioned, or BIO EGYPT has accepted the system.

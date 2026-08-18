# Sprint 16 Master Plan — Product Experience, Reporting, Hardware, and Pilot Readiness

## Document control

| Field                       | Value                                                |
| --------------------------- | ---------------------------------------------------- |
| Sprint                      | Sprint 16                                            |
| Status                      | PLANNED — MASTER PLAN UNDER REVIEW                   |
| Repository baseline         | `main` after PR #39                                  |
| Published software baseline | `v0.15.0`                                            |
| Product owner               | Ahmed A. Elsheikh                                    |
| Delivery model              | Three controlled parallel workstreams                |
| Pilot customer              | United Company for Biological Industries — BIO EGYPT |
| Field status                | NOT COMMISSIONED / NOT ACCEPTED                      |

## 1. Purpose

Sprint 16 moves BIO-EMS from a verified Pilot-readiness foundation toward a polished
customer-facing product and a released Pilot hardware baseline. It coordinates three
parallel workstreams:

1. professional UI/UX and operational visualization;
2. reporting and analytics;
3. hardware engineering and BIO EGYPT field readiness.

The Sprint deliberately preserves one repository, one authoritative Domain model, and
one controlled project record while allowing independent branches and Pull Requests to
progress in parallel.

## 2. Sprint objective

Deliver an approved product-experience and reporting foundation, visually upgrade the
highest-value operational screens, establish exportable and reproducible reports,
complete the Site Controller hardware review and design release, and convert BIO
EGYPT survey evidence into a controlled Pilot hardware and integration baseline.

Sprint 16 closure MUST NOT be interpreted as BIO EGYPT field commissioning or customer
acceptance unless every field gate and signature is separately completed.

## 3. Controlled starting state

- Sprint 14 frontend scope is complete and integrated.
- Sprint 15 Pilot-readiness software and documentation scope is complete and closed.
- `v0.15.0` is the published software release baseline.
- The operational Dashboard and Monitored Areas views exist.
- Reporting Center, exportable regulated reports, and the broader professional UI pass
  are not yet implemented.
- Site Controller v1 is an approved product direction, not a released production
  hardware design.
- BIO EGYPT scope remains two Sites, eight monitored areas, and 20 temperature Sensors.
- BIO EGYPT open items `BE-001` through `BE-012` remain evidence gates.

## 4. Parallel workstream model

| Workstream                | Goal                                                                                              | Primary repository area                                    | External input                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------- |
| A — Product UI/UX         | Professional, coherent, accessible, responsive customer experience                                | `frontend/`, UX and product documents                      | Product-owner review                                |
| B — Reporting & Analytics | Reproducible operational, alarm, health, and calibration reports with charts and exports          | backend reporting contracts, `frontend/`, report documents | Reporting requirements and data validation          |
| C — Hardware & Field      | Released Site Controller design, verified prototype/FAT, and controlled BIO EGYPT survey evidence | `docs/hardware/`, firmware/contracts, Pilot documents      | Field measurements, suppliers, engineering evidence |

The workstreams may be active concurrently. A work item may not claim completion from
another workstream's planned output; it must consume a merged contract or an explicitly
approved controlled artifact.

## 5. Work-item register

| Item   | Workstream   | Scope                                                                | Initial status | Depends on                               |
| ------ | ------------ | -------------------------------------------------------------------- | -------------- | ---------------------------------------- |
| S16-01 | Coordination | Product, UX, reporting, hardware, and evidence requirements baseline | PLANNED        | Sprint 16 Master Plan                    |
| S16-02 | A            | BIO-EMS Design System and high-value wireframes                      | PLANNED        | S16-01 product requirements              |
| S16-03 | B            | Reporting catalogue, data rules, and reporting architecture          | PLANNED        | S16-01 reporting requirements            |
| S16-04 | C            | Site Controller v1 Hardware Design Review                            | PLANNED        | Current hardware ADRs and specifications |
| S16-05 | C            | BIO EGYPT Site Survey and controlled field inputs                    | PLANNED        | Customer access and survey schedule      |
| S16-06 | A/B          | Executive Dashboard and operational charts                           | PLANNED        | S16-02 and approved reporting contracts  |
| S16-07 | A/B          | Reports Center, preview, filters, PDF, and CSV export                | PLANNED        | S16-02 and S16-03                        |
| S16-08 | C            | Hardware design freeze, prototype, firmware integration, and FAT     | PLANNED        | S16-04 and applicable S16-05 evidence    |
| S16-09 | A/B/C        | Pilot integration verification and controlled readiness closure      | PLANNED        | S16-05 through S16-08                    |

## 6. Workstream A — Product UI/UX

### 6.1 Product-experience principles

- Preserve the existing React, routing, authentication, authorization, localization,
  and data-query architecture.
- Do not rebuild the frontend or create a parallel Domain model.
- Make operational state legible before making it decorative.
- Use one consistent design language across Login, AppShell, Dashboard, Monitored
  Areas, Alarms, Devices, Calibration, Configuration, Users, and Reports.
- Support Arabic and English layout requirements.
- Preserve responsive behavior, accessibility, keyboard navigation, and safe loading,
  empty, error, permission, offline, and partial-data states.
- Use motion only when it communicates state or improves orientation.

### 6.2 S16-02 — Design System and wireframes

Deliverables:

- approved color, typography, spacing, elevation, icon, and state-token system;
- Alarm and Device-health semantic colors that remain accessible;
- reusable page, card, metric, table, filter, chart, dialog, form, and feedback patterns;
- polished wireframes for Login, AppShell, Executive Dashboard, Monitored Areas,
  Alarms, Device Health, Sensor/Calibration detail, and Reports Center;
- responsive desktop and tablet behavior;
- Arabic/English content-density and direction review;
- visual-regression and component-testing approach.

Acceptance:

- Product Owner approves the high-value wireframes.
- UI states do not imply unavailable backend behavior.
- The design tokens can be implemented without bypassing the current application
  architecture.

### 6.3 S16-06 — Executive Dashboard and operational charts

Target capabilities:

- Site, Monitored Area, Sensor, Alarm, and Device-health overview;
- Online/Stale/Offline Device distribution;
- active Warning/Critical Alarm metrics;
- telemetry trend with threshold overlays;
- Alarm trend and duration views;
- calibration due/overdue presentation;
- data-availability or missing-data indication when supported by approved contracts;
- coordinated filters, refresh, loading, partial failure, empty, and error behavior;
- drill-down to the authoritative operational screen.

Charts MUST include accessible text/table equivalents for critical information and
MUST NOT infer values unavailable from the backend.

## 7. Workstream B — Reporting and analytics

### 7.1 Reporting principles

- Reports must be reproducible from recorded inputs.
- SQLite configuration/audit data and InfluxDB telemetry remain distinct authoritative
  sources.
- Every report records Site, scope, filters, time zone, interval, aggregation rule,
  missing-data rule, generation time, generating User, and software version.
- Display and export calculations must use the same approved backend contract.
- PDF and CSV outputs must not rely on hidden frontend-only transformations.
- Customer identity, recipient, and credential data must follow the approved security
  boundary.

### 7.2 S16-03 — Reporting catalogue and architecture

The approved catalogue must define at minimum:

| Report family    | Minimum content                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Temperature      | trend, minimum, maximum, average, threshold overlay, excursions, duration, gaps           |
| Alarm            | history, severity, duration, acknowledgment actor/time, recovery, recurrence              |
| Device health    | Online/Stale/Offline history, outage duration, heartbeat availability, reconnect evidence |
| Calibration      | current status, history, due/overdue, PASS/FAIL, Sensor/certificate identity              |
| Audit/operations | configuration and acknowledgment evidence available from approved records                 |

Architecture decisions must cover:

- query boundaries and maximum date ranges;
- raw versus aggregated telemetry;
- time-zone and daylight-saving rules;
- missing, delayed, and replayed data;
- chart and table consistency;
- export generation location;
- pagination, file naming, report identity, and retention;
- performance limits and authorization.

### 7.3 S16-07 — Reports Center

Target capabilities:

- Site, Monitored Area, Device, Sensor, report-type, and date-range selection;
- approved advanced filters;
- report preview with chart and underlying table;
- PDF export with BIO-EMS/customer heading, report ID, filters, time zone, version,
  generation date, page numbers, and approval fields;
- CSV export of the approved tabular dataset;
- Arabic and English presentation;
- empty, partial-data, large-range, permission, and export-failure handling;
- automated contract, calculation, rendering, and authorization coverage.

Excel output is deferred unless separately approved; CSV is the initial portable data
export baseline.

## 8. Workstream C — Hardware and field readiness

### 8.1 S16-04 — Hardware Design Review

Review and classify every item as `CONFIRMED`, `PROPOSED`, `BLOCKED`, or `DEFERRED`:

- Site Controller architecture and channel capacity;
- ESP32, firmware lifecycle, watchdog, boot, and recovery behavior;
- industrial DS18B20 assembly and electrical interface;
- cable type, topology, maximum length, termination, shielding, and fault behavior;
- per-channel protection, ESD/surge/reverse-polarity protection, isolation, and fusing;
- power supply, earthing, backup power, and power-loss behavior;
- Ethernet/Wi-Fi and 4G/SMS responsibility;
- local storage, queueing, LIVE/REPLAY identity, and time synchronization;
- enclosure, IP rating, condensation, terminals, labels, maintainability, and
  manufacturability;
- component availability, approved alternatives, BOM cost, and lifecycle risk;
- hardware/firmware/backend security and identity contract.

Required outputs:

- review record and decision log;
- updated block diagram;
- confirmed gaps and owners;
- prototype test plan;
- list of field measurements required before design freeze.

### 8.2 S16-05 — BIO EGYPT Site Survey

Use the controlled Pilot checklist and close or update field-dependent evidence for:

- legal Site identity, contacts, access, permits, and work restrictions;
- marked-up floor plans and approved Sensor positions;
- Controller location/count and service clearance;
- cable routes, measured lengths, containment, joints, penetrations, and sealing;
- mains, protection, earthing, UPS, network, DNS, NTP, firewall, and 4G coverage;
- thresholds, delays, notification ownership, and approved test recipients;
- Sensor, channel, Device, serial, and calibration identity inputs;
- photographs, measurements, approvers, revision, and date.

Field observations may populate approved `TBD` fields. They may not silently change
the two-Site/eight-area/20-Sensor controlled scope.

### 8.3 S16-08 — Design freeze, prototype, and FAT

Design-freeze outputs:

- released system block diagram, schematic, wiring diagram, BOM, enclosure/panel
  layout, terminal schedule, cable specification, labeling standard, and datasheets;
- hardware revision and firmware version;
- released Device/channel/Sensor identity contract;
- approved prototype and production test procedures.

Prototype and FAT evidence:

- all channels and approved cable limits;
- Sensor open/short/disconnect behavior;
- power loss/recovery, watchdog, restart, and reconnect;
- MQTT TLS, topic identity, heartbeat, LIVE telemetry, local buffering, and REPLAY;
- Warning/Critical Alarm and approved SMS failover boundary;
- duplicate prevention and outage recovery;
- thermal, enclosure, supply, and burn-in evidence appropriate to the design;
- defect, rework, retest, approver, and date records.

No Pilot quantity may be released from an unapproved hardware revision.

## 9. S16-09 — Pilot integration and readiness closure

S16-09 verifies that the merged software, released hardware, and controlled Site
evidence form one coherent Pilot baseline. It includes:

- software tag/commit, hardware revision, firmware version, and configuration identity;
- 20-row Sensor map completeness;
- production configuration validation;
- backup and isolated restore rehearsal;
- heartbeat, LIVE, REPLAY, Alarm, acknowledgment, health, and notification smoke tests;
- Dashboard and report verification against approved evidence;
- open-item review and controlled handover pack.

Sprint readiness closure does not replace the signed field commissioning record.

## 10. Delivery waves and concurrency

### Wave 1 — Parallel definition and evidence

- S16-01 requirements and coordination baseline;
- S16-02 Design System and wireframes;
- S16-03 reporting catalogue and architecture;
- S16-04 Hardware Design Review;
- S16-05 Site Survey preparation and execution when customer access is available.

### Wave 2 — Parallel implementation and release

- S16-06 Dashboard and charts after approved UI/report contracts;
- S16-07 Reports Center after approved reporting architecture;
- S16-08 design freeze and prototype/FAT after hardware review and applicable survey
  evidence.

### Wave 3 — Integrated readiness

- S16-09 integrates the verified outputs and records the remaining field gates.

Work may begin in the same wave concurrently. Dependency gates, not nominal ordering,
control when implementation may claim completion.

## 11. Branch and Pull Request model

| Item   | Branch                                        |
| ------ | --------------------------------------------- |
| S16-01 | `agent/s16-01-product-reporting-requirements` |
| S16-02 | `agent/s16-02-design-system-wireframes`       |
| S16-03 | `agent/s16-03-reporting-architecture`         |
| S16-04 | `agent/s16-04-hardware-design-review`         |
| S16-05 | `agent/s16-05-bio-egypt-site-survey`          |
| S16-06 | `agent/s16-06-dashboard-charts`               |
| S16-07 | `agent/s16-07-reports-center`                 |
| S16-08 | `agent/s16-08-hardware-prototype-fat`         |
| S16-09 | `agent/s16-09-pilot-integration-readiness`    |

Rules:

- each branch starts from the current verified `main` unless an approved dependency
  requires another merged baseline;
- code, hardware, field evidence, and closure changes remain reviewable and scoped;
- Draft PRs are the default;
- Backend and Frontend CI must pass when applicable;
- no PR is merged without explicit Product Owner approval;
- normal merge commits and exact expected-head verification are used;
- `CHANGELOG.md`, `PROJECT_STATE.md`, and Sprint status documents are updated through
  controlled integration/closure work, not competing feature branches;
- no field value, signature, test result, or customer acceptance is invented.

## 12. Shared-file ownership and conflict prevention

| Artifact                            | Ownership rule                                |
| ----------------------------------- | --------------------------------------------- |
| Frontend components and routes      | UI/UX or Reports implementation PR only       |
| Reporting APIs and calculations     | Reporting architecture/implementation PR only |
| Hardware specifications             | Hardware workstream PR only                   |
| BIO EGYPT measurements and evidence | Field workstream PR with source evidence      |
| Changelog and project state         | Integration or closure PR                     |
| Domain terminology                  | Existing backend Domain remains authoritative |

When two workstreams require the same contract, the contract is reviewed and merged
first. Consumer implementation then starts or rebases on that merged contract.

## 13. Quality, security, and evidence gates

- TypeScript typecheck, lint, formatting, tests, and production build.
- Focused calculation and rendering tests for reporting.
- Authorization tests for every new route, query, and export.
- Time-zone, aggregation, missing-data, and REPLAY behavior tests.
- Accessibility and responsive UI verification.
- No secrets, credentials, phone numbers, customer personal data, or production `.env`
  values in source control.
- No unsupported hardware rating, cable limit, protection claim, calibration result,
  field result, or signature.
- Every field closure records evidence reference, approver, and date.
- Hardware and firmware outputs identify revision, test baseline, and approved status.

## 14. Sprint 16 Definition of Done

Sprint 16 repository scope is complete only when:

- approved UX and reporting requirements are traceable to implemented behavior;
- the Design System and approved high-value screens are integrated;
- reporting contracts, calculations, preview, charts, and PDF/CSV exports pass their
  quality and authorization gates;
- Hardware Design Review is closed with no unowned blocking decision;
- Site survey findings are controlled and scope changes are approved;
- the released hardware revision, firmware, prototype, and FAT evidence are complete;
- software/hardware/field integration evidence is reviewed;
- all implementation PRs and required closure records are merged;
- deferred and blocking items are explicit.

Sprint 16 closure MUST still state `NOT COMMISSIONED / NOT ACCEPTED` unless signed field
evidence independently supports a different decision.

## 15. Master dashboard

| Workstream        | Current item          | Status      | Next evidence/decision                              |
| ----------------- | --------------------- | ----------- | --------------------------------------------------- |
| Coordination      | Sprint 16 Master Plan | ACTIVE      | Maintain evidence after each approved merge         |
| A — Product UI/UX | S16-06                | CLOSED      | Start S16-07 Reports Center                         |
| B — Reporting     | S16-06                | CLOSED      | Implement S16-07 from approved reporting rules      |
| C — Hardware      | S16-08                | NEXT        | Consume S16-04 design and applicable field evidence |
| C — Field         | S16-05                | IN PROGRESS | Complete controlled Site survey evidence            |

This table is updated only from repository evidence. Conversation status updates may
summarize progress but do not replace the merged record.

## 16. Immediate next actions after plan approval

1. Start S16-07 Reports Center from the approved S16-02 and S16-03 baselines.
2. Continue controlled S16-05 field evidence collection.
3. Start S16-08 hardware detail/prototype work only from approved design and applicable
   field evidence.
4. Do not procure the full Pilot hardware quantity before the applicable hardware and
   survey gates release the design.
5. Maintain the Master Dashboard after every approved merge or field-evidence update.

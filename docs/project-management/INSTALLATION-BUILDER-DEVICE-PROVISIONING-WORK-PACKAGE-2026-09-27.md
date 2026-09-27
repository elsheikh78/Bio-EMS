# BIO-EMS Installation Builder & Device Provisioning Work Package

**Decision date:** 27 September 2026  
**Status:** APPROVED PRODUCT DIRECTION / IMPLEMENTATION PENDING  
**Target:** Pilot stabilization leading to production-grade commissioning UX  
**Repository baseline at decision:** `main@80bb5ca3985ecc515f4f3072d804edc6932d1968`

## 1. Decision

BIO-EMS will separate two concerns that are currently mixed in the System Owner workflow:

1. **Installation Configuration** — the authoritative logical description of the customer, Sites, Monitored Areas, Telemetries, Devices and channel mappings.
2. **Device Provisioning** — flashing, identifying, binding and testing physical ESP32 Site Controllers against an already validated logical installation.

The current Pilot page that asks SYSTEM_OWNER to type customer/site identity again and creates one Site + one Area + one Telemetry + one Device + one mapping at a time is not the approved commercial UX.

The current 12-digit pairing-code + serial-console process remains valid only as a Pilot bootstrap mechanism. It must not be the normal customer commissioning workflow.

## 2. Identity source of truth

The Windows Setup already collects and persists:

- Customer name;
- Customer code;
- Site name;
- Site code;
- optional Site location/contact metadata;
- automatically generated BIO-EMS Installation ID.

Installation Configuration must consume this authoritative identity instead of asking SYSTEM_OWNER to retype it.

### Required behavior

- Current customer and current installed Site are loaded automatically.
- Customer and Site identity are shown read-only for a site-bound installation.
- If the platform legitimately manages multiple registered Sites, the user selects from the registered Site inventory; free-text re-entry is not used.
- The Installation Builder must reject contradictory customer/site identity rather than silently creating a second logical identity.

## 3. Installation Builder

Replace the single-row “New installation draft” authoring model with a structured Builder.

The Builder must support, before physical provisioning:

- one customer;
- one or more registered Sites as allowed by deployment mode;
- multiple Monitored Areas per Site;
- multiple Telemetries per Area;
- multiple logical Devices;
- explicit Device channel mappings;
- complete review and validation of the installation as one governed revision.

### Normal UI

The normal workflow must not require editing JSON.

JSON remains available only as an advanced diagnostic/review representation for SYSTEM_OWNER.

### Inventory views

The UI must expose an unambiguous inventory of:

- Site codes/names;
- Area codes/names;
- Telemetry codes/names/types/units;
- Device IDs/model/firmware target;
- channel mappings;
- configuration revision/status.

The operator must be able to see all existing codes before adding the next item.

## 4. Code generation

Logical codes remain stable authoritative identifiers, but the user must not have to invent sequential IDs manually.

BIO-EMS should generate the next available identifiers according to a documented convention.

Pilot-compatible defaults may remain:

- Telemetry: `S1`, `S2`, `S3`...
- Device: `D001`, `D002`, `D003`...

The UI shows the generated code alongside a human-readable name.

Examples:

- `S1 — Cold Room 1 Temperature A`
- `S2 — Cold Room 1 Temperature B`
- `D001 — El Manial Site Controller 1`

Generated identifiers must be collision-checked inside the installation revision.

## 5. El Manial target authoring model

For BIO EGYPT / El Manial, the current hardware baseline is represented logically before any ESP32 is flashed.

The Builder must allow the complete El Manial configuration to be entered and reviewed first, including the approved temperature-only Pilot points and their eventual Device/channel mapping.

Physical controller binding must not be required to create the logical Telemetry inventory.

## 6. Lifecycle

Approved product sequence:

`Setup / Installation Identity -> Installation Builder -> Validate -> Device Provisioning -> Flash & Bind -> Hardware Test -> Commission`

### Installation Configuration gate

Before Device Provisioning:

- customer/Site identity is resolved;
- all required Areas and Telemetries exist;
- Device logical records exist;
- channel mappings are complete;
- duplicate codes/channels are rejected;
- snapshot validation passes;
- a governed configuration revision exists.

### Device Provisioning gate

Provisioning starts only after a target logical Device exists in a validated installation.

## 7. Device Provisioning UX

Add a dedicated SYSTEM_OWNER Device Provisioning workflow.

Target experience:

1. connect ESP32 by USB;
2. BIO-EMS detects the supported board/COM port;
3. display hardware identity and connection state;
4. select the already-defined logical Device, e.g. `D001`;
5. press **Flash & Provision Device**;
6. BIO-EMS flashes the approved common firmware;
7. BIO-EMS reads/derives the hardware UID;
8. BIO-EMS configures the local platform endpoint and approved bootstrap state;
9. BIO-EMS performs the short-lived pairing transaction internally;
10. BIO-EMS stores/verifies the resulting `platform_binding_id`;
11. reboot and wait for controller health/heartbeat;
12. run channel/mapping diagnostics;
13. record auditable provisioning evidence.

The user should not normally copy a 12-digit code or type serial-console commands.

## 8. Pairing security boundary

The existing Pilot pairing design remains useful internally:

- single-use bootstrap credential;
- short expiry;
- server-side hash-only storage;
- hardware UID binding;
- stable `platform_binding_id`;
- replay/duplicate protections.

The change is primarily in orchestration and UX: the local provisioning subsystem may generate and consume the short-lived pairing credential automatically.

This does not promote the Pilot mechanism to final Production Device Trust. Existing planned PKI/mTLS/Secure Boot/Flash Encryption work remains separate.

## 9. Local Windows provisioning architecture

Preferred Pilot/Windows architecture:

`Frontend -> BIO-EMS Backend -> local Device Provisioning Service -> USB/COM/ESP flashing tool -> ESP32`

A dedicated local service/helper is preferred over making browser Web Serial the only production path because BIO-EMS must support:

- deterministic flashing;
- controlled tool/runtime versions;
- elevated/local hardware access where required;
- logs and audit evidence;
- recovery/retry;
- board/port detection;
- post-flash verification.

Browser capabilities may be used where useful but are not the sole provisioning authority.

## 10. Functional work packages

### IB-01 — Installation identity integration

- expose authoritative installed customer/Site identity to SYSTEM_OWNER;
- prefill/read-only identity in Installation Builder;
- eliminate duplicate manual identity entry;
- tests for mismatch/rejection.

### IB-02 — Builder data model and APIs

- support complete multi-Area/multi-Telemetry/multi-Device snapshot editing;
- preserve governed immutable revision semantics;
- validation and collision checks.

### IB-03 — Builder UI and inventory

- tree/table inventory;
- add/edit/remove Area/Telemetry/Device/mapping before validation;
- generated IDs;
- no JSON required for standard operation;
- bilingual RTL/LTR.

### IB-04 — El Manial configuration acceptance

- enter the complete BIO EGYPT El Manial logical installation through the Builder;
- review generated codes and mappings;
- validate one governed revision.

### DP-01 — Local provisioning service

- enumerate supported serial devices;
- board detection;
- controlled flashing invocation;
- structured logs/status API.

### DP-02 — One-click Flash & Provision

- select logical Device;
- flash common firmware;
- obtain hardware UID;
- automate bootstrap pairing;
- persist/verify binding.

### DP-03 — Post-provision diagnostics

- reboot verification;
- heartbeat;
- mapping/channel test;
- actionable failures/retry;
- provisioning receipt.

### DP-04 — Pilot physical acceptance

- first actual El Manial controller;
- power-cycle persistence;
- mapping verification;
- MQTT/RS485 telemetry evidence;
- no manual pairing-code copy in the normal workflow.

## 11. Acceptance criteria

This package is not complete until all of the following are true:

- customer/Site identity entered during Setup is not retyped during installation authoring;
- all Telemetry and Device codes are visible in one inventory;
- duplicate identifiers/channels are blocked;
- complete El Manial configuration can be authored without JSON;
- installation validation occurs before physical Device provisioning;
- a connected ESP32 can be flashed from BIO-EMS;
- normal provisioning does not require the user to enter serial-console commands or manually copy the one-time pairing code;
- successful provisioning produces durable Device/hardware/binding evidence;
- post-provision health and mapping tests are visible;
- existing Repair/Upgrade and backup/restore identity guarantees remain intact;
- physical Pilot acceptance remains a distinct gate from source/CI completion.

## 12. Current code gaps confirmed at adoption

At the decision baseline:

- Windows Setup already collects customer/site identity and persists installation metadata.
- `SystemOwnerInstallationsPage` still maintains free-text customer/company/site state and asks for it again.
- its initial create action builds exactly one Site, one Area, one Telemetry, one Device and one mapping.
- modification falls back to editable configuration JSON.
- the page exposes counts but not a complete authoring inventory for safe sequential code selection.
- Pilot ESP32 instructions still require external flashing, serial console setup and manual pairing-code entry.

These gaps are the implementation target of this package.

## 13. Non-goals

This work package does not by itself:

- declare BIO EGYPT commissioned/accepted;
- replace field survey/cabling/calibration evidence;
- implement final commercial Device PKI/mTLS;
- burn irreversible eFuses;
- change the approved common-firmware principle;
- remove audit/revision controls from Installation Configuration.

## 14. Product rule

**Installation Configuration defines what the customer installation is. Device Provisioning attaches a physical controller to that already-approved definition.**

The physical Device must not be used as the authoring mechanism for the installation model.

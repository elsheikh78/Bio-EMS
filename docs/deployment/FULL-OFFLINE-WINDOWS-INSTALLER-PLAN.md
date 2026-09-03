# BIO-EMS Full Offline Windows Installer Plan

**Decision date:** 3 September 2026  
**Status:** APPROVED REQUIREMENT / IMPLEMENTATION NOT STARTED  
**Work package:** DEP-01 — Full Offline Windows Installer and Commissioning Package

## 1. Decision

BIO-EMS shall be deliverable to a customer Windows computer through one controlled
offline Setup package. The customer shall not be required to install Node.js,
Mosquitto, InfluxDB, database tools, or other runtime prerequisites manually.

Installer implementation starts only after the platform feature set and required
runtime components are frozen. Source-software completion does not imply that this
installer has been built, qualified, or accepted.

## 2. Deliverables

DEP-01 shall produce two controlled deliverables:

1. **Production Setup** — the customer-site installer for the BIO-EMS application and
   required runtime services.
2. **Commissioning Package** — technician-only diagnostics and controlled tools for
   MQTT, controller, Sensor, connectivity, and post-installation verification.

The commissioning tools must not expose SYSTEM_OWNER credentials, provider secrets,
or unrestricted production database access.

## 3. Production Setup Scope

The Production Setup shall:

- install the built BIO-EMS frontend and backend;
- bundle or install the approved Node.js runtime without requiring a separate manual
  Node.js installation;
- install and configure Mosquitto MQTT as a Windows service;
- install and configure InfluxDB OSS 2.9 for historical telemetry;
- initialize SQLite configuration/operational persistence and execute all versioned
  migrations;
- register required BIO-EMS processes as Windows services and configure controlled
  automatic startup;
- create persistent data, configuration, log, backup, and recovery locations;
- apply only the required, documented Windows Firewall rules;
- create a customer-facing desktop/start-menu shortcut;
- run a post-installation health check and report each component's result;
- support controlled Repair, Upgrade, Rollback where supported by the release
  procedure, and Uninstall;
- preserve customer data, evidence, and configuration during Repair and Upgrade;
- prevent Uninstall from silently deleting customer data or evidence; and
- produce installation and diagnostic logs suitable for support without writing
  passwords, tokens, App Passwords, or other secrets.

The package should operate without Internet access for the software and prerequisite
installation itself. External provider activation, license/entitlement operations
that require the platform service, and live notification tests may still require
Internet access and valid provider accounts.

## 4. First-Run Configuration

The first successful launch shall provide a controlled configuration workflow for:

- customer and Site identity;
- initial SYSTEM_OWNER-governed installation provisioning;
- the first customer ADMIN account through the approved P8 ownership/RBAC boundary;
- approved local ports, service endpoints, persistent storage, and backup location;
- controller, Device, Sensor, and MQTT commissioning inputs supported by the active
  installation revision; and
- Email, WhatsApp, and SMS provider configuration only when the relevant provider is
  available and credentials have been obtained.

Secrets shall never be embedded as shared/static values in the Setup package. They
must be entered or provisioned through an approved secure workflow, stored using the
production secret-management design, and excluded from logs and repository content.

## 5. Upgrade and Data-Safety Requirements

Every upgrade path shall:

1. identify the installed and target versions;
2. validate prerequisites and persistent paths;
3. create and verify the required pre-upgrade backup;
4. stop services in a controlled order;
5. apply binaries, configuration transformations, and database migrations;
6. restart services and run smoke/health verification;
7. retain an auditable result; and
8. follow the approved rollback procedure when verification fails.

The installer must preserve the architecture boundary: SQLite owns configuration and
operational records, InfluxDB owns historical telemetry, and the backend remains the
only application component that writes to both stores.

## 6. Qualification and Acceptance

DEP-01 is not complete until the release candidate passes, at minimum:

- installation on a clean, supported Windows machine with no manually installed
  BIO-EMS prerequisites;
- installation from the single offline Setup package using Administrator privileges;
- automatic service startup after reboot;
- application launch from the installed shortcut;
- backend, MQTT, SQLite, InfluxDB, and frontend health verification;
- a controlled test installation configuration and Sensor/telemetry path;
- Repair without loss of customer data;
- Upgrade from the supported previous release with verified backup and migrations;
- failure-path and rollback verification;
- Uninstall behavior that does not silently destroy retained customer data;
- review of firewall exposure, filesystem permissions, service identities, secrets,
  and diagnostic logs; and
- production and commissioning artifact checksums plus version traceability.

Physical controller qualification, live Meta/WhatsApp acceptance, live SIM800L/SMS
evidence, customer Site commissioning, UAT, and production acceptance remain separate
evidence gates and must not be inferred from installer qualification.

## 7. Implementation Sequence

1. Freeze the supported Windows versions, architecture, runtime inventory, ports,
   persistent paths, and service identities.
2. Select and record the installer technology and dependency redistribution terms.
3. Define unattended/silent installation behavior and the interactive first-run flow.
4. Build the Production Setup and Commissioning Package from the same controlled
   release manifest.
5. Add repeatable clean-machine, repair, upgrade, rollback, and uninstall tests.
6. Execute qualification and retain evidence before customer release.

## 8. Current Boundary

This document approves and controls the requirement. It does not claim that a Full
Offline Windows Installer currently exists. Until DEP-01 is implemented and its
qualification evidence is recorded, the repository's existing deployment and
productization tooling remains source-level capability rather than a customer-ready
single-click installer.

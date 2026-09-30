# BIO-EMS Documentation Index / فهرس التوثيق

Inventory date: 30 September 2026. Source baseline: `6efd78a9fd9ea50a1d1b0e88f074708be1189546`.

`PROJECT_STATE.md` is the sole current-state authority; `IMPLEMENTATION_PLAN.md` controls execution. `VERSION` controls source version; dated closure, Sprint, ADR and test documents retain the evidence and decision boundaries of their recorded date. They are not new acceptance evidence. Historical records are preserved instead of rewriting past results.

This reconciliation updates active entry points and operating/design guidance. The inventory includes every tracked Markdown document; listing a document does not claim a fresh line-by-line validation of every historical detail. Exact source/schema/API contracts prevail over unsupported feature claims. External Word manuals require a separate artifact revision before being described as updated.

## Open operational decisions

- MAIN-16/SIM-D4: 1–4 populated modules × 4 sensors; implement/version main and SIM firmware, Modbus map and 2G fallback.
- Resolve PT100 field baseline versus DS18B20 bench candidate and El Manial six/seven positions.
- Reconcile ADMIN topology permissions with prior approval; finish Builder threshold controls.
- Complete physical USB pairing, sensor acquisition, Windows/restore qualification, live notifications and field UAT.

## Start here / ابدأ هنا

| Section | Purpose |
| --- | --- |
| [Current documentation / التوثيق الحالي](current/README.md) | Current state, execution and operating entry points |
| [Historical archive / التوثيق التاريخي](archive/README.md) | Dated audits, closure and acceptance evidence |
| References below / المراجع أدناه | Domain specifications, active work packages and architectural decisions; consult current state for implementation status |

Architectural decisions remain under `docs/adr/`: a dated decision can still govern the design. Active plans/specifications are not archived merely because their filenames contain a date.

## Current entry points

- [PROJECT_STATE.md](../PROJECT_STATE.md)
- [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md)
- [PILOT_SCOPE.md](../PILOT_SCOPE.md)
- [RISK_REGISTER.md](../RISK_REGISTER.md)
- [docs/product/BIO-EMS-ARABIC-PROJECT-GUIDE.md](product/BIO-EMS-ARABIC-PROJECT-GUIDE.md)
- [backend/README.md](../backend/README.md)
- [frontend/README.md](../frontend/README.md)
- [docs/architecture/BIO-EMS-Architecture.md](architecture/BIO-EMS-Architecture.md)
- [docs/deployment/production-runbook.md](deployment/production-runbook.md)
- [docs/security/SYSTEM-OWNER-COMMISSIONING-OPERATIONS.md](security/SYSTEM-OWNER-COMMISSIONING-OPERATIONS.md)
- [docs/security/SYSTEM-OWNER-MANUFACTURER-KEY-GUIDE-AR.md](security/SYSTEM-OWNER-MANUFACTURER-KEY-GUIDE-AR.md)
- [docs/security/SYSTEM-OWNER-PROVISIONING-UI-AR.md](security/SYSTEM-OWNER-PROVISIONING-UI-AR.md)
- [firmware/site-controller-esp32s3/README.md](../firmware/site-controller-esp32s3/README.md)

## Reference documents and active specifications

| Document | Interpretation |
| --- | --- |
| [CHANGELOG.md](../CHANGELOG.md) | Reference / specification; not a current-state or acceptance claim |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Reference / specification; not a current-state or acceptance claim |
| [PROJECT_RULES.md](../PROJECT_RULES.md) | Reference / specification; not a current-state or acceptance claim |
| [README.md](../README.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/BIO-EMS-Alarm-Architecture.md](BIO-EMS-Alarm-Architecture.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/BIO-EMS-Design-Rules.md](BIO-EMS-Design-Rules.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/BIO-EMS-MQTT-Protocol.md](BIO-EMS-MQTT-Protocol.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/BIO-EMS-SITE-BOUND-LICENSING-ARCHITECTURE.md](BIO-EMS-SITE-BOUND-LICENSING-ARCHITECTURE.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/HARDWARE-V1-MODULAR-COTS-ARCHITECTURE.md](HARDWARE-V1-MODULAR-COTS-ARCHITECTURE.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/PROJECT-RD-PLANNING.md](PROJECT-RD-PLANNING.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/REALTIME_UI_UPDATE_BACKLOG.md](REALTIME_UI_UPDATE_BACKLOG.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/SPRINT-08-ALARM-LIFECYCLE.md](SPRINT-08-ALARM-LIFECYCLE.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/SPRINT-09-REST-API.md](SPRINT-09-REST-API.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/UPF-01-UNIVERSAL-PLATFORM-FOUNDATION.md](UPF-01-UNIVERSAL-PLATFORM-FOUNDATION.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/adr/ADR-001.md](adr/ADR-001.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-002.md](adr/ADR-002.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-003.md](adr/ADR-003.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-004-device-design.md](adr/ADR-004-device-design.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-005-monitoring-points.md](adr/ADR-005-monitoring-points.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-006-domain-naming.md](adr/ADR-006-domain-naming.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-007-device-abstraction.md](adr/ADR-007-device-abstraction.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-008-asset-centric-design.md](adr/ADR-008-asset-centric-design.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-009-device-registration-policy.md](adr/ADR-009-device-registration-policy.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-010-device-onboarding.md](adr/ADR-010-device-onboarding.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-011-Zone is an Engineering Concept.md](adr/ADR-011-Zone%20is%20an%20Engineering%20Concept.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-012 - Zone Controller Architecture.md](adr/ADR-012%20-%20Zone%20Controller%20Architecture.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-013 -Zone Controller Placement Standard.md](adr/ADR-013%20-Zone%20Controller%20Placement%20Standard.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-014 -Home Run Wiring Standard.md](adr/ADR-014%20-Home%20Run%20Wiring%20Standard.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-015-dashboard-aggregation-architecture.md](adr/ADR-015-dashboard-aggregation-architecture.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-016-dashboard-widget-api-architecture.md](adr/ADR-016-dashboard-widget-api-architecture.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-017-generic-telemetry-query-architecture.md](adr/ADR-017-generic-telemetry-query-architecture.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-018-evidence-based-development-rule.md](adr/ADR-018-evidence-based-development-rule.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-019-frontend-foundation.md](adr/ADR-019-frontend-foundation.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-020-frontend-application-shell.md](adr/ADR-020-frontend-application-shell.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-021-frontend-authentication-session.md](adr/ADR-021-frontend-authentication-session.md) | Architectural decision; consult current state for supersession |
| [docs/adr/ADR-022-system-owner-installation-provisioning-and-customer-rbac.md](adr/ADR-022-system-owner-installation-provisioning-and-customer-rbac.md) | Architectural decision; consult current state for supersession |
| [docs/architecture/BIO-EMS-Coding-Standards.md](architecture/BIO-EMS-Coding-Standards.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/BIO-EMS-Database.md](architecture/BIO-EMS-Database.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/BIO-EMS-Design-Rules.md](architecture/BIO-EMS-Design-Rules.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/BIO-EMS-MQTT-Protocol.md](architecture/BIO-EMS-MQTT-Protocol.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/BIO-EMS-Roadmap.md](architecture/BIO-EMS-Roadmap.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/PRODUCT-CONFIGURABILITY-GAP-REGISTER.md](architecture/PRODUCT-CONFIGURABILITY-GAP-REGISTER.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/PRODUCT-CONFIGURABILITY-PRINCIPLE.md](architecture/PRODUCT-CONFIGURABILITY-PRINCIPLE.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/SYSTEM-OWNER-AUDIT-CONFIGURATION-FOUNDATION.md](architecture/SYSTEM-OWNER-AUDIT-CONFIGURATION-FOUNDATION.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/api-design.md](architecture/api-design.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/business-domain.md](architecture/business-domain.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/coding-guidelines.md](architecture/coding-guidelines.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/database-design.md](architecture/database-design.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/definition-of-done.md](architecture/definition-of-done.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/domain-driven-design.md](architecture/domain-driven-design.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/domain-model.md](architecture/domain-model.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/entity-relationships.md](architecture/entity-relationships.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/folder-structure.md](architecture/folder-structure.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/implementation-boundaries.md](architecture/implementation-boundaries.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/mqtt-topics.md](architecture/mqtt-topics.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/roadmap.md](architecture/roadmap.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/architecture/system-design.md](architecture/system-design.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/deployment/DEP-01-02-INPUT-FREEZE-AND-BUILD.md](deployment/DEP-01-02-INPUT-FREEZE-AND-BUILD.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/deployment/DEP-01-03-PROTECTED-CONFIGURATION-SERVICES.md](deployment/DEP-01-03-PROTECTED-CONFIGURATION-SERVICES.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/deployment/DEP-01-04-HTTPS-FIREWALL-HEALTH.md](deployment/DEP-01-04-HTTPS-FIREWALL-HEALTH.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/deployment/DEP-01-05-LIFECYCLE-RECOVERY.md](deployment/DEP-01-05-LIFECYCLE-RECOVERY.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/deployment/DEP-01-WINDOWS-INSTALLER-FOUNDATION.md](deployment/DEP-01-WINDOWS-INSTALLER-FOUNDATION.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/deployment/FULL-OFFLINE-WINDOWS-INSTALLER-PLAN.md](deployment/FULL-OFFLINE-WINDOWS-INSTALLER-PLAN.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/deployment/LICENSING-INSTALLER-INTEGRATION.md](deployment/LICENSING-INSTALLER-INTEGRATION.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/deployment/SYSTEM-OWNER-BOOTSTRAP-AND-PLATFORM-JWT.md](deployment/SYSTEM-OWNER-BOOTSTRAP-AND-PLATFORM-JWT.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/deployment/deployment-architecture.md](deployment/deployment-architecture.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/deployment/site-controller-integration-contract.md](deployment/site-controller-integration-contract.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/development/API-Development-Standard.md](development/API-Development-Standard.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/engineering/ADR_POLICY.md](engineering/ADR_POLICY.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/engineering/AI_DEVELOPMENT_WORKFLOW.md](engineering/AI_DEVELOPMENT_WORKFLOW.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/engineering/ARCHITECTURE_PRINCIPLES.md](engineering/ARCHITECTURE_PRINCIPLES.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/engineering/CODE_REVIEW_CHECKLIST.md](engineering/CODE_REVIEW_CHECKLIST.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/engineering/DOMAIN_GUIDELINES.md](engineering/DOMAIN_GUIDELINES.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/engineering/ENGINEERING_GLOSSARY.md](engineering/ENGINEERING_GLOSSARY.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/engineering/ENGINEERING_PLAYBOOK.md](engineering/ENGINEERING_PLAYBOOK.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/engineering/GIT_WORKFLOW.md](engineering/GIT_WORKFLOW.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/engineering/README.md](engineering/README.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/engineering/RELEASE_PROCESS.md](engineering/RELEASE_PROCESS.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/engineering/TESTING_GUIDELINES.md](engineering/TESTING_GUIDELINES.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/hardware/APPROVED_HARDWARE.md](hardware/APPROVED_HARDWARE.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/hardware/BIO-EGYPT-PILOT-HARDWARE-TEST-PROTOCOL.md](hardware/BIO-EGYPT-PILOT-HARDWARE-TEST-PROTOCOL.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/hardware/BIO-EGYPT-PILOT-INITIAL-HARDWARE-VALIDATION-PLAN.md](hardware/BIO-EGYPT-PILOT-INITIAL-HARDWARE-VALIDATION-PLAN.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/hardware/BIO-EMS-MODULAR-HARDWARE-ARCHITECTURE-2026-09-24.md](hardware/BIO-EMS-MODULAR-HARDWARE-ARCHITECTURE-2026-09-24.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/hardware/BIO-EMS-PDU-24-S5-STANDARD-2026-09-24.md](hardware/BIO-EMS-PDU-24-S5-STANDARD-2026-09-24.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/hardware/HARDWARE-PROTECTION-BOM-CABLE-UPDATE-2026-08-27.md](hardware/HARDWARE-PROTECTION-BOM-CABLE-UPDATE-2026-08-27.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/hardware/HW-PWR-01-EL-MANIAL-24V-PDU-DESIGN-2026-09-24.md](hardware/HW-PWR-01-EL-MANIAL-24V-PDU-DESIGN-2026-09-24.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/hardware/HW-SIM-01-PILOT-SIM-T4-NO-CUSTOM-PCB-2026-09-24.md](hardware/HW-SIM-01-PILOT-SIM-T4-NO-CUSTOM-PCB-2026-09-24.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/hardware/MAIN-16-2G-SIM-D4-REV-A-BENCH-BASELINE-2026-09-28.md](hardware/MAIN-16-2G-SIM-D4-REV-A-BENCH-BASELINE-2026-09-28.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/hardware/PILOT-HARDWARE-DISCUSSION-2026-08-26.md](hardware/PILOT-HARDWARE-DISCUSSION-2026-08-26.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/hardware/installation-guide.md](hardware/installation-guide.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/hardware/wiring-standard.md](hardware/wiring-standard.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/hardware/zc-16.md](hardware/zc-16.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/hardware/zone-controller.md](hardware/zone-controller.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/pilot/bio-egypt/BE-002-MARKED-UP-SENSOR-POSITION-PACK.md](pilot/bio-egypt/BE-002-MARKED-UP-SENSOR-POSITION-PACK.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/pilot/bio-egypt/BIO-EGYPT-COMMISSIONING.md](pilot/bio-egypt/BIO-EGYPT-COMMISSIONING.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/pilot/bio-egypt/BIO-EGYPT-CUSTOMER-EVIDENCE-REGISTER-2026-08-31.md](pilot/bio-egypt/BIO-EGYPT-CUSTOMER-EVIDENCE-REGISTER-2026-08-31.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/pilot/bio-egypt/BIO-EGYPT-INSTALLATION-WIRING.md](pilot/bio-egypt/BIO-EGYPT-INSTALLATION-WIRING.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/pilot/bio-egypt/BIO-EGYPT-OPEN-ITEMS.md](pilot/bio-egypt/BIO-EGYPT-OPEN-ITEMS.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/pilot/bio-egypt/BIO-EGYPT-PILOT-SCOPE.md](pilot/bio-egypt/BIO-EGYPT-PILOT-SCOPE.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/pilot/bio-egypt/BIO-EGYPT-SENSOR-MAP.md](pilot/bio-egypt/BIO-EGYPT-SENSOR-MAP.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/pilot/bio-egypt/BIO-EGYPT-SITE-SURVEY-PACK.md](pilot/bio-egypt/BIO-EGYPT-SITE-SURVEY-PACK.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/pilot/bio-egypt/BIO-EGYPT-SOFTWARE-UAT-GUIDE.md](pilot/bio-egypt/BIO-EGYPT-SOFTWARE-UAT-GUIDE.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/pilot/bio-egypt/EL-MANIAL-HARDWARE-DESIGN-PROCUREMENT-BASELINE-2026-09-24.md](pilot/bio-egypt/EL-MANIAL-HARDWARE-DESIGN-PROCUREMENT-BASELINE-2026-09-24.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/pilot/bio-egypt/README.md](pilot/bio-egypt/README.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/product/SPRINT-16-S16-02-DESIGN-SYSTEM-WIREFRAMES.md](product/SPRINT-16-S16-02-DESIGN-SYSTEM-WIREFRAMES.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/product/product-principles.md](product/product-principles.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/product/product-vision.md](product/product-vision.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/product/security-roadmap.md](product/security-roadmap.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/product/user-journey.md](product/user-journey.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-ideas.md](project-ideas.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/BACKEND-FOUNDATION-SYSTEM-OWNER-AUDIT-CONFIGURATION-WORK-PACKAGE.md](project-management/BACKEND-FOUNDATION-SYSTEM-OWNER-AUDIT-CONFIGURATION-WORK-PACKAGE.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/BF-03-USER-AUDIT-INTEGRATION.md](project-management/BF-03-USER-AUDIT-INTEGRATION.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/BF-04-EDITABLE-ALARM-THRESHOLDS.md](project-management/BF-04-EDITABLE-ALARM-THRESHOLDS.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/BF-05-CONFIGURABLE-ALARM-DELAY.md](project-management/BF-05-CONFIGURABLE-ALARM-DELAY.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/BF-06-NOTIFICATION-RECIPIENT-DIRECTORY.md](project-management/BF-06-NOTIFICATION-RECIPIENT-DIRECTORY.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/BF-07-ESCALATION-POLICY.md](project-management/BF-07-ESCALATION-POLICY.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/BF-08-SITE-CONTROLLER-CONFIG-SYNC-CONTRACT.md](project-management/BF-08-SITE-CONTROLLER-CONFIG-SYNC-CONTRACT.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/BF-09-FRONTEND-READINESS-WORK-PACKAGE.md](project-management/BF-09-FRONTEND-READINESS-WORK-PACKAGE.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/COMMUNICATION-CHANNEL-ADMIN-CONFIG-WORK-PACKAGE-2026-09-11.md](project-management/COMMUNICATION-CHANNEL-ADMIN-CONFIG-WORK-PACKAGE-2026-09-11.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/CONTROLLED-HANDOFF-2026-09-11.md](project-management/CONTROLLED-HANDOFF-2026-09-11.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/DECISIONS.md](project-management/DECISIONS.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/EMAIL-TELEGRAM-END-TO-END-EVIDENCE-2026-09-09.md](project-management/EMAIL-TELEGRAM-END-TO-END-EVIDENCE-2026-09-09.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/END-OF-DAY-HANDOFF-2026-09-08.md](project-management/END-OF-DAY-HANDOFF-2026-09-08.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/ESP32-S3-PILOT-PAIRING-V1-IMPLEMENTATION-2026-09-23.md](project-management/ESP32-S3-PILOT-PAIRING-V1-IMPLEMENTATION-2026-09-23.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/GLOBAL-LOCALIZATION-AND-P8-01-EMAIL-HANDOFF-2026-09-03.md](project-management/GLOBAL-LOCALIZATION-AND-P8-01-EMAIL-HANDOFF-2026-09-03.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/INSTALLATION-BUILDER-DEVICE-PROVISIONING-WORK-PACKAGE-2026-09-27.md](project-management/INSTALLATION-BUILDER-DEVICE-PROVISIONING-WORK-PACKAGE-2026-09-27.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/LIC-01-LICENSING-DOMAIN-DATA-MODEL-2026-09-07.md](project-management/LIC-01-LICENSING-DOMAIN-DATA-MODEL-2026-09-07.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/MASTER-CONTINUATION-CHECKLIST-2026-09-04.md](project-management/MASTER-CONTINUATION-CHECKLIST-2026-09-04.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/NEXT-OPERATOR-ACTIONS-AR-2026-09-16.md](project-management/NEXT-OPERATOR-ACTIONS-AR-2026-09-16.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/P2-01-SITE-CONTROLLER-RUNTIME-FOUNDATION.md](project-management/P2-01-SITE-CONTROLLER-RUNTIME-FOUNDATION.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/P2-02-CONFIGURATION-RECEIPT-INTEGRITY.md](project-management/P2-02-CONFIGURATION-RECEIPT-INTEGRITY.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/P2-03-DURABLE-LOCAL-CONFIGURATION.md](project-management/P2-03-DURABLE-LOCAL-CONFIGURATION.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/P2-04-SENSOR-ACQUISITION-2026-08-31.md](project-management/P2-04-SENSOR-ACQUISITION-2026-08-31.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/P2-05-OFFLINE-ALARM-EVALUATION-2026-08-31.md](project-management/P2-05-OFFLINE-ALARM-EVALUATION-2026-08-31.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/P2-06-LOCAL-EMERGENCY-SMS-FAILOVER-2026-08-31.md](project-management/P2-06-LOCAL-EMERGENCY-SMS-FAILOVER-2026-08-31.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/P2-07-RECONNECT-RECONCILIATION-2026-08-31.md](project-management/P2-07-RECONNECT-RECONCILIATION-2026-08-31.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/P2-08-CONTROLLER-HEALTH-EVIDENCE-2026-08-31.md](project-management/P2-08-CONTROLLER-HEALTH-EVIDENCE-2026-08-31.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/P2-09-BENCH-QUALIFICATION-2026-08-31.md](project-management/P2-09-BENCH-QUALIFICATION-2026-08-31.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/P2-HARDENING-DURABLE-CONFIG-REPLAY-2026-08-31.md](project-management/P2-HARDENING-DURABLE-CONFIG-REPLAY-2026-08-31.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/P3-01-COMMISSIONING-EVIDENCE-FOUNDATION-2026-09-01.md](project-management/P3-01-COMMISSIONING-EVIDENCE-FOUNDATION-2026-09-01.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/P3-03-CODEX-HANDOFF-2026-09-01.md](project-management/P3-03-CODEX-HANDOFF-2026-09-01.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/P3-04-CONFIGURATION-READINESS-2026-09-01.md](project-management/P3-04-CONFIGURATION-READINESS-2026-09-01.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/P7-FINAL-PRODUCT-COMPLETION-PLAN-2026-09-01.md](project-management/P7-FINAL-PRODUCT-COMPLETION-PLAN-2026-09-01.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/P8-01-WHATSAPP-EMAIL-ALERT-DELIVERY-2026-09-02.md](project-management/P8-01-WHATSAPP-EMAIL-ALERT-DELIVERY-2026-09-02.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/P8-01A-TELEGRAM-INTERIM-ALARM-DELIVERY-2026-09-03.md](project-management/P8-01A-TELEGRAM-INTERIM-ALARM-DELIVERY-2026-09-03.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/P8-SYSTEM-OWNER-INSTALLATION-AND-RBAC-PLAN-2026-09-02.md](project-management/P8-SYSTEM-OWNER-INSTALLATION-AND-RBAC-PLAN-2026-09-02.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/PVR-01-PLATFORM-INTEGRATION-RECOVERY.md](project-management/PVR-01-PLATFORM-INTEGRATION-RECOVERY.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/PVR-02-OPERATIONAL-WORKSPACE.md](project-management/PVR-02-OPERATIONAL-WORKSPACE.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/PVR-03-MONITORED-AREAS-COMPLETION.md](project-management/PVR-03-MONITORED-AREAS-COMPLETION.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/PVR-04-ALARMS-UI.md](project-management/PVR-04-ALARMS-UI.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/PVR-05-DEVICES-UI.md](project-management/PVR-05-DEVICES-UI.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/PVR-06-REPORTING-READINESS-AUDIT.md](project-management/PVR-06-REPORTING-READINESS-AUDIT.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/PVR-07-PLATFORM-ACCEPTANCE.md](project-management/PVR-07-PLATFORM-ACCEPTANCE.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/REPOSITORY-CLEANUP-2026-09-22.md](project-management/REPOSITORY-CLEANUP-2026-09-22.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-10-DASHBOARD.md](project-management/SPRINT-10-DASHBOARD.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-12-DEVICE-ONBOARDING.md](project-management/SPRINT-12-DEVICE-ONBOARDING.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-13-PLAN.md](project-management/SPRINT-13-PLAN.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-14-PLAN.md](project-management/SPRINT-14-PLAN.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-14-S14-02-APPLICATION-SHELL.md](project-management/SPRINT-14-S14-02-APPLICATION-SHELL.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-14-S14-05-PROGRESS.md](project-management/SPRINT-14-S14-05-PROGRESS.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-15-S15-01-SENSOR-CALIBRATION-FOUNDATION.md](project-management/SPRINT-15-S15-01-SENSOR-CALIBRATION-FOUNDATION.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-15-S15-02-CALIBRATION-HISTORY.md](project-management/SPRINT-15-S15-02-CALIBRATION-HISTORY.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-15-S15-03-DEVICE-COMMUNICATION-HEALTH.md](project-management/SPRINT-15-S15-03-DEVICE-COMMUNICATION-HEALTH.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-15-S15-04-NOTIFICATION-ARCHITECTURE.md](project-management/SPRINT-15-S15-04-NOTIFICATION-ARCHITECTURE.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-15-S15-05-SMS-FAILOVER-CONTRACT.md](project-management/SPRINT-15-S15-05-SMS-FAILOVER-CONTRACT.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-15-S15-06-BIO-EGYPT-PILOT-DOCUMENTATION.md](project-management/SPRINT-15-S15-06-BIO-EGYPT-PILOT-DOCUMENTATION.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-15-S15-07-DEPLOYMENT-COMMISSIONING-READINESS.md](project-management/SPRINT-15-S15-07-DEPLOYMENT-COMMISSIONING-READINESS.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-16-MASTER-PLAN.md](project-management/SPRINT-16-MASTER-PLAN.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-16-S16-01-REQUIREMENTS-BASELINE.md](project-management/SPRINT-16-S16-01-REQUIREMENTS-BASELINE.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-16-S16-03-REPORTING-ARCHITECTURE.md](project-management/SPRINT-16-S16-03-REPORTING-ARCHITECTURE.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-16-S16-04-HARDWARE-DESIGN-REVIEW.md](project-management/SPRINT-16-S16-04-HARDWARE-DESIGN-REVIEW.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-16-S16-06-IMPLEMENTATION-REVIEW.md](project-management/SPRINT-16-S16-06-IMPLEMENTATION-REVIEW.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-16-S16-07-01-REPORTING-CONTRACTS.md](project-management/SPRINT-16-S16-07-01-REPORTING-CONTRACTS.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-16-S16-07-02-CALIBRATION-PREVIEW.md](project-management/SPRINT-16-S16-07-02-CALIBRATION-PREVIEW.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-16-S16-07-04-CALIBRATION-CSV.md](project-management/SPRINT-16-S16-07-04-CALIBRATION-CSV.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/SPRINT-16-S16-07-05-CALIBRATION-PDF.md](project-management/SPRINT-16-S16-07-05-CALIBRATION-PDF.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/UI-UX-PRODUCT-REFRESH-WORK-PACKAGE-2026-09-04.md](project-management/UI-UX-PRODUCT-REFRESH-WORK-PACKAGE-2026-09-04.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/UI-UX-VISUAL-DESIGN-FREEZE-2026-09-04.md](project-management/UI-UX-VISUAL-DESIGN-FREEZE-2026-09-04.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/UX-01-FRONTEND-INVENTORY-BASELINE-2026-09-07.md](project-management/UX-01-FRONTEND-INVENTORY-BASELINE-2026-09-07.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/project-management/WORK-2026-09-04-UI-UX-VISUAL-REFRESH.md](project-management/WORK-2026-09-04-UI-UX-VISUAL-REFRESH.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/requirements/acceptance-criteria.md](requirements/acceptance-criteria.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/requirements/business-rules.md](requirements/business-rules.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/requirements/functional-requirements.md](requirements/functional-requirements.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/requirements/non-functional-requirements.md](requirements/non-functional-requirements.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/requirements/unctional-requirements.md](requirements/unctional-requirements.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/requirements/use-cases.md](requirements/use-cases.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/security/AUTH-RECOVERY-01-DESIGN.md](security/AUTH-RECOVERY-01-DESIGN.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/security/LICENSE-SIGNING-KEY-OPERATIONS.md](security/LICENSE-SIGNING-KEY-OPERATIONS.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/security/SEC-OWNER-01-STATUS-AND-MERGE-CHECKLIST-AR.md](security/SEC-OWNER-01-STATUS-AND-MERGE-CHECKLIST-AR.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/security/activation-workflow.md](security/activation-workflow.md) | Reference / specification; not a current-state or acceptance claim |
| [docs/security/device-registration.md](security/device-registration.md) | Reference / specification; not a current-state or acceptance claim |
| [installer/windows/INTERNAL-SETUP-TESTING.md](../installer/windows/INTERNAL-SETUP-TESTING.md) | Reference / specification; not a current-state or acceptance claim |

## Historical records

See [archive inventory](archive/README.md) for all 72 moved records and their previous paths.

# BIO-EMS Documentation Index

Inventory date: 30 September 2026. Source baseline: `6efd78a9fd9ea50a1d1b0e88f074708be1189546`.

`PROJECT_STATE.md` is the sole current-state authority; `IMPLEMENTATION_PLAN.md` controls execution. `VERSION` controls source version; dated closure, Sprint, ADR and test documents retain the evidence and decision boundaries of their recorded date. They are not new acceptance evidence. Historical records are preserved instead of rewriting past results.

This reconciliation updates active entry points and operating/design guidance. The inventory includes every tracked Markdown document; listing a document does not claim a fresh line-by-line validation of every historical detail. Exact source/schema/API contracts prevail over unsupported feature claims. External Word manuals require a separate artifact revision before being described as updated.

## Open operational decisions

- MAIN-16/SIM-D4: 1–4 populated modules × 4 sensors; implement/version main and SIM firmware, Modbus map and 2G fallback.
- Resolve PT100 field baseline versus DS18B20 bench candidate and El Manial six/seven positions.
- Reconcile ADMIN topology permissions with prior approval; finish Builder threshold controls.
- Complete physical USB pairing, sensor acquisition, Windows/restore qualification, live notifications and field UAT.

## Complete Markdown inventory

| Document | Role / interpretation |
| --- | --- |
| [CHANGELOG.md](../CHANGELOG.md) | Reference / operating or design document |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Reference / operating or design document |
| [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) | Current execution-plan authority |
| [PILOT_SCOPE.md](../PILOT_SCOPE.md) | Reference / operating or design document |
| [PROJECT_RULES.md](../PROJECT_RULES.md) | Reference / operating or design document |
| [PROJECT_STATE.md](../PROJECT_STATE.md) | Sole current-state authority |
| [README.md](../README.md) | Reference / operating or design document |
| [RISK_REGISTER.md](../RISK_REGISTER.md) | Reference / operating or design document |
| [backend/README.md](../backend/README.md) | Reference / operating or design document |
| [docs/BIO-EMS-Alarm-Architecture.md](BIO-EMS-Alarm-Architecture.md) | Reference / operating or design document |
| [docs/BIO-EMS-Design-Rules.md](BIO-EMS-Design-Rules.md) | Reference / operating or design document |
| [docs/BIO-EMS-FULL-AUDIT-2026-08-17.md](BIO-EMS-FULL-AUDIT-2026-08-17.md) | Historical evidence / dated decision |
| [docs/BIO-EMS-MQTT-Protocol.md](BIO-EMS-MQTT-Protocol.md) | Reference / operating or design document |
| [docs/BIO-EMS-SITE-BOUND-LICENSING-ARCHITECTURE.md](BIO-EMS-SITE-BOUND-LICENSING-ARCHITECTURE.md) | Reference / operating or design document |
| [docs/HARDWARE-V1-MODULAR-COTS-ARCHITECTURE.md](HARDWARE-V1-MODULAR-COTS-ARCHITECTURE.md) | Reference / operating or design document |
| [docs/PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) | Reference / operating or design document |
| [docs/PROJECT-RD-PLANNING.md](PROJECT-RD-PLANNING.md) | Reference / operating or design document |
| [docs/REALTIME_UI_UPDATE_BACKLOG.md](REALTIME_UI_UPDATE_BACKLOG.md) | Reference / operating or design document |
| [docs/SPRINT-08-ALARM-LIFECYCLE.md](SPRINT-08-ALARM-LIFECYCLE.md) | Historical evidence / dated decision |
| [docs/SPRINT-09-REST-API.md](SPRINT-09-REST-API.md) | Historical evidence / dated decision |
| [docs/SPRINT_PROGRESS.md](SPRINT_PROGRESS.md) | Historical evidence / dated decision |
| [docs/UPF-01-UNIVERSAL-PLATFORM-FOUNDATION.md](UPF-01-UNIVERSAL-PLATFORM-FOUNDATION.md) | Reference / operating or design document |
| [docs/adr/ADR-001.md](adr/ADR-001.md) | Historical evidence / dated decision |
| [docs/adr/ADR-002.md](adr/ADR-002.md) | Historical evidence / dated decision |
| [docs/adr/ADR-003.md](adr/ADR-003.md) | Historical evidence / dated decision |
| [docs/adr/ADR-004-device-design.md](adr/ADR-004-device-design.md) | Historical evidence / dated decision |
| [docs/adr/ADR-005-monitoring-points.md](adr/ADR-005-monitoring-points.md) | Historical evidence / dated decision |
| [docs/adr/ADR-006-domain-naming.md](adr/ADR-006-domain-naming.md) | Historical evidence / dated decision |
| [docs/adr/ADR-007-device-abstraction.md](adr/ADR-007-device-abstraction.md) | Historical evidence / dated decision |
| [docs/adr/ADR-008-asset-centric-design.md](adr/ADR-008-asset-centric-design.md) | Historical evidence / dated decision |
| [docs/adr/ADR-009-device-registration-policy.md](adr/ADR-009-device-registration-policy.md) | Historical evidence / dated decision |
| [docs/adr/ADR-010-device-onboarding.md](adr/ADR-010-device-onboarding.md) | Historical evidence / dated decision |
| [docs/adr/ADR-011-Zone is an Engineering Concept.md](adr/ADR-011-Zone%20is%20an%20Engineering%20Concept.md) | Historical evidence / dated decision |
| [docs/adr/ADR-012 - Zone Controller Architecture.md](adr/ADR-012%20-%20Zone%20Controller%20Architecture.md) | Historical evidence / dated decision |
| [docs/adr/ADR-013 -Zone Controller Placement Standard.md](adr/ADR-013%20-Zone%20Controller%20Placement%20Standard.md) | Historical evidence / dated decision |
| [docs/adr/ADR-014 -Home Run Wiring Standard.md](adr/ADR-014%20-Home%20Run%20Wiring%20Standard.md) | Historical evidence / dated decision |
| [docs/adr/ADR-015-dashboard-aggregation-architecture.md](adr/ADR-015-dashboard-aggregation-architecture.md) | Historical evidence / dated decision |
| [docs/adr/ADR-016-dashboard-widget-api-architecture.md](adr/ADR-016-dashboard-widget-api-architecture.md) | Historical evidence / dated decision |
| [docs/adr/ADR-017-generic-telemetry-query-architecture.md](adr/ADR-017-generic-telemetry-query-architecture.md) | Historical evidence / dated decision |
| [docs/adr/ADR-018-evidence-based-development-rule.md](adr/ADR-018-evidence-based-development-rule.md) | Historical evidence / dated decision |
| [docs/adr/ADR-019-frontend-foundation.md](adr/ADR-019-frontend-foundation.md) | Historical evidence / dated decision |
| [docs/adr/ADR-020-frontend-application-shell.md](adr/ADR-020-frontend-application-shell.md) | Historical evidence / dated decision |
| [docs/adr/ADR-021-frontend-authentication-session.md](adr/ADR-021-frontend-authentication-session.md) | Historical evidence / dated decision |
| [docs/adr/ADR-022-system-owner-installation-provisioning-and-customer-rbac.md](adr/ADR-022-system-owner-installation-provisioning-and-customer-rbac.md) | Historical evidence / dated decision |
| [docs/architecture/BIO-EMS-Architecture.md](architecture/BIO-EMS-Architecture.md) | Reference / operating or design document |
| [docs/architecture/BIO-EMS-Coding-Standards.md](architecture/BIO-EMS-Coding-Standards.md) | Reference / operating or design document |
| [docs/architecture/BIO-EMS-Database.md](architecture/BIO-EMS-Database.md) | Reference / operating or design document |
| [docs/architecture/BIO-EMS-Design-Rules.md](architecture/BIO-EMS-Design-Rules.md) | Reference / operating or design document |
| [docs/architecture/BIO-EMS-MQTT-Protocol.md](architecture/BIO-EMS-MQTT-Protocol.md) | Reference / operating or design document |
| [docs/architecture/BIO-EMS-Roadmap.md](architecture/BIO-EMS-Roadmap.md) | Reference / operating or design document |
| [docs/architecture/PRODUCT-CONFIGURABILITY-GAP-REGISTER.md](architecture/PRODUCT-CONFIGURABILITY-GAP-REGISTER.md) | Reference / operating or design document |
| [docs/architecture/PRODUCT-CONFIGURABILITY-PRINCIPLE.md](architecture/PRODUCT-CONFIGURABILITY-PRINCIPLE.md) | Reference / operating or design document |
| [docs/architecture/SYSTEM-OWNER-AUDIT-CONFIGURATION-FOUNDATION.md](architecture/SYSTEM-OWNER-AUDIT-CONFIGURATION-FOUNDATION.md) | Historical evidence / dated decision |
| [docs/architecture/api-design.md](architecture/api-design.md) | Reference / operating or design document |
| [docs/architecture/business-domain.md](architecture/business-domain.md) | Reference / operating or design document |
| [docs/architecture/coding-guidelines.md](architecture/coding-guidelines.md) | Reference / operating or design document |
| [docs/architecture/database-design.md](architecture/database-design.md) | Reference / operating or design document |
| [docs/architecture/definition-of-done.md](architecture/definition-of-done.md) | Reference / operating or design document |
| [docs/architecture/domain-driven-design.md](architecture/domain-driven-design.md) | Reference / operating or design document |
| [docs/architecture/domain-model.md](architecture/domain-model.md) | Reference / operating or design document |
| [docs/architecture/entity-relationships.md](architecture/entity-relationships.md) | Reference / operating or design document |
| [docs/architecture/folder-structure.md](architecture/folder-structure.md) | Reference / operating or design document |
| [docs/architecture/implementation-boundaries.md](architecture/implementation-boundaries.md) | Reference / operating or design document |
| [docs/architecture/mqtt-topics.md](architecture/mqtt-topics.md) | Reference / operating or design document |
| [docs/architecture/roadmap.md](architecture/roadmap.md) | Reference / operating or design document |
| [docs/architecture/system-design.md](architecture/system-design.md) | Reference / operating or design document |
| [docs/deployment/DEP-01-02-INPUT-FREEZE-AND-BUILD.md](deployment/DEP-01-02-INPUT-FREEZE-AND-BUILD.md) | Reference / operating or design document |
| [docs/deployment/DEP-01-03-PROTECTED-CONFIGURATION-SERVICES.md](deployment/DEP-01-03-PROTECTED-CONFIGURATION-SERVICES.md) | Reference / operating or design document |
| [docs/deployment/DEP-01-04-HTTPS-FIREWALL-HEALTH.md](deployment/DEP-01-04-HTTPS-FIREWALL-HEALTH.md) | Reference / operating or design document |
| [docs/deployment/DEP-01-05-LIFECYCLE-RECOVERY.md](deployment/DEP-01-05-LIFECYCLE-RECOVERY.md) | Reference / operating or design document |
| [docs/deployment/DEP-01-WINDOWS-INSTALLER-FOUNDATION.md](deployment/DEP-01-WINDOWS-INSTALLER-FOUNDATION.md) | Reference / operating or design document |
| [docs/deployment/FULL-OFFLINE-WINDOWS-INSTALLER-PLAN.md](deployment/FULL-OFFLINE-WINDOWS-INSTALLER-PLAN.md) | Reference / operating or design document |
| [docs/deployment/LICENSING-INSTALLER-INTEGRATION.md](deployment/LICENSING-INSTALLER-INTEGRATION.md) | Reference / operating or design document |
| [docs/deployment/S15-07-READINESS-EVIDENCE.md](deployment/S15-07-READINESS-EVIDENCE.md) | Historical evidence / dated decision |
| [docs/deployment/SYSTEM-OWNER-BOOTSTRAP-AND-PLATFORM-JWT.md](deployment/SYSTEM-OWNER-BOOTSTRAP-AND-PLATFORM-JWT.md) | Reference / operating or design document |
| [docs/deployment/deployment-architecture.md](deployment/deployment-architecture.md) | Reference / operating or design document |
| [docs/deployment/production-runbook.md](deployment/production-runbook.md) | Reference / operating or design document |
| [docs/deployment/site-controller-integration-contract.md](deployment/site-controller-integration-contract.md) | Reference / operating or design document |
| [docs/development/API-Development-Standard.md](development/API-Development-Standard.md) | Reference / operating or design document |
| [docs/engineering/ADR_POLICY.md](engineering/ADR_POLICY.md) | Reference / operating or design document |
| [docs/engineering/AI_DEVELOPMENT_WORKFLOW.md](engineering/AI_DEVELOPMENT_WORKFLOW.md) | Reference / operating or design document |
| [docs/engineering/ARCHITECTURE_PRINCIPLES.md](engineering/ARCHITECTURE_PRINCIPLES.md) | Reference / operating or design document |
| [docs/engineering/CODE_REVIEW_CHECKLIST.md](engineering/CODE_REVIEW_CHECKLIST.md) | Reference / operating or design document |
| [docs/engineering/DOMAIN_GUIDELINES.md](engineering/DOMAIN_GUIDELINES.md) | Reference / operating or design document |
| [docs/engineering/ENGINEERING_GLOSSARY.md](engineering/ENGINEERING_GLOSSARY.md) | Reference / operating or design document |
| [docs/engineering/ENGINEERING_PLAYBOOK.md](engineering/ENGINEERING_PLAYBOOK.md) | Reference / operating or design document |
| [docs/engineering/GIT_WORKFLOW.md](engineering/GIT_WORKFLOW.md) | Reference / operating or design document |
| [docs/engineering/README.md](engineering/README.md) | Reference / operating or design document |
| [docs/engineering/RELEASE_PROCESS.md](engineering/RELEASE_PROCESS.md) | Reference / operating or design document |
| [docs/engineering/TESTING_GUIDELINES.md](engineering/TESTING_GUIDELINES.md) | Reference / operating or design document |
| [docs/hardware/APPROVED_HARDWARE.md](hardware/APPROVED_HARDWARE.md) | Reference / operating or design document |
| [docs/hardware/BIO-EGYPT-PILOT-HARDWARE-TEST-PROTOCOL.md](hardware/BIO-EGYPT-PILOT-HARDWARE-TEST-PROTOCOL.md) | Reference / operating or design document |
| [docs/hardware/BIO-EGYPT-PILOT-INITIAL-HARDWARE-VALIDATION-PLAN.md](hardware/BIO-EGYPT-PILOT-INITIAL-HARDWARE-VALIDATION-PLAN.md) | Reference / operating or design document |
| [docs/hardware/BIO-EMS-MODULAR-HARDWARE-ARCHITECTURE-2026-09-24.md](hardware/BIO-EMS-MODULAR-HARDWARE-ARCHITECTURE-2026-09-24.md) | Historical evidence / dated decision |
| [docs/hardware/BIO-EMS-PDU-24-S5-STANDARD-2026-09-24.md](hardware/BIO-EMS-PDU-24-S5-STANDARD-2026-09-24.md) | Historical evidence / dated decision |
| [docs/hardware/HARDWARE-PROTECTION-BOM-CABLE-UPDATE-2026-08-27.md](hardware/HARDWARE-PROTECTION-BOM-CABLE-UPDATE-2026-08-27.md) | Historical evidence / dated decision |
| [docs/hardware/HW-PWR-01-EL-MANIAL-24V-PDU-DESIGN-2026-09-24.md](hardware/HW-PWR-01-EL-MANIAL-24V-PDU-DESIGN-2026-09-24.md) | Historical evidence / dated decision |
| [docs/hardware/HW-SIM-01-PILOT-SIM-T4-NO-CUSTOM-PCB-2026-09-24.md](hardware/HW-SIM-01-PILOT-SIM-T4-NO-CUSTOM-PCB-2026-09-24.md) | Historical evidence / dated decision |
| [docs/hardware/MAIN-16-2G-SIM-D4-REV-A-BENCH-BASELINE-2026-09-28.md](hardware/MAIN-16-2G-SIM-D4-REV-A-BENCH-BASELINE-2026-09-28.md) | Historical evidence / dated decision |
| [docs/hardware/PILOT-HARDWARE-DISCUSSION-2026-08-26.md](hardware/PILOT-HARDWARE-DISCUSSION-2026-08-26.md) | Historical evidence / dated decision |
| [docs/hardware/installation-guide.md](hardware/installation-guide.md) | Reference / operating or design document |
| [docs/hardware/wiring-standard.md](hardware/wiring-standard.md) | Reference / operating or design document |
| [docs/hardware/zc-16.md](hardware/zc-16.md) | Reference / operating or design document |
| [docs/hardware/zone-controller.md](hardware/zone-controller.md) | Reference / operating or design document |
| [docs/pilot/bio-egypt/BE-002-MARKED-UP-SENSOR-POSITION-PACK.md](pilot/bio-egypt/BE-002-MARKED-UP-SENSOR-POSITION-PACK.md) | Reference / operating or design document |
| [docs/pilot/bio-egypt/BIO-EGYPT-COMMISSIONING.md](pilot/bio-egypt/BIO-EGYPT-COMMISSIONING.md) | Reference / operating or design document |
| [docs/pilot/bio-egypt/BIO-EGYPT-CUSTOMER-EVIDENCE-REGISTER-2026-08-31.md](pilot/bio-egypt/BIO-EGYPT-CUSTOMER-EVIDENCE-REGISTER-2026-08-31.md) | Historical evidence / dated decision |
| [docs/pilot/bio-egypt/BIO-EGYPT-INSTALLATION-WIRING.md](pilot/bio-egypt/BIO-EGYPT-INSTALLATION-WIRING.md) | Reference / operating or design document |
| [docs/pilot/bio-egypt/BIO-EGYPT-OPEN-ITEMS.md](pilot/bio-egypt/BIO-EGYPT-OPEN-ITEMS.md) | Reference / operating or design document |
| [docs/pilot/bio-egypt/BIO-EGYPT-PILOT-SCOPE.md](pilot/bio-egypt/BIO-EGYPT-PILOT-SCOPE.md) | Reference / operating or design document |
| [docs/pilot/bio-egypt/BIO-EGYPT-SENSOR-MAP.md](pilot/bio-egypt/BIO-EGYPT-SENSOR-MAP.md) | Reference / operating or design document |
| [docs/pilot/bio-egypt/BIO-EGYPT-SITE-SURVEY-PACK.md](pilot/bio-egypt/BIO-EGYPT-SITE-SURVEY-PACK.md) | Reference / operating or design document |
| [docs/pilot/bio-egypt/BIO-EGYPT-SOFTWARE-UAT-GUIDE.md](pilot/bio-egypt/BIO-EGYPT-SOFTWARE-UAT-GUIDE.md) | Reference / operating or design document |
| [docs/pilot/bio-egypt/EL-MANIAL-HARDWARE-DESIGN-PROCUREMENT-BASELINE-2026-09-24.md](pilot/bio-egypt/EL-MANIAL-HARDWARE-DESIGN-PROCUREMENT-BASELINE-2026-09-24.md) | Historical evidence / dated decision |
| [docs/pilot/bio-egypt/README.md](pilot/bio-egypt/README.md) | Reference / operating or design document |
| [docs/product/BIO-EMS-ARABIC-PROJECT-GUIDE.md](product/BIO-EMS-ARABIC-PROJECT-GUIDE.md) | Reference / operating or design document |
| [docs/product/SPRINT-16-S16-02-DESIGN-SYSTEM-WIREFRAMES.md](product/SPRINT-16-S16-02-DESIGN-SYSTEM-WIREFRAMES.md) | Historical evidence / dated decision |
| [docs/product/product-principles.md](product/product-principles.md) | Reference / operating or design document |
| [docs/product/product-vision.md](product/product-vision.md) | Reference / operating or design document |
| [docs/product/security-roadmap.md](product/security-roadmap.md) | Reference / operating or design document |
| [docs/product/user-journey.md](product/user-journey.md) | Reference / operating or design document |
| [docs/project-ideas.md](project-ideas.md) | Reference / operating or design document |
| [docs/project-management/BACKEND-FOUNDATION-BF-01-BF-08-CLOSURE.md](project-management/BACKEND-FOUNDATION-BF-01-BF-08-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/BACKEND-FOUNDATION-SYSTEM-OWNER-AUDIT-CONFIGURATION-WORK-PACKAGE.md](project-management/BACKEND-FOUNDATION-SYSTEM-OWNER-AUDIT-CONFIGURATION-WORK-PACKAGE.md) | Historical evidence / dated decision |
| [docs/project-management/BF-01-SYSTEM-OWNER-BOUNDARY-CLOSURE.md](project-management/BF-01-SYSTEM-OWNER-BOUNDARY-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/BF-02-AUDIT-FOUNDATION-CLOSURE.md](project-management/BF-02-AUDIT-FOUNDATION-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/BF-03-USER-AUDIT-INTEGRATION.md](project-management/BF-03-USER-AUDIT-INTEGRATION.md) | Historical evidence / dated decision |
| [docs/project-management/BF-04-EDITABLE-ALARM-THRESHOLDS.md](project-management/BF-04-EDITABLE-ALARM-THRESHOLDS.md) | Historical evidence / dated decision |
| [docs/project-management/BF-05-CONFIGURABLE-ALARM-DELAY.md](project-management/BF-05-CONFIGURABLE-ALARM-DELAY.md) | Historical evidence / dated decision |
| [docs/project-management/BF-06-NOTIFICATION-RECIPIENT-DIRECTORY-CLOSURE.md](project-management/BF-06-NOTIFICATION-RECIPIENT-DIRECTORY-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/BF-06-NOTIFICATION-RECIPIENT-DIRECTORY.md](project-management/BF-06-NOTIFICATION-RECIPIENT-DIRECTORY.md) | Historical evidence / dated decision |
| [docs/project-management/BF-07-ESCALATION-POLICY-CLOSURE.md](project-management/BF-07-ESCALATION-POLICY-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/BF-07-ESCALATION-POLICY.md](project-management/BF-07-ESCALATION-POLICY.md) | Historical evidence / dated decision |
| [docs/project-management/BF-08-SITE-CONTROLLER-CONFIG-SYNC-CLOSURE.md](project-management/BF-08-SITE-CONTROLLER-CONFIG-SYNC-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/BF-08-SITE-CONTROLLER-CONFIG-SYNC-CONTRACT.md](project-management/BF-08-SITE-CONTROLLER-CONFIG-SYNC-CONTRACT.md) | Historical evidence / dated decision |
| [docs/project-management/BF-09-01-FRONTEND-READINESS-CLOSURE.md](project-management/BF-09-01-FRONTEND-READINESS-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/BF-09-02-SENSOR-CONFIGURATION-UI-CLOSURE.md](project-management/BF-09-02-SENSOR-CONFIGURATION-UI-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/BF-09-03-NOTIFICATION-RECIPIENT-UI-CLOSURE.md](project-management/BF-09-03-NOTIFICATION-RECIPIENT-UI-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/BF-09-04-ESCALATION-POLICY-UI-CLOSURE.md](project-management/BF-09-04-ESCALATION-POLICY-UI-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/BF-09-05-AUDIT-USER-MANAGEMENT-UI-CLOSURE.md](project-management/BF-09-05-AUDIT-USER-MANAGEMENT-UI-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/BF-09-06-FINAL-CLOSURE.md](project-management/BF-09-06-FINAL-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/BF-09-FRONTEND-READINESS-WORK-PACKAGE.md](project-management/BF-09-FRONTEND-READINESS-WORK-PACKAGE.md) | Historical evidence / dated decision |
| [docs/project-management/COM-01-06-IMPLEMENTATION-CLOSURE-2026-09-16.md](project-management/COM-01-06-IMPLEMENTATION-CLOSURE-2026-09-16.md) | Historical evidence / dated decision |
| [docs/project-management/COMMUNICATION-CHANNEL-ADMIN-CONFIG-WORK-PACKAGE-2026-09-11.md](project-management/COMMUNICATION-CHANNEL-ADMIN-CONFIG-WORK-PACKAGE-2026-09-11.md) | Historical evidence / dated decision |
| [docs/project-management/COMPLETE-AUDIT-MASTER-EXECUTION-PLAN-2026-09-11.md](project-management/COMPLETE-AUDIT-MASTER-EXECUTION-PLAN-2026-09-11.md) | Historical evidence / dated decision |
| [docs/project-management/CONTROLLED-HANDOFF-2026-09-11.md](project-management/CONTROLLED-HANDOFF-2026-09-11.md) | Historical evidence / dated decision |
| [docs/project-management/DECISIONS.md](project-management/DECISIONS.md) | Historical evidence / dated decision |
| [docs/project-management/DEP-01-01-INSTALLER-FOUNDATION-CLOSURE-2026-09-07.md](project-management/DEP-01-01-INSTALLER-FOUNDATION-CLOSURE-2026-09-07.md) | Historical evidence / dated decision |
| [docs/project-management/DEP-01-02-INPUT-FREEZE-BUILD-CLOSURE-2026-09-08.md](project-management/DEP-01-02-INPUT-FREEZE-BUILD-CLOSURE-2026-09-08.md) | Historical evidence / dated decision |
| [docs/project-management/DEP-01-03-PROTECTED-CONFIGURATION-SERVICES-CLOSURE-2026-09-08.md](project-management/DEP-01-03-PROTECTED-CONFIGURATION-SERVICES-CLOSURE-2026-09-08.md) | Historical evidence / dated decision |
| [docs/project-management/DEP-01-04-HTTPS-FIREWALL-HEALTH-CLOSURE-2026-09-08.md](project-management/DEP-01-04-HTTPS-FIREWALL-HEALTH-CLOSURE-2026-09-08.md) | Historical evidence / dated decision |
| [docs/project-management/DEP-01-05-LIFECYCLE-RECOVERY-CLOSURE-2026-09-08.md](project-management/DEP-01-05-LIFECYCLE-RECOVERY-CLOSURE-2026-09-08.md) | Historical evidence / dated decision |
| [docs/project-management/DOCUMENTATION-STATE-AUDIT-2026-09-01.md](project-management/DOCUMENTATION-STATE-AUDIT-2026-09-01.md) | Historical evidence / dated decision |
| [docs/project-management/EMAIL-TELEGRAM-END-TO-END-EVIDENCE-2026-09-09.md](project-management/EMAIL-TELEGRAM-END-TO-END-EVIDENCE-2026-09-09.md) | Historical evidence / dated decision |
| [docs/project-management/END-OF-DAY-HANDOFF-2026-09-08.md](project-management/END-OF-DAY-HANDOFF-2026-09-08.md) | Historical evidence / dated decision |
| [docs/project-management/ESP32-S3-PILOT-PAIRING-V1-IMPLEMENTATION-2026-09-23.md](project-management/ESP32-S3-PILOT-PAIRING-V1-IMPLEMENTATION-2026-09-23.md) | Historical evidence / dated decision |
| [docs/project-management/GLOBAL-LOCALIZATION-AND-P8-01-EMAIL-HANDOFF-2026-09-03.md](project-management/GLOBAL-LOCALIZATION-AND-P8-01-EMAIL-HANDOFF-2026-09-03.md) | Historical evidence / dated decision |
| [docs/project-management/INSTALLATION-BUILDER-DEVICE-PROVISIONING-WORK-PACKAGE-2026-09-27.md](project-management/INSTALLATION-BUILDER-DEVICE-PROVISIONING-WORK-PACKAGE-2026-09-27.md) | Historical evidence / dated decision |
| [docs/project-management/LIC-01-LICENSING-DOMAIN-DATA-MODEL-2026-09-07.md](project-management/LIC-01-LICENSING-DOMAIN-DATA-MODEL-2026-09-07.md) | Historical evidence / dated decision |
| [docs/project-management/LIC-02-06-LICENSING-CORE-CLOSURE-2026-09-07.md](project-management/LIC-02-06-LICENSING-CORE-CLOSURE-2026-09-07.md) | Historical evidence / dated decision |
| [docs/project-management/LIC-07-10-LICENSING-GOVERNANCE-CLOSURE-2026-09-07.md](project-management/LIC-07-10-LICENSING-GOVERNANCE-CLOSURE-2026-09-07.md) | Historical evidence / dated decision |
| [docs/project-management/LIC-11-13-PRODUCTION-PROTECTION-CLOSURE-2026-09-07.md](project-management/LIC-11-13-PRODUCTION-PROTECTION-CLOSURE-2026-09-07.md) | Historical evidence / dated decision |
| [docs/project-management/LICENSING-ENTITLEMENTS-UI-CLOSURE-2026-09-28.md](project-management/LICENSING-ENTITLEMENTS-UI-CLOSURE-2026-09-28.md) | Historical evidence / dated decision |
| [docs/project-management/MASTER-CONTINUATION-CHECKLIST-2026-09-04.md](project-management/MASTER-CONTINUATION-CHECKLIST-2026-09-04.md) | Historical evidence / dated decision |
| [docs/project-management/NEXT-OPERATOR-ACTIONS-AR-2026-09-16.md](project-management/NEXT-OPERATOR-ACTIONS-AR-2026-09-16.md) | Historical evidence / dated decision |
| [docs/project-management/P1-CLOSURE-P2-EXECUTION-BASELINE-2026-08-31.md](project-management/P1-CLOSURE-P2-EXECUTION-BASELINE-2026-08-31.md) | Historical evidence / dated decision |
| [docs/project-management/P2-01-SITE-CONTROLLER-RUNTIME-FOUNDATION.md](project-management/P2-01-SITE-CONTROLLER-RUNTIME-FOUNDATION.md) | Historical evidence / dated decision |
| [docs/project-management/P2-02-CONFIGURATION-RECEIPT-INTEGRITY.md](project-management/P2-02-CONFIGURATION-RECEIPT-INTEGRITY.md) | Historical evidence / dated decision |
| [docs/project-management/P2-03-DURABLE-LOCAL-CONFIGURATION.md](project-management/P2-03-DURABLE-LOCAL-CONFIGURATION.md) | Historical evidence / dated decision |
| [docs/project-management/P2-04-SENSOR-ACQUISITION-2026-08-31.md](project-management/P2-04-SENSOR-ACQUISITION-2026-08-31.md) | Historical evidence / dated decision |
| [docs/project-management/P2-05-OFFLINE-ALARM-EVALUATION-2026-08-31.md](project-management/P2-05-OFFLINE-ALARM-EVALUATION-2026-08-31.md) | Historical evidence / dated decision |
| [docs/project-management/P2-06-LOCAL-EMERGENCY-SMS-FAILOVER-2026-08-31.md](project-management/P2-06-LOCAL-EMERGENCY-SMS-FAILOVER-2026-08-31.md) | Historical evidence / dated decision |
| [docs/project-management/P2-07-RECONNECT-RECONCILIATION-2026-08-31.md](project-management/P2-07-RECONNECT-RECONCILIATION-2026-08-31.md) | Historical evidence / dated decision |
| [docs/project-management/P2-08-CONTROLLER-HEALTH-EVIDENCE-2026-08-31.md](project-management/P2-08-CONTROLLER-HEALTH-EVIDENCE-2026-08-31.md) | Historical evidence / dated decision |
| [docs/project-management/P2-09-BENCH-QUALIFICATION-2026-08-31.md](project-management/P2-09-BENCH-QUALIFICATION-2026-08-31.md) | Historical evidence / dated decision |
| [docs/project-management/P2-HARDENING-DURABLE-CONFIG-REPLAY-2026-08-31.md](project-management/P2-HARDENING-DURABLE-CONFIG-REPLAY-2026-08-31.md) | Historical evidence / dated decision |
| [docs/project-management/P2-SOFTWARE-CLOSURE-2026-08-31.md](project-management/P2-SOFTWARE-CLOSURE-2026-08-31.md) | Historical evidence / dated decision |
| [docs/project-management/P3-01-COMMISSIONING-EVIDENCE-FOUNDATION-2026-09-01.md](project-management/P3-01-COMMISSIONING-EVIDENCE-FOUNDATION-2026-09-01.md) | Historical evidence / dated decision |
| [docs/project-management/P3-03-CODEX-HANDOFF-2026-09-01.md](project-management/P3-03-CODEX-HANDOFF-2026-09-01.md) | Historical evidence / dated decision |
| [docs/project-management/P3-04-CONFIGURATION-READINESS-2026-09-01.md](project-management/P3-04-CONFIGURATION-READINESS-2026-09-01.md) | Historical evidence / dated decision |
| [docs/project-management/P3-05-09-COMMISSIONING-TOOLING-CLOSURE-2026-09-01.md](project-management/P3-05-09-COMMISSIONING-TOOLING-CLOSURE-2026-09-01.md) | Historical evidence / dated decision |
| [docs/project-management/P4-PRODUCTION-HARDENING-CLOSURE-2026-09-01.md](project-management/P4-PRODUCTION-HARDENING-CLOSURE-2026-09-01.md) | Historical evidence / dated decision |
| [docs/project-management/P5-COMMERCIAL-OPERATIONS-CLOSURE-2026-09-01.md](project-management/P5-COMMERCIAL-OPERATIONS-CLOSURE-2026-09-01.md) | Historical evidence / dated decision |
| [docs/project-management/P6-PRODUCTIZATION-CLOSURE-2026-09-01.md](project-management/P6-PRODUCTIZATION-CLOSURE-2026-09-01.md) | Historical evidence / dated decision |
| [docs/project-management/P7-01-SYSTEM-OWNER-CONSOLE-CLOSURE-2026-09-01.md](project-management/P7-01-SYSTEM-OWNER-CONSOLE-CLOSURE-2026-09-01.md) | Historical evidence / dated decision |
| [docs/project-management/P7-02-CUSTOMER-SITE-FLEET-CLOSURE-2026-09-01.md](project-management/P7-02-CUSTOMER-SITE-FLEET-CLOSURE-2026-09-01.md) | Historical evidence / dated decision |
| [docs/project-management/P7-03-08-SOFTWARE-PRODUCT-CLOSURE-2026-09-02.md](project-management/P7-03-08-SOFTWARE-PRODUCT-CLOSURE-2026-09-02.md) | Historical evidence / dated decision |
| [docs/project-management/P7-FINAL-PRODUCT-COMPLETION-PLAN-2026-09-01.md](project-management/P7-FINAL-PRODUCT-COMPLETION-PLAN-2026-09-01.md) | Historical evidence / dated decision |
| [docs/project-management/P8-01-WHATSAPP-EMAIL-ALERT-DELIVERY-2026-09-02.md](project-management/P8-01-WHATSAPP-EMAIL-ALERT-DELIVERY-2026-09-02.md) | Historical evidence / dated decision |
| [docs/project-management/P8-01A-TELEGRAM-INTERIM-ALARM-DELIVERY-2026-09-03.md](project-management/P8-01A-TELEGRAM-INTERIM-ALARM-DELIVERY-2026-09-03.md) | Historical evidence / dated decision |
| [docs/project-management/P8-02-08-SOURCE-CLOSURE-2026-09-02.md](project-management/P8-02-08-SOURCE-CLOSURE-2026-09-02.md) | Historical evidence / dated decision |
| [docs/project-management/P8-SYSTEM-OWNER-INSTALLATION-AND-RBAC-PLAN-2026-09-02.md](project-management/P8-SYSTEM-OWNER-INSTALLATION-AND-RBAC-PLAN-2026-09-02.md) | Historical evidence / dated decision |
| [docs/project-management/PVR-01-PLATFORM-INTEGRATION-RECOVERY.md](project-management/PVR-01-PLATFORM-INTEGRATION-RECOVERY.md) | Historical evidence / dated decision |
| [docs/project-management/PVR-02-OPERATIONAL-WORKSPACE.md](project-management/PVR-02-OPERATIONAL-WORKSPACE.md) | Historical evidence / dated decision |
| [docs/project-management/PVR-03-MONITORED-AREAS-COMPLETION.md](project-management/PVR-03-MONITORED-AREAS-COMPLETION.md) | Historical evidence / dated decision |
| [docs/project-management/PVR-04-ALARMS-UI.md](project-management/PVR-04-ALARMS-UI.md) | Historical evidence / dated decision |
| [docs/project-management/PVR-05-DEVICES-UI.md](project-management/PVR-05-DEVICES-UI.md) | Historical evidence / dated decision |
| [docs/project-management/PVR-06-REPORTING-READINESS-AUDIT.md](project-management/PVR-06-REPORTING-READINESS-AUDIT.md) | Historical evidence / dated decision |
| [docs/project-management/PVR-07-PLATFORM-ACCEPTANCE.md](project-management/PVR-07-PLATFORM-ACCEPTANCE.md) | Historical evidence / dated decision |
| [docs/project-management/REPOSITORY-CLEANUP-2026-09-22.md](project-management/REPOSITORY-CLEANUP-2026-09-22.md) | Historical evidence / dated decision |
| [docs/project-management/SESSION-HANDOFF-AUDIT-2026-08-31.md](project-management/SESSION-HANDOFF-AUDIT-2026-08-31.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-10-DASHBOARD.md](project-management/SPRINT-10-DASHBOARD.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-11-CLOSURE.md](project-management/SPRINT-11-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-12-CLOSURE.md](project-management/SPRINT-12-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-12-DEVICE-ONBOARDING.md](project-management/SPRINT-12-DEVICE-ONBOARDING.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-13-CLOSURE.md](project-management/SPRINT-13-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-13-PLAN.md](project-management/SPRINT-13-PLAN.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-14-CLOSURE.md](project-management/SPRINT-14-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-14-PLAN.md](project-management/SPRINT-14-PLAN.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-14-S14-02-APPLICATION-SHELL.md](project-management/SPRINT-14-S14-02-APPLICATION-SHELL.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-14-S14-03-CLOSURE.md](project-management/SPRINT-14-S14-03-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-14-S14-04-CLOSURE.md](project-management/SPRINT-14-S14-04-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-14-S14-05-PROGRESS.md](project-management/SPRINT-14-S14-05-PROGRESS.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-15-CLOSURE.md](project-management/SPRINT-15-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-15-S15-01-CLOSURE.md](project-management/SPRINT-15-S15-01-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-15-S15-01-SENSOR-CALIBRATION-FOUNDATION.md](project-management/SPRINT-15-S15-01-SENSOR-CALIBRATION-FOUNDATION.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-15-S15-02-CALIBRATION-HISTORY.md](project-management/SPRINT-15-S15-02-CALIBRATION-HISTORY.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-15-S15-02-CLOSURE.md](project-management/SPRINT-15-S15-02-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-15-S15-03-CLOSURE.md](project-management/SPRINT-15-S15-03-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-15-S15-03-DEVICE-COMMUNICATION-HEALTH.md](project-management/SPRINT-15-S15-03-DEVICE-COMMUNICATION-HEALTH.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-15-S15-04-CLOSURE.md](project-management/SPRINT-15-S15-04-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-15-S15-04-NOTIFICATION-ARCHITECTURE.md](project-management/SPRINT-15-S15-04-NOTIFICATION-ARCHITECTURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-15-S15-05-CLOSURE.md](project-management/SPRINT-15-S15-05-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-15-S15-05-SMS-FAILOVER-CONTRACT.md](project-management/SPRINT-15-S15-05-SMS-FAILOVER-CONTRACT.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-15-S15-06-BIO-EGYPT-PILOT-DOCUMENTATION.md](project-management/SPRINT-15-S15-06-BIO-EGYPT-PILOT-DOCUMENTATION.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-15-S15-06-CLOSURE.md](project-management/SPRINT-15-S15-06-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-15-S15-07-CLOSURE.md](project-management/SPRINT-15-S15-07-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-15-S15-07-DEPLOYMENT-COMMISSIONING-READINESS.md](project-management/SPRINT-15-S15-07-DEPLOYMENT-COMMISSIONING-READINESS.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-16-MASTER-PLAN.md](project-management/SPRINT-16-MASTER-PLAN.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-16-S16-01-CLOSURE.md](project-management/SPRINT-16-S16-01-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-16-S16-01-REQUIREMENTS-BASELINE.md](project-management/SPRINT-16-S16-01-REQUIREMENTS-BASELINE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-16-S16-02-CLOSURE.md](project-management/SPRINT-16-S16-02-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-16-S16-03-CLOSURE.md](project-management/SPRINT-16-S16-03-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-16-S16-03-REPORTING-ARCHITECTURE.md](project-management/SPRINT-16-S16-03-REPORTING-ARCHITECTURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-16-S16-04-CLOSURE.md](project-management/SPRINT-16-S16-04-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-16-S16-04-HARDWARE-DESIGN-REVIEW.md](project-management/SPRINT-16-S16-04-HARDWARE-DESIGN-REVIEW.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-16-S16-06-CLOSURE.md](project-management/SPRINT-16-S16-06-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-16-S16-06-IMPLEMENTATION-REVIEW.md](project-management/SPRINT-16-S16-06-IMPLEMENTATION-REVIEW.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-16-S16-07-01-REPORTING-CONTRACTS.md](project-management/SPRINT-16-S16-07-01-REPORTING-CONTRACTS.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-16-S16-07-02-CALIBRATION-PREVIEW.md](project-management/SPRINT-16-S16-07-02-CALIBRATION-PREVIEW.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-16-S16-07-02-CLOSURE.md](project-management/SPRINT-16-S16-07-02-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-16-S16-07-03-CLOSURE.md](project-management/SPRINT-16-S16-07-03-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-16-S16-07-04-CALIBRATION-CSV.md](project-management/SPRINT-16-S16-07-04-CALIBRATION-CSV.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-16-S16-07-04-CLOSURE.md](project-management/SPRINT-16-S16-07-04-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-16-S16-07-05-CALIBRATION-PDF.md](project-management/SPRINT-16-S16-07-05-CALIBRATION-PDF.md) | Historical evidence / dated decision |
| [docs/project-management/SPRINT-16-S16-07-05-CLOSURE.md](project-management/SPRINT-16-S16-07-05-CLOSURE.md) | Historical evidence / dated decision |
| [docs/project-management/SYSTEM-OWNER-E2E-PILOT-ACCEPTANCE-2026-09-23.md](project-management/SYSTEM-OWNER-E2E-PILOT-ACCEPTANCE-2026-09-23.md) | Historical evidence / dated decision |
| [docs/project-management/UI-UX-PRODUCT-REFRESH-WORK-PACKAGE-2026-09-04.md](project-management/UI-UX-PRODUCT-REFRESH-WORK-PACKAGE-2026-09-04.md) | Historical evidence / dated decision |
| [docs/project-management/UI-UX-VISUAL-DESIGN-FREEZE-2026-09-04.md](project-management/UI-UX-VISUAL-DESIGN-FREEZE-2026-09-04.md) | Historical evidence / dated decision |
| [docs/project-management/UX-01-FRONTEND-INVENTORY-BASELINE-2026-09-07.md](project-management/UX-01-FRONTEND-INVENTORY-BASELINE-2026-09-07.md) | Historical evidence / dated decision |
| [docs/project-management/UX-02-BRAND-SHARED-DESIGN-SYSTEM-CLOSURE-2026-09-07.md](project-management/UX-02-BRAND-SHARED-DESIGN-SYSTEM-CLOSURE-2026-09-07.md) | Historical evidence / dated decision |
| [docs/project-management/UX-03-OPENING-ENTRY-EXPERIENCE-CLOSURE-2026-09-07.md](project-management/UX-03-OPENING-ENTRY-EXPERIENCE-CLOSURE-2026-09-07.md) | Historical evidence / dated decision |
| [docs/project-management/UX-04-COMPACT-OPERATIONAL-DASHBOARD-CLOSURE-2026-09-07.md](project-management/UX-04-COMPACT-OPERATIONAL-DASHBOARD-CLOSURE-2026-09-07.md) | Historical evidence / dated decision |
| [docs/project-management/UX-05-MONITORING-AREAS-LIVE-BOARD-CLOSURE-2026-09-07.md](project-management/UX-05-MONITORING-AREAS-LIVE-BOARD-CLOSURE-2026-09-07.md) | Historical evidence / dated decision |
| [docs/project-management/UX-06-HIGH-FREQUENCY-OPERATIONS-REFRESH-CLOSURE-2026-09-07.md](project-management/UX-06-HIGH-FREQUENCY-OPERATIONS-REFRESH-CLOSURE-2026-09-07.md) | Historical evidence / dated decision |
| [docs/project-management/UX-07-REMAINING-CUSTOMER-SURFACES-CLOSURE-2026-09-07.md](project-management/UX-07-REMAINING-CUSTOMER-SURFACES-CLOSURE-2026-09-07.md) | Historical evidence / dated decision |
| [docs/project-management/UX-08-SYSTEM-OWNER-P8-WORKFLOW-REFRESH-CLOSURE-2026-09-07.md](project-management/UX-08-SYSTEM-OWNER-P8-WORKFLOW-REFRESH-CLOSURE-2026-09-07.md) | Historical evidence / dated decision |
| [docs/project-management/UX-09-FULL-REGRESSION-CLOSURE-2026-09-07.md](project-management/UX-09-FULL-REGRESSION-CLOSURE-2026-09-07.md) | Historical evidence / dated decision |
| [docs/project-management/WORK-2026-09-04-UI-UX-VISUAL-REFRESH.md](project-management/WORK-2026-09-04-UI-UX-VISUAL-REFRESH.md) | Historical evidence / dated decision |
| [docs/reporting/BF-10-CLOSURE.md](reporting/BF-10-CLOSURE.md) | Historical evidence / dated decision |
| [docs/reporting/BF-10_READINESS_REVIEW.md](reporting/BF-10_READINESS_REVIEW.md) | Historical evidence / dated decision |
| [docs/requirements/acceptance-criteria.md](requirements/acceptance-criteria.md) | Reference / operating or design document |
| [docs/requirements/business-rules.md](requirements/business-rules.md) | Reference / operating or design document |
| [docs/requirements/functional-requirements.md](requirements/functional-requirements.md) | Reference / operating or design document |
| [docs/requirements/non-functional-requirements.md](requirements/non-functional-requirements.md) | Reference / operating or design document |
| [docs/requirements/unctional-requirements.md](requirements/unctional-requirements.md) | Reference / operating or design document |
| [docs/requirements/use-cases.md](requirements/use-cases.md) | Reference / operating or design document |
| [docs/security/AUTH-RECOVERY-01-DESIGN.md](security/AUTH-RECOVERY-01-DESIGN.md) | Reference / operating or design document |
| [docs/security/LICENSE-SIGNING-KEY-OPERATIONS.md](security/LICENSE-SIGNING-KEY-OPERATIONS.md) | Reference / operating or design document |
| [docs/security/SEC-OWNER-01-STATUS-AND-MERGE-CHECKLIST-AR.md](security/SEC-OWNER-01-STATUS-AND-MERGE-CHECKLIST-AR.md) | Reference / operating or design document |
| [docs/security/SYSTEM-OWNER-COMMISSIONING-OPERATIONS.md](security/SYSTEM-OWNER-COMMISSIONING-OPERATIONS.md) | Reference / operating or design document |
| [docs/security/SYSTEM-OWNER-MANUFACTURER-KEY-GUIDE-AR.md](security/SYSTEM-OWNER-MANUFACTURER-KEY-GUIDE-AR.md) | Reference / operating or design document |
| [docs/security/SYSTEM-OWNER-PROVISIONING-UI-AR.md](security/SYSTEM-OWNER-PROVISIONING-UI-AR.md) | Reference / operating or design document |
| [docs/security/activation-workflow.md](security/activation-workflow.md) | Reference / operating or design document |
| [docs/security/device-registration.md](security/device-registration.md) | Reference / operating or design document |
| [firmware/site-controller-esp32s3/README.md](../firmware/site-controller-esp32s3/README.md) | Reference / operating or design document |
| [frontend/README.md](../frontend/README.md) | Reference / operating or design document |
| [installer/windows/INTERNAL-SETUP-TESTING.md](../installer/windows/INTERNAL-SETUP-TESTING.md) | Reference / operating or design document |

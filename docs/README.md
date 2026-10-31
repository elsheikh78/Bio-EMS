# BIO-EMS Documentation

The [project state](../PROJECT_STATE.md) is the single current-state authority. This index maps documents; it does not create a second status ledger.

## Current source-backed guides

- [Software architecture and data flow](current/SOFTWARE-ARCHITECTURE.md)
- [Developer setup and test commands](current/DEVELOPER-AND-TESTING.md)
- [Platform operations and role boundaries](current/PLATFORM-OPERATIONS.md)
- [Hardware, Tester and firmware](current/HARDWARE-AND-FIRMWARE.md)
- [Main failover, critical hardware alarms and owner feature settings](current/MAIN-RESILIENCE-AND-FEATURE-SETTINGS.md)
- [Main resilience integration evidence — 31 October 2026](hardware/evidence/MAIN-RESILIENCE-INTEGRATION-2026-10-31.json)
- [Cloud, Viewer and mobile](current/CLOUD-AND-MOBILE.md)
- [Security and identity](current/SECURITY-AND-IDENTITY.md)
- [Build, release and recovery](current/BUILD-RELEASE-AND-RECOVERY.md)
- [Qualification and acceptance](current/QUALIFICATION-AND-ACCEPTANCE.md)
- [Documentation lifecycle and maintenance](current/DOCUMENTATION-MAINTENANCE.md)

## Audit and historical evidence

[28 October audit](audit/2026-10-28/README.md) contains scope, findings, dependency advisories, verification evidence, source inventory and a per-document classification. [Pre-audit snapshot](archive/2026-10-28-pre-audit/INDEX.md) preserves original documents byte for byte. The [archive index](archive/README.md) also retains earlier historical records in place.

ADRs remain in `adr/`; active specifications remain in `architecture/`, `security/`, `deployment/`, `hardware/`, `requirements/` and other domain folders. A date does not revoke a requirement. Historical work-package entrypoints now link to original evidence and current guides. Retained specifications carry a review boundary: proposed requirements are not a promise that all controls are implemented. Consult the source guide and findings when actual code differs from a requirement; obtain an approved change rather than silently weakening the requirement.

The document inventory excludes build files named CMakeLists.txt and the executable dependency specification requirements.txt. Images, diagrams, certificates and test-result binaries are retained as assets; this refresh does not alter their recorded evidence.

- [Central Main backup, SD, power supervision and acceptance](hardware/MAIN-CENTRAL-BATTERY-AND-SD-2026-10-18.md)

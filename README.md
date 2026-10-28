# BIO-EMS

Environmental monitoring platform with local operations, controlled installation/provisioning, a separate company cloud and customer Viewer, two mobile applications, ESP32-S3/Nano firmware and a standalone hardware qualification tool.

Product source version: **0.20.0**. Published tagged release: **v0.20.0**. Current source, candidate/merged distinctions, security findings and acceptance boundaries are maintained only in [PROJECT_STATE.md](PROJECT_STATE.md).

## Start here

| Need | Document |
| --- | --- |
| Current state and evidence limits | [Project state](PROJECT_STATE.md) |
| All documentation and preserved history | [Documentation index](docs/README.md) |
| 28 October code/documentation audit | [Audit report](docs/audit/2026-10-28/README.md) |
| System architecture and data flow | [Software architecture](docs/current/SOFTWARE-ARCHITECTURE.md) |
| Run/build/test source | [Developer guide](docs/current/DEVELOPER-AND-TESTING.md) |
| Platform operator responsibilities | [Platform operations](docs/current/PLATFORM-OPERATIONS.md) |
| Standalone hardware tests and firmware upload | [Hardware guide](docs/current/HARDWARE-AND-FIRMWARE.md) |
| Cloud, Viewer and mobile applications | [Cloud/mobile guide](docs/current/CLOUD-AND-MOBILE.md) |
| Security boundaries and recovery | [Security guide](docs/current/SECURITY-AND-IDENTITY.md) |
| Build, deployment and restore | [Release/recovery guide](docs/current/BUILD-RELEASE-AND-RECOVERY.md) |
| Qualification and field acceptance | [Acceptance guide](docs/current/QUALIFICATION-AND-ACCEPTANCE.md) |

## Repository map

`backend/`: Express/TypeScript, SQLite, InfluxDB integration, MQTT and durable operational services. `frontend/`: React/MUI local and System Owner workspaces. `company-cloud/`: Worker/D1 company administration, remote jobs and customer Viewer. `company-mobile/`: restricted company WebView shell. `mobile/`: separate customer monitoring app. `firmware/`: Main and Nano operating source. `tools/hardware-tester/`: offline bench tool. `installer/windows/`: governed Windows setup/update/restore scripts.

Read [PROJECT_RULES.md](PROJECT_RULES.md) and [CONTRIBUTING.md](CONTRIBUTING.md) before changing behavior. Builds do not establish field acceptance. Critical/High dependency advisories remain open; use the audit findings for remediation planning.

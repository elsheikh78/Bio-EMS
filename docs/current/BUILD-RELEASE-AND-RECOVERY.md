# Build, Release, Deployment and Recovery

Source-backed guide updated 31 October 2026 after PR #316. [PROJECT_STATE](../../PROJECT_STATE.md) controls candidate, release and installed-state claims. The merged source and successful CI packages do not constitute a new tagged release or a field deployment.

## Version and package authority

`VERSION` is the product source authority; backend metadata and release manifest must match. Frontend0.0.0 is package metadata, not the product release identifier. Main, Nano, Tester and mobile apps carry independent versions. Record commit SHA, workflow/run, package hash, signing identity and manifest as well as version. The published v0.20.0 tag is an immutable September snapshot and must not be moved to include October code.

CI workflow files define actual build inputs. Backend/frontend quality uses Node 22, cloud Node 24; firmware ESP-IDF/Arduino tooling and Windows packaging use their respective workflows. Local Linux builds/Expo exports are not native Windows/iOS release evidence. Dependency advisory closure is a release gate independent of functional CI success.

## Windows client

`installer/windows/Build-Setup.ps1`, `New-InstallerStaging.ps1`, `BioEMS.iss`, `package-contract.json` and vendor-input lock define staging/packaging. Services, protected configuration, pre-start migrations and post-install health are controlled scripts. Update validation checks package/signature/contracts before privileged jobs. The standalone Tester package is separate from Client Setup; neither package silently pairs controllers.

Use the governed Pilot launcher/setup and retain its diagnostics. Manufacturer tools and private signing/recovery responsibilities remain separate from customer client installation. Pilot internal/development certificates must not be represented as commercial production trust. Current physical reboot/repair/upgrade/rollback/uninstall/second-PC results must be attached to the exact installer package.

## Main pilot.10 rollout and evidence

Use the matching client backend (migration 36) **before** flashing Main pilot.10. Retain a coordinated backup and governed pilot.9 rollback package. Windows staging now requires the built BLE relay; it is bundled with the backend and runs under its Windows service process tree. Main/Nano/Tester are pilot.10 / bench.2 / 0.7.0 respectively. Configure Wi-Fi fallback during automatic commissioning, fit the USB BLE adapter and verify saved/applied revisions.

The reviewed PR-head workflows all passed. Exact tested head/CI merge, workflow URLs and Setup artifact identity are recorded in [the integration receipt](../hardware/evidence/MAIN-RESILIENCE-INTEGRATION-2026-10-31.json). Do not relabel those binaries as a later documentation commit or a newly published release. Before installation or declaring readiness, remind the owner about **DEP-01 and HW-01–HW-12** in [project state](../../PROJECT_STATE.md). Actual-PC upgrade, USB radio/service access, battery wiring and full-load/storage tests remain separate evidence.

## Backups and restore

SQLite configuration/operational persistence and Influx history are distinct. `backend/src/modules/platform-backup/` and installer restore coordinator scripts define the supported backup/restore path, schedules, validation and audit trail. Use the full coordinated backup set and required manifests/config/trust dependencies; copying one running DB file is not a full recovery strategy.

Before an approved restore, preserve a recoverable pre-change backup, validate source/destination installation identity and backup integrity, stop/coordinate required services and follow the governed workflow. Verify health, installation/device binding, users/permissions, alarm/notification state, historical telemetry, schedule behavior and retained audit records afterward. A valid checksum does not prove the restore is operationally complete. Restore drill evidence is required for the actual supported Windows/Influx environment.

## Cloud and mobile deployment

Cloud D1 schema, Worker bundle, assets and secret set must be compatible. Run dry-run and tests; apply only the intended controlled migrations with backups and rollback decisions, then verify live unauthenticated/authenticated boundaries and customer isolation. This audit does not deploy, migrate or infer current live state from a historical HTTP200 observation.

Expo export prepares app bundles but does not produce a signed store-ready iOS distribution or certify Android device behavior. Signing, native builds, device tests, background/network recovery and store release are separate gates. Do not embed company admin secrets in distributed apps.

## Release sequence

1. Triage/close blocking security findings and approve remaining risk explicitly in the release process.
2. Freeze source/config/vendor inputs and reconcile version/changelog/state/manifest.
3. Run final platform, cloud, mobile, Tester, firmware and Windows gates relevant to the package.
4. Complete physical/provider/restore/commissioning acceptance appropriate to the intended release claim.
5. Review and merge; publish an immutable tag/release only at the approved commit.
6. Verify downloadable artifacts, signatures/hashes and deployment health; record installed versions separately.

Documentation-only updates do not close any of these gates. See [qualification](QUALIFICATION-AND-ACCEPTANCE.md), retained deployment specifications and the [audit verification matrix](../audit/2026-10-28/VERIFICATION.md).

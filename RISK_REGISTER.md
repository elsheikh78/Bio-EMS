# BIO-EMS Risk Register

**Review date:** 11 September 2026

| ID | Risk | Impact | Current status | Mitigation / next action |
| --- | --- | --- | --- | --- |
| R-01 | Clean-machine installer still lacks post-PR-203 passing field evidence | High | Open | Rebuild after COM, test Fresh Install/reboot/repair/upgrade/uninstall on multiple clean PCs |
| R-02 | Provider credentials still depend on deployment configuration rather than full Admin UI | High | Open | Implement COM-01 through COM-06 |
| R-03 | WhatsApp Meta onboarding remains externally blocked | Medium | Open | Use Telegram interim path; continue Meta work in parallel |
| R-04 | SMS/GSM live delivery not yet proven | High | Open | Select/freeze transport and perform bench + Pilot failover tests |
| R-05 | Hardware controller/Sensor path not yet fully field-qualified | High | Open | Freeze BOM, bench test, calibration, power/network/endurance evidence |
| R-06 | BIO EGYPT not commissioned/accepted | High | Open | Execute field installation, commissioning and UAT after installer/hardware readiness |
| R-07 | Final Device PKI/mTLS/host-transfer architecture is approved but not implemented | High for production, Low for early Pilot | Deferred | Execute DEV-TRUST-01 through DEV-TRUST-11 after Pilot stabilization |
| R-08 | Repeated protection/certificate rework during test-machine changes could slow Pilot | Medium | Controlled | Keep final protection deferred until Setup/hardware stable |
| R-09 | Old documentation can misstate current installer/security status | Medium | Being corrected | Use PROJECT_STATE + IMPLEMENTATION_PLAN + complete audit as authority |
| R-10 | Existing README contained encoding corruption/stale statements | Medium | Corrected by audit PR | Replace README with clean current authority links/status |
| R-11 | Production signing/public trust not decided | Medium for commercial release | Deferred | Decide after Pilot and final Production Installer qualification |
| R-12 | Backup/restore/DR not yet proven in production conditions | High for production | Open later gate | Execute controlled restore/rollback/DR drills before production |
| R-13 | Windows behavior may differ between customer machines | High | Open | Multi-machine installer qualification; capture OS/build/hardware evidence |
| R-14 | Real provider secrets could leak into logs/audit during new COM work | High | Preventive | Redaction/encryption tests and no-secret diagnostics required in COM-01/02/05 |
| R-15 | Pilot changes could regress existing Email/Telegram path | High | Preventive | COM-06 full regression plus live acceptance before Pilot closure |

## Risk rule

A risk may be closed only by evidence, not by documentation or intent. Production risks may remain intentionally deferred while the Pilot is controlled, but the deferral must be explicit.

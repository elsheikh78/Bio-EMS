# BIO-EMS Risk Register

**Review date:** 16 September 2026

| ID | Risk | Impact | Current status | Mitigation / next action |
| --- | --- | --- | --- | --- |
| R-01 | Installer lifecycle is not yet fully qualified across multiple physical PCs | High | Reduced / Open | Clean Pilot install and ADMIN login passed; still test reboot/repair/upgrade/rollback/uninstall and a second clean PC |
| R-02 | Managed provider configuration source is implemented but not yet live-accepted | High | Reduced / Open | COM-01 through COM-06 are implemented on PR #235; complete COM-07 live provider acceptance |
| R-03 | WhatsApp Meta onboarding remains externally blocked | Medium | Open | Use Telegram interim path; continue Meta work in parallel |
| R-04 | SMS/GSM live delivery not yet proven | High | Open | Select/freeze transport and perform bench + Pilot failover tests |
| R-05 | Hardware controller/Sensor path not yet fully field-qualified | High | Open | Freeze BOM, bench test, calibration, power/network/endurance evidence |
| R-06 | BIO EGYPT not commissioned/accepted | High | Open | Execute field installation, commissioning and UAT after installer/hardware readiness |
| R-07 | Final Device PKI/mTLS/host-transfer architecture is approved but not implemented | High for production, Low for early Pilot | Deferred | Execute DEV-TRUST-01 through DEV-TRUST-11 after Pilot stabilization |
| R-08 | Repeated protection/certificate rework during test-machine changes could slow Pilot | Medium | Controlled | Keep final protection deferred until Setup/hardware stable |
| R-09 | Old historical documents can be mistaken for current installer/security status | Medium | Controlled | Current authority refreshed 16 Sep; use PROJECT_STATE + IMPLEMENTATION_PLAN + 16 Sep audit addendum |
| R-10 | Existing README contained encoding corruption/stale statements | Medium | Corrected by audit PR | Replace README with clean current authority links/status |
| R-11 | Production signing/public trust not decided | Medium for commercial release | Deferred | Decide after Pilot and final Production Installer qualification |
| R-12 | Backup/restore/DR not yet proven in production conditions | High for production | Open later gate | Execute controlled restore/rollback/DR drills before production |
| R-13 | Windows behavior may differ between customer machines | High | Open | Multi-machine installer qualification; capture OS/build/hardware evidence |
| R-14 | Real provider secrets could leak during live COM-07 acceptance | High | Preventive | Source redaction/encryption controls exist; never place live secrets in Git, screenshots, logs or audit evidence |
| R-15 | Pilot changes could regress existing Email/Telegram path | High | Reduced / Open | COM-06 automated regression passed on PR #235; retain live COM-07 acceptance before Pilot closure |

## Risk rule

A risk may be closed only by evidence, not by documentation or intent. Production risks may remain intentionally deferred while the Pilot is controlled, but the deferral must be explicit.

| R-16 | SEC-OWNER Production acceptance is blocked until the real manufacturer Ed25519 key ceremony and offline commissioning are executed | High for production | Open gate | Follow the Arabic manufacturer key guide; keep the private key offline and outside GitHub/CI/customer PCs; record Production evidence before merge/acceptance |

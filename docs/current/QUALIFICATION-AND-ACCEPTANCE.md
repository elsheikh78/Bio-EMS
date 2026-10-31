# Qualification and Acceptance Gates

Updated 31 October 2026 after PR #316. Evidence belongs to a specific source/binary/configuration/assembly, instrument, operator, date and approved procedure. [Project state](../../PROJECT_STATE.md) is the status authority.

| Gate | Required evidence | What does not close it |
| --- | --- | --- |
| Source quality | Relevant type/lint/format/tests/builds on exact tree | Earlier release counts |
| Security | Advisory reachability/remediation, auth/authorization/session tests and reviewed residual risk | Functional tests alone |
| Binary/package | Governed build, manifests, hashes, signatures, tool/input versions | A source version string |
| Windows lifecycle | Exact-package install/reboot/repair/upgrade/restore/rollback/uninstall and retained-data checks | Linux TypeScript build |
| Providers | Authorized real delivery and failure/recovery evidence per provider | Mock submission or HTTP success only |
| Isolated sensors | Board/probe identity, wiring, reference/limits, acquired QC and fault/recovery | Demo data or successful flash |
| Integrated acquisition | Operating firmware, real selected address/channels, errors/dropouts/recovery | USB status alone |
| Full hardware | Approved power/BOM, all addresses/probes, SD/RTC/network/modem, backup/endurance | One-SIM run/checklist completion alone |
| Calibration | Traceable reference, uncertainty, approved tolerance/decision rule, retained comparison | Hand warming a probe |
| Field commissioning/UAT | Site mapping, placement, calibration, roles, alarms, operating training, signed acceptance | Merged PR or generic QC PDF |
| Commercial protection | Approved PKI/device/software signing and host lifecycle evidence | Pilot pairing/development certificate |

New hardware qualification is recorded only in Tester, with controlled run IDs, earlier fault/retest attempts, exported raw records and reviewer signature fields. System Owner installation/provisioning and historical archive remain separate. Preserve old platform records as originally assessed; do not retroactively relabel them against Tester 0.6 criteria.

The staged plan in `tools/hardware-tester/qualification.py` sets ordered requirements and numeric gates; read the [hardware guide](HARDWARE-AND-FIRMWARE.md) and controlled wiring/procurement documents. Required power tolerances come from approved actual component/design limits. Any unresolved BOM/sensor-map conflict remains a gate, even if firmware supports a bench alternative.

BIO EGYPT commissioning and acceptance remain open. Prior Email/Telegram and company Android observations remain historical evidence; untested WhatsApp/SMS/iOS/background delivery and physical hardware paths require their own results. The code audit does not assign fabricated PASS values, reference measurements, operator signatures or acceptance dates.

When a test fails, keep its original record and raw context, document the cause/change, perform a separately linked retest, and assess regression scope. Never overwrite a failed run with the later result. Missing mandatory evidence is INCOMPLETE/NOT TESTED rather than inferred PASS.

## Main pilot.10 follow-up gate register

The current open checklist is **HW-01–HW-12, DEP-01 and SITE-01** in [project state](../../PROJECT_STATE.md). Read it before release, field testing or acceptance and remind the owner of relevant open IDs. Tester 0.7.0 uses HQT-3 with 21 ordered checks for new runs. Preserve earlier frozen run plans; do not retroactively convert an HQT-2 result into evidence for BLE, owner policy rollback or new power/card alarms.

All seven PR #316 workflows passed, including Windows fresh install/Repair/update/restore/recovery/New Install and artifact upload. These close the recorded exact-package CI gates, not the physical owner PC/USB radio, backup circuit, 30-minute full load, storage fault/replay, actual notifications, populated endurance or signed site UAT. Record source/binary/run and test evidence against each open ID. An owner-reported completion remains evidence-review pending until inspected. Autonomous Main GSM alarm fallback is an implementation hold, not a test awaiting an invented PASS.

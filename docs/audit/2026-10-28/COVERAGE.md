# Audit Coverage and Limitations

Inventory is repository-wide; manual review is targeted by risk. “Reviewed” is not a claim of line-by-line verification of every tracked file.

| Area | Work performed | Remaining limitation |
| --- | --- | --- |
| Backend auth/owner/recovery | Manual token/middleware/routes/services review; two in-memory probes; full test/type/lint/format/build | No external pen test, deployed proxy or credential rotation exercise |
| Local domain/telemetry/reporting | App/router/data-flow inspection, schema/binding/replay/source navigation, full backend tests | No live broker/Influx/provider/tenant adversarial certification; formal every-requirement traceability open |
| SQLite/backup/restore | Source/migration/coordinator inventory and existing contract suites | No actual Windows/Influx coordinated restore drill |
| Frontend | Role/workspace/hardware-lab boundary review, full tests/type/lint/format/build | No fresh full browser UAT/accessibility or pixel review |
| Cloud/company/Viewer | Auth/cookie/origin/session/scoping/snapshot/mobile boundary review;27 tests/build/dry-run | No live deployment/D1 migration/cookie replay or real push receipt |
| Customer native app | Fixed-origin API/token/redirect handling review,3 tests/typecheck/export | No fresh native compile/signing/device/background push acceptance |
| Company native shell | Restricted-navigation/error-policy review,3 tests/typecheck/export | WebView/OS/file handling and per-action device acceptance open |
| Tester | Profile/evidence/numeric gate/firmware boundary review;73 tests/report smoke | No attached board; no independent full 16-channel evidence or calibrated measurements |
| Main/Nano firmware | Shared bus, pin/baud/address/transport/queue/RTC/GSM boundary inspection; two C host suites | No fresh IDF/AVR native build or hardware flash, SD power-fail/long-cable/UPS tests |
| Installer/workflows | Build/sign/update/restore contracts and workflow definitions inventoried/read by risk | Linux checks do not reproduce native Windows lifecycle/trust/ACL gates |
| Dependencies | Five lockfile npm audits, both all/omit-dev scopes | Registry snapshot, conditional exploitability; no Python/native vendor advisory scan |
| Documentation | 309 original text docs accounted for, immutable SHA-256 history, per-document role, source-backed guides, local-file reference migration/check | Retained specs not formally proven requirement by requirement; external URL/anchor availability not certified |

The 1207-file source inventory records original paths/size/hash across all components. Build outputs, installed dependencies, test runtime databases/logs and exports are not added as source. Historical docs/assets keep original scope; electrical values or field results are not invented to fill gaps.

The audit is a point-in-time engineering assessment. Changes to source, dependency registry, runtime configuration, operating systems, provider requirements or hardware can change conclusions. Close findings with new evidence on exact commits/packages; do not edit original evidence to erase earlier failures.

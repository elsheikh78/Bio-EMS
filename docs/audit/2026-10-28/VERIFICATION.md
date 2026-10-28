# Executed Verification

Date 28 October 2026, candidate tree `d151b1f`. Host Linux, Node 24.22.1/npm 11.9.0. Backend/frontend CI normally uses Node 22; cloud uses 24. Native dependency rebuild for the local Node ABI succeeded. No source dependency version/lockfile was changed.

| Area | Tests | Executed successful gates |
| --- | ---: | --- |
| Backend | 1091 /162 files | typecheck, lint, format:check, test:run, build |
| Frontend | 354 /64 files | typecheck, lint, format:check, test:run, build |
| Company cloud | 27 | npm test, build, Wrangler deploy --dry-run |
| Customer mobile | 3 | typecheck, npm test, Expo all-platform export |
| Company mobile | 3 | typecheck, npm test, Expo all-platform export |
| Standalone Tester | 73 | unittest discovery, demo report smoke |
| Total routine tests |**1551** | All above functional gates passed |
| Isolated security probes | 2 additional | Reproduced existing gaps, not desired protection |
| Main C host suites | 2 executables | queue FIFO/capacity/reboot/retry/corruption; RTC calendar/GSM protocol |

Commands/exit status/durations are preserved per component under [evidence](evidence/README.md). npm audit returned exit1 for findings; it is deliberately **not** counted as a successful security gate. Production-only counts are preserved separately. Tester smoke uses DEMO data and explicitly does not create hardware acceptance.

## Host C commands

From repository root:

```sh
cc -std=c11 -D_POSIX_C_SOURCE=200809L -Wall -Wextra -Werror -I firmware/site-controller-esp32s3/main firmware/site-controller-esp32s3/main/offline_queue.c firmware/site-controller-esp32s3/tests/offline_queue_test.c -o /tmp/bioems-audit-queue
/tmp/bioems-audit-queue
cc -std=c11 -D_POSIX_C_SOURCE=200809L -Wall -Wextra -Werror -I firmware/site-controller-esp32s3/main firmware/site-controller-esp32s3/main/rtc_codec.c firmware/site-controller-esp32s3/main/gsm_protocol.c firmware/site-controller-esp32s3/tests/peripheral_protocol_test.c -o /tmp/bioems-audit-peripheral
/tmp/bioems-audit-peripheral
```

## Security probe reproduction

The [probe source](evidence/security-probe.spec.ts.txt) uses an in-memory SQLite database, mocked MQTT/Influx and synthetic users. Copy it to `backend/src/audit.probe.spec.ts`, run `npx vitest run src/audit.probe.spec.ts` from backend, then remove the temporary test. Both assertions record vulnerable current behavior. After remediation replace these observations with desired rejection/rate-limit regressions; a future probe failure may mean the defect was fixed. No real credentials, live accounts or external brute-force requests were used.

## Not executed / not established

No fresh MCU native compile/flash, physical tester run, real MQTT/Influx end-to-end deployment, live Cloudflare migration/deploy, Windows Setup lifecycle/restore, native Android/iOS compilation/signing/device test, live notification receipt, prolonged endurance, power fault injection, external penetration testing or calibrated measurements. Existing workflow definitions and historical artifacts were reviewed but are not fresh results in this matrix. No Python vulnerability scanner, whole-git-history secret scanner or quantitative code-coverage run was performed. No clean security bill is inferred from these omissions.

The documentation integrity/link checker and its positive/negative fixture checks are run on this refresh. Git diff checks enforce no unexpected application source/dependency changes. Exact checker results are recorded in the documentation migration report.

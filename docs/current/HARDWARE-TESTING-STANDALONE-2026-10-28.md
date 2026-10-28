# Hardware qualification moved to the standalone tester

> Documentation review: 2026-10-28. Retained specification/policy; requirements are not proof of implementation. [Current implementation guide](<../README.md>) describes the reviewed source baseline; [Project state](<../../PROJECT_STATE.md>) controls current status. [Original pre-audit document](<../archive/2026-10-28-pre-audit/docs/current/HARDWARE-TESTING-STANDALONE-2026-10-28.md>) preserves the unmodified earlier text. Claims below retain their original evidence date and do not establish current deployment or acceptance.


Hardware Tester 0.6.1 is the operator surface for bench testing and hardware
qualification. The System Owner console no longer contains Hardware Lab or its
route. Installation configuration, device provisioning, Flash and Bind and
operational sensor discovery remain installation operations.

The platform rejects all former Hardware Lab write operations with HTTP 410 and
code `HARDWARE_LAB_MOVED_TO_STANDALONE_TESTER`. Existing SQLite tables and records
are preserved. Authenticated GET `/platform-operations/hardware-lab/runs` and GET
`/platform-operations/hardware-lab/runs/:runId` remain archive reads. The old
profile is retired. No destructive database migration or automatic record import
is performed. Historical records retain their original acceptance conditions;
they are not reclassified as standalone hardware acceptance.

## Standalone workflow

1. Use tabs 5 and 6 for isolated QC or operating firmware, respectively.
2. Use sensor and integrated acquisition scopes to collect raw sensor evidence.
3. Open tab 7 Qualification guide. Select each of the 18 steps to read the procedure.
4. Select staged qualification scope, enter assembly/operator and procedure, then
   Start hardware run. This is a manual evidence run; it does not open COM for
   continuous acquisition. Keep raw acquisition attempts as separate linked runs.
5. Record the staged checks in order in Inspection / evidence. Power PASS requires
   numeric voltage, approved limits and meter identity. Optional fault codes are
   observations, not automatic diagnoses. Missing steps block PASS. An earlier step
   must have a latest PASS before a later step can be marked PASS.
6. Finalize, analyze and export PDF/JSON/CSV. The frozen procedure, evidence and
   reviewer fields are retained. Review linked raw runs before signing.

The reviewed procedure replaces obsolete HQT-1 assumptions: the operational
RS485 link is 9600 8N1 and uses one shared Main bus with addresses 1-4, not four
independent Main ports. Automated acquisition observes one selected SIM at a
time. Full 16-probe/48-hour qualification needs independent full-population logs;
the checklist does not create such telemetry. GSM testing is explicit SMS with
actual receipt evidence; automatic alarm fallback is not implemented. Unsafe
powered fault wiring is not prescribed.

The 18 steps cover bench identification, power, single sensor, cable lengths,
sensor faults, Nano channel isolation, short/long RS485, network, explicit GSM,
integrated recovery, 24-hour endurance, bus addresses, 16-probe/48-hour operation,
reference accuracy, SD replay, RTC retention and central backup endurance.


Qualification metrics retain the former numeric gates: `sensor_cables` needs
`success_rate_percent >= 99.99`; `endurance_24h` and `full_population` need
`unexplained_reboots = 0` and `unrecovered_faults = 0`. Enter these in Metrics JSON.
Missing/invalid metrics cannot be saved as PASS; out-of-limit values are recorded
as FAIL. These are operator-entered measurements, not automatically read counters.

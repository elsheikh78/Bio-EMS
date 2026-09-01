# P3-01 — Commissioning Evidence Foundation

**Date:** 1 September 2026  
**Phase:** P3 — Pilot Commissioning Tooling  
**Status:** STARTED / CONTROLLED SOFTWARE-AND-EVIDENCE FOUNDATION

## Objective

Turn the existing BIO EGYPT controlled Pilot documentation into a repeatable commissioning workflow without claiming physical execution before evidence exists.

P3-01 establishes the evidence model and gate sequence that later executable/API/UI slices must preserve.

## Existing controlled inputs

P3 builds on, rather than replaces:

- `docs/pilot/bio-egypt/BIO-EGYPT-PILOT-SCOPE.md`
- `docs/pilot/bio-egypt/BIO-EGYPT-SENSOR-MAP.md`
- `docs/pilot/bio-egypt/BIO-EGYPT-COMMISSIONING.md`
- `docs/pilot/bio-egypt/BIO-EGYPT-CUSTOMER-EVIDENCE-REGISTER-2026-08-31.md`
- `docs/pilot/bio-egypt/BIO-EGYPT-SOFTWARE-UAT-GUIDE.md`
- `docs/pilot/bio-egypt/BIO-EGYPT-OPEN-ITEMS.md`
- P2 Site Controller runtime and qualification evidence contracts.

## Controlled commissioning sequence

1. **Commissioning session identity** — Site, controller/device, platform version, commissioning revision, engineer and witness identity.
2. **Configuration readiness** — Site/Room/Sensor/Device identities and approved thresholds are reconciled before execution.
3. **Sensor mapping evidence** — Map ID, physical label, DS18B20 identity/serial, Device channel and platform Sensor identity remain traceable.
4. **Calibration verification** — current calibration evidence is linked to each commissioned Sensor; missing/expired evidence blocks acceptance.
5. **Communication verification** — trusted telemetry and heartbeat reach the correct Site and mismatched/disabled paths fail closed.
6. **Alarm verification** — warning, critical, recovery and acknowledgment behavior are witnessed and evidence-linked.
7. **Notification verification** — primary delivery and approved emergency failover are recorded separately; live provider evidence is never inferred from software tests.
8. **Recovery verification** — restart, reconnect, configuration recovery and LIVE/REPLAY behavior are evidence-linked without duplicate identity/event claims.
9. **Deviation/open-item control** — blocking and non-blocking deviations remain explicit and attributable.
10. **Acceptance decision** — acceptance is possible only when all mandatory gates have evidence and no blocking deviation remains.

## Evidence-state vocabulary

Each commissioning check must use one of these states:

- `NOT_RUN` — no execution evidence exists.
- `PASS` — required execution evidence exists and meets the criterion.
- `FAIL` — execution occurred and did not meet the criterion.
- `BLOCKED` — prerequisite prevents execution or acceptance.
- `DEFERRED_NON_BLOCKING` — formally accepted deferral that does not invalidate the controlled acceptance decision.

Automated CI/software tests may support a check but must not silently convert a physical or live-provider `NOT_RUN` state to `PASS`.

## Minimum evidence identity

Every evidence item must be attributable to:

- commissioning session ID;
- Site UUID/identity;
- test/check identifier;
- execution timestamp;
- actor/engineer identity;
- evidence reference;
- result state;
- optional witness;
- controlled note/deviation reference.

Where a check is Sensor-specific, it must additionally carry the platform Sensor identity and controlled Map ID. Where Device/controller-specific, it must carry the Device/controller identity.

## P3 proposed implementation slices

- **P3-01 — Commissioning Evidence Foundation:** controlled workflow, state vocabulary, identifiers and acceptance semantics.
- **P3-02 — Commissioning Session Domain/Persistence:** durable session/check/evidence/deviation records with append-only execution evidence.
- **P3-03 — Commissioning API:** Site-scoped protected create/read/execute/evidence/deviation/decision operations.
- **P3-04 — Configuration & Sensor Mapping Verification:** reconcile Site/Room/Device/Sensor/map/calibration prerequisites.
- **P3-05 — Functional Test Orchestration:** communication, Alarm, acknowledgment, notification and recovery check execution/evidence hooks.
- **P3-06 — Commissioning UI:** controlled operator workflow, progress, blockers, evidence references and decision readiness.
- **P3-07 — Commissioning Record Export:** controlled PDF/CSV evidence package and immutable decision snapshot.
- **P3-08 — BIO EGYPT Pilot Dry Run/UAT Package:** software dry-run evidence only until physical/live gates are executed.
- **P3-09 — P3 Closure Audit:** distinguish software-complete tooling from physical commissioning/customer acceptance.

## Acceptance invariants

- A commissioning session cannot become `ACCEPTED` while any mandatory check is `NOT_RUN`, `FAIL` or `BLOCKED`.
- `DEFERRED_NON_BLOCKING` requires an explicit deviation reference and cannot be used for a mandatory blocking gate.
- Historical evidence is not overwritten; corrections create attributable new evidence/decision records.
- Customer acceptance is not inferred from BIO-EMS engineer completion.
- Physical controller qualification, live SIM800L/provider evidence, deployed MQTT/endurance and customer sign-off remain external until actually executed.

## P3-02 entry gate

P3-02 may begin once this evidence model is merged. It must inspect existing audit, calibration, Device-health, Alarm, notification-delivery and P2 evidence persistence before introducing new tables so that commissioning references authoritative domain evidence rather than duplicating it.

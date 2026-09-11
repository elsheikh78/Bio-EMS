# BIO-EMS Controlled Handoff — 11 September 2026

## Authority

Use this handoff together with:

1. `PROJECT_STATE.md`
2. `IMPLEMENTATION_PLAN.md`
3. `docs/project-management/COMPLETE-AUDIT-MASTER-EXECUTION-PLAN-2026-09-11.md`
4. `docs/project-management/COMMUNICATION-CHANNEL-ADMIN-CONFIG-WORK-PACKAGE-2026-09-11.md`

Older handoffs are historical evidence only.

## Audited baseline

- Audit started from `main@af9a69963d091eda6a16bee17f69a94d912136d6`.
- Source version remains `0.20.0`.
- Latest published release remains `v0.20.0`.
- Full CI baseline: Backend 114 files / 809 tests; Frontend 52 files / 299 tests; quality gates passed.

## Immediate next implementation

Start **COM-01** from reconciled `main`.

Do not start DEV-TRUST production device PKI/mTLS work before the Pilot Setup/hardware stabilization sequence unless a new explicit product decision changes the order.

## COM sequence

1. COM-01 secure provider configuration storage.
2. COM-02 RBAC/redacted API.
3. COM-03 provider runtime integration.
4. COM-04 Communication Channels UI.
5. COM-05 provider Test actions.
6. COM-06 failover/regression.
7. COM-07 live Pilot acceptance after deployment.

## After COM source merge

- generate a new internal signed Pilot Setup;
- test Fresh Install on a clean Windows target;
- verify three BIO-EMS services and HTTPS/API/frontend;
- reboot;
- Repair;
- Upgrade/rollback;
- retained-data Uninstall;
- repeat on a second clean machine.

## Hardware next

After installer repeatability:

- controller/Sensor bench setup;
- mapping;
- MQTT;
- reconnect/buffering;
- power cycle;
- Alarm challenge;
- Email/Telegram;
- SMS/GSM fallback;
- calibration/endurance evidence.

## Field next

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.

Field gate requires installation, calibration, Alarm/notification tests, technical Commissioning and customer ADMIN UAT/acceptance.

## Deferred production security

Retain approved Device Trust and host-replacement architecture, but implement final DEV-TRUST-01 through DEV-TRUST-11 after Pilot stabilization.

## Working rule

Never convert:
- documentation into implementation evidence;
- source CI into field evidence;
- internal Pilot signing into commercial signing;
- Pilot acceptance into Production readiness.

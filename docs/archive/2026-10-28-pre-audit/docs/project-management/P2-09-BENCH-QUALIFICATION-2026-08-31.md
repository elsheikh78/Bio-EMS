# P2-09 Bench Qualification — 2026-08-31

Status: QUALIFICATION PACKAGE IMPLEMENTED — physical bench execution pending.

## Purpose

P2-09 converts the P2-01 through P2-08 controller runtime work into an explicit qualification gate. It prevents repository/CI evidence from being mistaken for physical controller acceptance.

## Mandatory scenarios

1. Clean boot.
2. Power loss / restart.
3. Network loss.
4. Network recovery.
5. Stale configuration.
6. Corrupted configuration.
7. Sensor disconnect.
8. Threshold excursion.
9. Persistence delay.
10. Alarm recovery.
11. SMS failover trigger.
12. Reconnect reconciliation.

## Gate semantics

Each scenario must carry one status and an evidence reference:

- `AUTOMATED_PASS` — deterministic host-side test evidence exists.
- `PHYSICAL_PASS` — controlled bench evidence exists.
- `EXTERNAL_NOT_RUN` — hardware/provider/customer execution has not happened.
- `BLOCKED` — a known implementation gap prevents qualification.
- `FAIL` — executed evidence failed acceptance criteria.

The controller is `QUALIFIED` only when every mandatory scenario is PASS and none are blocked, failed, missing, or external-not-run.

## Current repository evidence

The repository currently provides deterministic software evidence across runtime boot/watchdog, configuration validation, DS18B20 acquisition semantics, offline alarm evaluation, local emergency SMS policy execution, reconnect reconciliation, and controller health evidence.

This software evidence is necessary but is not physical qualification.

## Qualification blocker discovered during P2-09 review

P2-03 currently persists only the acknowledged configuration identity (`site_uuid`, `config_version`, `checksum_sha256`). It does not persist the complete verified BF-08 configuration bundle containing sensor mappings, thresholds, delays, SMS targets, and escalation steps.

Therefore, a real controller restart/power-loss test cannot yet prove restart-safe offline acquisition/alarm/SMS behavior from durable configuration alone. `POWER_LOSS_RESTART` must remain `BLOCKED` until full verified known-good bundle persistence and recovery are implemented and tested.

## Additional hardening item

P2-07 replay suppression is process-memory based. Accepted replay IDs are not durable across controller power loss. Same-process accepted replay suppression is implemented, but restart-durable replay acknowledgement remains an operational hardening requirement before production qualification.

## Physical evidence still required

- actual controller boot and watchdog observation;
- controlled mains/power interruption and restart;
- real network disconnect/recovery;
- physical DS18B20 disconnect/reconnect;
- controlled temperature threshold excursion and recovery;
- persistence timing under real storage conditions;
- SIM800L emergency SMS trigger/delivery evidence;
- MQTT reconnect and LIVE/REPLAY evidence;
- endurance evidence required by the approved hardware validation gate.

## Non-claims

This package does not claim that the BIO EGYPT pilot is commissioned, that physical hardware passed bench qualification, that a real SMS was delivered, or that customer acceptance exists.

## Required next action

Implement full verified BF-08 bundle durability/recovery, close the replay durability gap or explicitly disposition it, then execute the physical bench matrix and attach evidence before P2 can be considered physically qualified.

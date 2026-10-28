# P2-03 — Durable Local Configuration

## Status

Implemented at software / repository level. Hardware power-loss qualification remains part of P2-09 bench evidence.

## Objective

Preserve the last acknowledged Site Controller configuration across process restart or power loss without allowing malformed, corrupted, wrong-controller, wrong-Site, stale, or otherwise rejected candidates to replace the known-good state.

## Implemented Controls

- File-backed durable configuration store with an explicit record version.
- Controller and Site binding on recovery.
- SHA-256 integrity check over the persisted payload.
- Strict schema validation before recovered state becomes effective.
- Atomic replacement through temporary-file write followed by rename.
- Restrictive file mode request (`0600`) when the local record is created.
- Runtime recovery from durable state before readiness is derived.
- Persistence occurs only after P2-02 returns an `APPLIED` acknowledgement.
- Rejected configuration candidates do not modify durable state.
- Corrupted durable state fails closed to `NOT_READY_NO_CONFIG` rather than becoming effective.

## Automated Evidence

Host-side tests cover:

1. apply → persist → fresh boot → recover;
2. corrupted persisted integrity → reject recovery;
3. rejected stale candidate → known-good file remains unchanged;
4. wrong controller / wrong Site → reject recovery.

## Boundary

P2-03 persists the acknowledged effective configuration identity used by the current runtime (`site_uuid`, `config_version`, `checksum_sha256`). Sensor acquisition and the local executable alarm configuration are introduced in later P2 slices and must continue to use the same verified/acknowledged persistence rule.

## Non-Claims

This slice does not claim ESP32 flash/NVS qualification, physical power-interruption testing, filesystem wear qualification, sensor acquisition, offline alarm evaluation, or field commissioning. Those remain subsequent P2 and pilot evidence gates.

# P2-02 — Configuration Receipt and Integrity

Status: IMPLEMENTED / PR VALIDATION PENDING
Date: 2026-08-31

## Purpose

P2-02 connects the P2-01 Site Controller runtime foundation to the existing BF-08 server-owned offline-critical configuration envelope. It adds deterministic receipt, checksum verification, Site/version conflict handling, and explicit APPLIED/REJECTED acknowledgement generation without introducing durable local storage yet.

## Runtime behavior

`backend/src/modules/controller-runtime/config-receipt.service.ts` validates each candidate through the authoritative BF-08 `verifyConfigDeliveryEnvelope` contract before it can become effective.

A candidate is rejected when:

- the envelope is malformed or its SHA-256 checksum is invalid;
- its Site UUID does not match the controller Site boundary;
- its configuration version is lower than the effective version;
- it reuses the current version with a different checksum.

An exact same-version/same-checksum delivery is APPLIED idempotently. A valid higher version is APPLIED and becomes the in-memory effective configuration identity.

## Known-good preservation

Rejected candidates never replace the current effective configuration identity. This preserves BF-08 safe-fallback semantics and prepares P2-03 to make the same invariant durable across restart and power loss.

## Acknowledgement semantics

Every receipt produces a BF-08 compatible acknowledgement with controller ID, Site UUID, configuration version, checksum, timestamp, and APPLIED or REJECTED status. Rejections use controlled codes:

- `INVALID_ENVELOPE`
- `SITE_MISMATCH`
- `STALE_CONFIG_VERSION`
- `VERSION_CHECKSUM_CONFLICT`

## Automated acceptance coverage

Tests cover:

1. verified higher-version APPLIED receipt;
2. idempotent exact duplicate application;
3. tampered checksum rejection;
4. cross-Site rejection;
5. stale lower-version rejection;
6. same-version checksum conflict rejection;
7. preservation of the previous effective configuration across all rejection cases.

## Boundaries / non-claims

P2-02 does not persist the accepted configuration to local nonvolatile storage and does not claim power-loss recovery. It also does not implement DS18B20 acquisition, offline Alarm evaluation, SMS failover, reconnect transport, ESP32 firmware, or field qualification. Those remain P2-03 through P2-09.

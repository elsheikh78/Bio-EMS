# P2-07 — Reconnect Reconciliation

Status: IMPLEMENTED — CI/merge pending.

## Objective

Restore server authority after a controller reconnects without losing offline evidence or replaying accepted data indefinitely.

## Implemented

- Reconnect compares the controller's effective configuration identity with the verified BF-08 server envelope.
- Matching configuration returns `CURRENT / NONE`.
- Stale controller configuration returns `STALE_VERSION / DELIVER_EFFECTIVE_CONFIG`.
- No acknowledged controller configuration returns `NEVER_ACKNOWLEDGED / DELIVER_EFFECTIVE_CONFIG`.
- Same-version checksum conflicts produce an explicit REJECTED acknowledgement and trigger effective-config redelivery.
- Buffered offline sensor evidence is emitted chronologically with `mode: REPLAY`.
- Every replay record receives a deterministic SHA-256 replay identity.
- Replay remains retryable until server acceptance is recorded; accepted replay IDs are then suppressed from subsequent reconnect batches.

## Boundaries

This slice is a deterministic host-side reconciliation/runtime contract. It does not claim persistent replay-ledger storage across controller power loss, actual MQTT transport publication/acknowledgement, firmware flash behavior, deployed broker evidence, or field acceptance. P2-08/P2-09 and commissioning evidence remain separate gates.

## Next

P2-08 — Controller Health Evidence.

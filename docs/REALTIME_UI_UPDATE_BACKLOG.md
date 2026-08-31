# Realtime Telemetry UI Update Backlog

**Recorded:** 26 August 2026  
**Target start:** Monday, 31 August 2026  
**Status:** IMPLEMENTED / AUTOMATED VERIFICATION COMPLETE / LIVE MQTT RETEST PENDING

## Implementation closure — 31 August 2026

The software path is implemented. Accepted telemetry now publishes an authenticated
`telemetry.accepted` SSE event only after Alarm evaluation and InfluxDB persistence complete.
The authenticated application shell consumes the stream, invalidates the Dashboard and Monitored
Areas query namespaces, reconnects after interruption, and aborts the stream on unmount or logout.
Existing interval-based queries remain the low-frequency resilience fallback.

Automated verification covers event publication, unsubscribe cleanup, controlled SSE parsing,
frontend regression, typechecking, linting, and production builds. The remaining evidence is the
physical 10-minute MQTT scenario against the deployed local stack; it is not represented as
executed by unit/integration tests.

## Context

A live MQTT temperature simulation was successfully exercised against BIO-EMS. Telemetry was received and processed, but the Dashboard and Monitored Areas UI did not update automatically for each incoming sensor reading. The displayed state required a manual/user-driven refresh to reflect newer telemetry.

## Requirement

BIO-EMS monitoring screens must behave as live monitoring surfaces. When a new sensor reading is accepted by the backend, the relevant UI state should update automatically without a full browser/page refresh.

Required surfaces:

- Dashboard
- Monitored Areas

Required behavior:

- Update the displayed sensor value after each accepted live telemetry reading.
- Update sensor/room status and visual state when alarm state changes.
- Update Dashboard KPIs and Priority Areas when the new reading changes their underlying state.
- Update Monitored Areas without F5/manual refresh.
- Avoid full-page reloads, flicker, navigation reset, or loss of user context.
- Preserve the existing telemetry, alarm-engine, authorization, and reporting behavior.

## Preferred Architecture

Use an event-driven server-to-browser update path rather than high-frequency HTTP polling.

Proposed flow:

`MQTT reading -> backend telemetry processing -> persistence/alarm evaluation -> realtime UI event -> frontend data/state update -> Dashboard + Monitored Areas`

SSE (Server-Sent Events) should be evaluated first because the principal requirement is one-way server-to-browser delivery. WebSocket may be selected instead if repository review identifies a bidirectional/realtime requirement that justifies it.

A low-frequency fallback polling mechanism may be retained for resilience if the realtime connection is unavailable. It must not be the primary live-update mechanism.

## Implementation Work Package

Before coding, audit the current `main` branch implementation for:

1. MQTT telemetry ingestion and the point at which a reading becomes accepted/authoritative.
2. Alarm-engine evaluation and state transition timing.
3. Dashboard API/query/state lifecycle.
4. Monitored Areas API/query/state lifecycle.
5. Existing frontend cache/query invalidation mechanisms.
6. Authentication/authorization requirements for a realtime endpoint.

Then implement:

1. A backend realtime event contract for accepted telemetry/state changes.
2. An authenticated realtime endpoint/channel.
3. Frontend subscription lifecycle with reconnect/error handling.
4. Targeted cache/state updates or query invalidation for Dashboard and Monitored Areas.
5. Fallback behavior when realtime transport is unavailable.
6. Automated backend/frontend tests covering normal readings, alarm transitions, recovery, reconnect, and cleanup/unmount behavior.

## Acceptance Criteria

Using the 10-minute MQTT temperature scenario (approximately 5 C -> 10 C -> 5 C):

- Every accepted reading becomes visible without manual refresh.
- Crossing the configured high alarm threshold is reflected automatically.
- Alarm recovery is reflected automatically.
- Dashboard and Monitored Areas remain synchronized with the backend.
- No full-page reload is used.
- No duplicate subscriptions or runaway polling occurs.
- Realtime connection cleanup occurs when the relevant UI is unmounted/logged out.
- Existing CI, tests, lint, typecheck, formatting, telemetry ingestion, alarms, and reporting remain green.

## Scheduling / Scope Boundary

Software implementation is intentionally deferred until **Monday, 31 August 2026**.

From **Wednesday, 26 August 2026 through end of Sunday, 30 August 2026**, project discussion is focused on BIO-EMS hardware in order to finalize the component selection and purchasing/BOM decisions. Software changes for this realtime UI item should not be started during that hardware discussion window unless the scope is explicitly changed.

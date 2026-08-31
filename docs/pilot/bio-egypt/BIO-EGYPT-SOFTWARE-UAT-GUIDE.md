# BIO EGYPT Software UAT Guide

**Status:** Ready for customer execution; not yet accepted

Execute this guide only against the identified release commit in the commissioned environment.
Record tester, role, timestamp, Site, browser, result, and evidence reference for every case.

## Acceptance cases

1. Sign in with VIEWER, OPERATOR, and ADMIN test Users and verify role-appropriate navigation.
2. Publish commissioned Sensor telemetry and verify Dashboard and Monitored Areas refresh without a
   manual reload; retain timestamps and MQTT/backend evidence.
3. Trigger, acknowledge, and recover Warning/Critical Alarms and verify actor/time lifecycle history.
4. Verify Device communication state and confirm telemetry/heartbeat events appear in Device Health.
5. Preview and export CSV/PDF for all five controlled report families using the same Sensor/date
   scope; reconcile record counts and inspect file readability.
6. As ADMIN, verify Sensor thresholds/delays, notification recipients, escalation policies, Users,
   and Site-scoped Audit evidence. Confirm unauthorized roles cannot mutate configuration.
7. Stop/restart the service using the production runbook and verify persistent configuration,
   authentication, and historical evidence remain available.

## Exit rule

UAT passes only when every required case is PASS, evidence references are attached, no open Critical
or High defect remains, and the customer and delivery owner sign the identified release commit.
Repository tests or an unsigned walkthrough are not customer acceptance.

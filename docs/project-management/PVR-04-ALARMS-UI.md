# PVR-04 — Alarms UI

Status: IMPLEMENTED / VERIFICATION PENDING
Date: 2026-08-24
Branch: `agent/pvr-04-alarms-ui`

PVR-04 replaces the Alarm placeholder with runtime-validated Active and History views over the
existing protected Alarm API. Eligible ADMIN/OPERATOR users may acknowledge TRIGGERED Alarms
through the dedicated permission and endpoint. VIEWER remains read-only. The UI presents severity,
status, Sensor identity, trigger value, and recorded time with recoverable loading/error states.

This slice does not implement provider delivery, escalation execution, Alarm comments, field
commissioning, or customer acceptance.

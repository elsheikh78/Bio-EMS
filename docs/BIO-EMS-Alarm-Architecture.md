# BIO-EMS Alarm Architecture

Version: 1.0.0

Status: Design Phase

---

# 1. Purpose

This document defines the alarm architecture of the BIO-EMS monitoring platform.

The alarm system is responsible for:

- Detecting abnormal sensor conditions.
- Creating alarm events.
- Tracking alarm lifecycle.
- Preparing notifications.
- Maintaining historical alarm records.

---

# 2. Alarm Design Principles

The alarm system follows these principles:

- Backend owns alarm decisions.
- Firmware only collects and transmits data.
- MQTT only transports messages.
- Alarm rules are stored as configuration.
- Telemetry data remains immutable.
- Alarm events are separate from telemetry records.

---

# 3. Alarm Processing Flow

Complete alarm flow:

---

# 4. Alarm Sources

The alarm engine evaluates sensor values based on:

## High Limit

Example:

Result:

---

## Low Limit

Example:

Result:

---

## Low Limit

Example:

Result:

---

## Device Alarms

Future supported alarms:

- Device offline.
- Battery low.
- Communication failure.
- Sensor failure.

---

# 5. Alarm Rule Ownership

Alarm rules belong to the sensor configuration.

Example:

The alarm engine reads these values when evaluating telemetry.

---

# 6. Alarm Event Model

Alarm event is different from telemetry.

Telemetry:

Alarm Event:

---

# 7. Alarm Lifecycle

Each alarm follows a lifecycle:

---

---

# 8. Alarm States

## NORMAL

No abnormal condition exists.

---

## TRIGGERED

Condition exceeded configured limits.

Example:

---

## ACKNOWLEDGED

User confirmed awareness of the alarm.

---

## RECOVERED

Sensor returned to normal range.

---

# 9. Alarm Storage

Alarm events must be stored separately from telemetry.

Telemetry Database:

Alarm Configuration and Events:

---

# 10. Alarm Data Model

Future alarm table:

---

# 11. Severity Levels

Supported severity levels:

Example:

---

# 12. Notification Layer

Alarm Engine does not send notifications directly.

Notification flow:

---

# 13. Future Extensions

Planned features:

- Escalation rules.
- User acknowledgement.
- Alarm reports.
- Notification scheduling.

BF-05 now implements Sensor-scoped warning/critical activation delay and persisted
pending candidates for LIVE telemetry. A zero delay preserves immediate activation;
candidate state resets on normal, opposite-direction, or severity-changing readings.
Recovery delay, hysteresis, escalation, and notification scheduling remain future work.

---

# Version History

## 1.0.0

Initial alarm architecture definition.

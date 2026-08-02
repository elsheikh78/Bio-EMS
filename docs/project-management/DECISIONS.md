# Engineering Decisions

> This document records engineering decisions that are considered stable and approved.
> Every implementation must follow these decisions unless superseded by a newer decision.

---

## D-001

### Title
Zone is an Engineering Concept

### Description

A Zone represents a logical engineering grouping only.

A Zone is NOT:

- Physical hardware
- MQTT device
- Controller
- Sensor

Zones exist to organize monitoring points.

### Reference

ADR-011

### Status

Approved

---

## D-002

### Title

Zone Controller is a Physical Device

### Description

A Zone Controller is the actual hardware installed on site.

Responsibilities include:

- MQTT communication
- Sensor acquisition
- Alarm reporting
- Firmware execution

A Zone Controller may serve one or more engineering Zones.

### Reference

ADR-012

### Status

Approved

---

## D-003

### Title

Health Endpoint Convention

### Description

Every module owns only its local routes.

API prefixes are mounted inside app.ts.

Example:

/api/v1/health
/api/v1/sites

### Status

Implemented

---

## D-004

### Title

Business First Development

### Description

BIO-EMS development follows this order:

Business Requirements

↓

Architecture

↓

Implementation

↓

Testing

Code must never define business architecture.

### Status

Approved

---

## D-005

### Title

Documentation is the Single Source of Truth

### Description

Engineering decisions shall be derived from:

1. ADR documents
2. Architecture documents
3. Project management documents

Conversation history must never be considered the authoritative source.

### Status

Approved
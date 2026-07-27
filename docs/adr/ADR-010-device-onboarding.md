# ADR-010

## Title

Device Onboarding Workflow

## Status

Accepted

## Date

2026-07-22

## Context

BIO-EMS must provide a secure and user-friendly process for introducing new devices into the system.

## Decision

Device onboarding consists of four phases.

### 1. Discovery

The device announces itself.

The device appears in the Pending Devices list.

Operational telemetry is rejected.

### 2. QR Identification

The installer scans the device QR Code.

The QR Code contains:

- Device ID
- Serial Number
- Activation Code

### 3. Activation

BIO-EMS verifies the Activation Code.

Only devices with a valid Activation Code may continue.

### 4. Approval

An authorized user assigns:

- Site
- Asset

The device becomes Active.

Only Active devices may publish operational telemetry.

## Consequences

- No manual typing of device identifiers.
- Unauthorized devices cannot become active.
- Fast installation.
- Better security.
- Better user experience.
# BIO EGYPT Pilot — Open-Items Register

## Status definitions

- `BLOCKING`: installation or acceptance cannot proceed.
- `NON-BLOCKING`: controlled follow-up allowed with owner and due date.
- `CLOSED`: evidence and approval recorded.

## Initial register

| ID     | Item                                                                                 | Owner                   | Required evidence                                               | Status   |
| ------ | ------------------------------------------------------------------------------------ | ----------------------- | --------------------------------------------------------------- | -------- |
| BE-001 | Confirm legal Site names, addresses, customer contacts, and access rules             | BIO EGYPT               | `BE001-EV-001` — Signed Site Information & Access Approval       | CLOSED   |
| BE-002 | Complete marked-up floor plans and approved Sensor positions                         | Joint survey            | Signed plans for both Sites                                     | BLOCKING |
| BE-003 | Confirm controller location/count and released channel/electrical capacity           | BIO-EMS engineering     | Approved controller layout/design                               | BLOCKING |
| BE-004 | Measure cable routes/lengths and approve cable/termination design                    | Installer/engineering   | Survey and released wiring schedule                             | BLOCKING |
| BE-005 | Assign controller, Device, channel, Sensor serial, and platform identities           | BIO-EMS commissioning   | Completed Sensor map                                            | BLOCKING |
| BE-006 | Approve temperature warning/critical thresholds and delay requirements               | BIO EGYPT quality       | Signed requirements                                             | BLOCKING |
| BE-007 | Verify calibration certificates/status for all 20 Sensors                            | BIO-EMS quality         | Certificate register                                            | BLOCKING |
| BE-008 | Confirm mains, protection, backup power, Internet, DNS/NTP/firewall, and 4G coverage | Joint survey            | Electrical/network survey                                       | BLOCKING |
| BE-009 | Approve primary notification channel, recipients, and escalation ownership           | BIO EGYPT quality/IT    | Notification matrix                                             | BLOCKING |
| BE-010 | Select SMS implementation location/provider/SIM and approved E.164 test recipients   | Joint technical team    | Approved failover test plan                                     | BLOCKING |
| BE-011 | Confirm backup/restore, support, incident, maintenance, and handover procedures      | BIO-EMS operations      | Approved operating pack                                         | BLOCKING |
| BE-012 | Execute field deployment/commissioning using the approved S15-07 baseline            | Joint team              | Signed commissioning record                                     | BLOCKING |

## Closure evidence

### BE-001 — Site information and access

- **Status:** `CLOSED`
- **Evidence reference:** `BE001-EV-001`
- **Evidence:** Signed BIO-EMS / BIO EGYPT `BE-001 — Site Information & Access Approval`
- **Customer approver:** Dr. Mayada Samir — General Manager, Quality, BIO EGYPT
- **Approval date:** 23 August 2026
- **Sites covered:** El Manial and CPC / 6th of October
- **Repository handling:** The signed controlled customer record is retained outside the repository; the repository records its evidence reference only.
- **Pilot effect:** `BE-001` is closed. This closure does not constitute installation, commissioning, or Pilot acceptance.

## Register rule

Each closure entry must contain the evidence reference, approver, and date.

Deleting an item is not closure.

New survey findings receive the next sequential ID and an explicit impact classification.

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.
# BIO EGYPT Pilot — Controlled Scope

## Approved baseline

| Site                 | Cold rooms | Anti-chambers | Dry warehouses | Areas | Sensors |
| -------------------- | ---------: | ------------: | -------------: | ----: | ------: |
| El Manial            |          1 |             1 |              1 |     3 |       7 |
| CPC / 6th of October |          3 |             1 |              1 |     5 |      13 |
| **Pilot total**      |      **4** |         **2** |          **2** | **8** |  **20** |

Temperature is the only Phase 1 measurement. The selected product direction is
BIO-EMS Standard using industrial DS18B20 temperature Sensors and BIO-EMS Site
Controller v1.

## Included capabilities

- configured Site → Monitored Area (Room) → Sensor inventory;
- Device onboarding and trusted MQTT telemetry;
- temperature thresholds and Alarm evaluation;
- Device heartbeat/communication health;
- channel-independent notification-event foundation;
- SMS failover behavior contract;
- calibration metadata and append-only calibration history;
- commissioning evidence defined by this package.

## Explicitly not claimed by this package

- completed field survey or approved controller mounting position;
- confirmed cable type, length, route, containment, or penetration detail;
- assigned hardware serial numbers or final Device/channel identities;
- installed/calibrated hardware or live Pilot acceptance;
- a production SMS/WhatsApp provider or customer recipient list;
- humidity, differential pressure, door, power, particle, or other measurements;
- Monitoring Point, Asset, OTA, licensing, or production deployment capabilities.

## Change control

The Site/area/Sensor totals above are the controlled baseline. Any change must record:

1. requested change and reason;
2. affected Site, area, controller, channel, and Sensor records;
3. technical and commercial impact;
4. customer approval;
5. document revision and approver;
6. corresponding BIO-EMS configuration update.

Field-survey discoveries may fill a `TBD` value without changing scope. Adding,
removing, or relocating a monitored area or Sensor is a scope revision.

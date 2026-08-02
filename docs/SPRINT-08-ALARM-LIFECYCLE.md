Sprint 08 - Alarm Lifecycle Management
Status

Completed ✅

Version

v0.7.0

Date

2026-07-30

Objective

Implement complete Alarm Lifecycle Management in BIO-EMS Backend.

The system can now:

Detect temperature alarms
Prevent duplicate active alarms
Automatically recover alarms when temperature returns to normal range
Store alarm history in SQLite
Continue telemetry storage in InfluxDB
Implemented Features
1. Alarm Repository

File:

backend/src/repositories/alarm.repository.ts

Implemented functions:

create()
findActiveAlarm()
recoverAlarm()
getAll()

Responsibilities:

Create alarm records
Search active alarms
Update alarm status
Retrieve alarm history
2. Alarm Service

File:

backend/src/services/alarm.service.ts

Implemented functions:

createAlarm()
getActiveAlarm()
recoverAlarm()
getAlarms()

Responsibilities:

Alarm business logic
Duplicate alarm prevention
Alarm state management
Recovery handling
3. Alarm Evaluator

File:

backend/src/services/alarm.evaluator.ts

Implemented:

High Temperature Detection

Condition:

value > alarm_high

Action:

Create HIGH_TEMPERATURE Alarm

Status:

TRIGGERED

Example:

Temperature = 9 °C

Alarm High = 8 °C

Result:

HIGH ALARM CREATED

Low Temperature Detection

Condition:

value < alarm_low

Action:

Create LOW_TEMPERATURE Alarm

Status:

TRIGGERED

Duplicate Alarm Prevention

The system checks for an existing active alarm using:

sensor_id

alarm_type

status = TRIGGERED

If an active alarm exists:

No new alarm is created

Example:

Input:

Temperature = 9 °C

Temperature = 9 °C

Result:

Alarm already active

No duplicate records are inserted.

Alarm Recovery Logic

Initial state:

Temperature = 9 °C

Alarm:

HIGH_TEMPERATURE

Status:

TRIGGERED

Recovery:

Temperature = 5 °C

Result:

Status = RECOVERED

recovered_time = CURRENT_TIMESTAMP

Console output:

Alarm recovered: 1

Normal: Room Temperature Sensor = 5

Database Implementation

SQLite Table:

alarms

Fields:

id

sensor_id

type

severity

status

trigger_value

trigger_time

acknowledged_time

recovered_time

created_at

Alarm lifecycle:

TRIGGERED

↓

RECOVERED

Telemetry Integration

Alarm processing flow:

MQTT

↓

Telemetry Service

↓

Alarm Evaluator

↓

Alarm Service

↓

SQLite

↓

InfluxDB

Testing Results
Test 1 - Duplicate Alarm Prevention

Input:

Temperature = 9 °C

First message:

HIGH ALARM: Room Temperature Sensor = 9

Second message:

Alarm already active: Sensor 2 - HIGH_TEMPERATURE

Result:

PASS ✅

Test 2 - Alarm Recovery

Trigger:

Temperature = 9 °C

Result:

Alarm Created

Status = TRIGGERED

Recovery:

Temperature = 5 °C

Result:

Alarm recovered: 1

Normal: Room Temperature Sensor = 5

Database:

status = RECOVERED

recovered_time = populated

Result:

PASS ✅

Build Verification

Command:

npm run build

Result:

TypeScript compilation successful

Status:

PASS ✅

Sprint 08 Summary

Completed:

✅ Alarm Repository
✅ Alarm Service
✅ Alarm Evaluator
✅ Duplicate Alarm Prevention
✅ Automatic Recovery Logic
✅ SQLite Alarm History
✅ InfluxDB Telemetry Integration
✅ Build Verification
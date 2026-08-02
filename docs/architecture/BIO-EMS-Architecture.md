# BIO-EMS Architecture
Version: 1.0
Status: Approved
Last Updated: 2026-07-29

---

# 1. Overview

BIO-EMS (Biological Environmental Monitoring System) is a pharmaceutical environmental monitoring platform designed to monitor:

- Cold Rooms
- Warehouses
- Laboratories
- Production Areas

The system continuously collects environmental measurements from ESP32-based data loggers using MQTT and stores historical telemetry in InfluxDB while maintaining all system configuration in SQLite.

The platform is designed to be:

- Modular
- Scalable
- Multi-Site
- Secure
- Easy to Maintain

---

# 2. High-Level Architecture

                        +----------------------+
                        |      Dashboard       |
                        |  React / Grafana     |
                        +----------+-----------+
                                   |
                              REST API
                                   |
                        +----------v-----------+
                        |      Backend         |
                        |   Express + TS       |
                        +----------+-----------+
                                   |
        +--------------------------+-------------------------+
        |                          |                         |
        |                          |                         |
+-------v------+         +---------v---------+      +--------v--------+
|   SQLite     |         |    InfluxDB       |      |  MQTT Broker    |
|Configuration |         | Historical Data   |      |    Mosquitto    |
+--------------+         +-------------------+      +--------+--------+
                                                             |
                                                             |
                                                     +-------v-------+
                                                     | ESP32 Devices |
                                                     +---------------+

---

# 3. System Components

The platform consists of six major components.

## 3.1 Backend

Responsibilities

- REST API
- Authentication
- Validation
- Business Logic
- Alarm Engine
- MQTT Processing
- Configuration Management

Technology

- Node.js
- Express
- TypeScript

---

## 3.2 SQLite

Stores

- Sites
- Rooms
- Devices
- Sensors
- Alarm Limits
- Users
- Roles
- Configuration

SQLite never stores telemetry history.

---

## 3.3 InfluxDB

Stores

- Temperature
- Humidity
- Pressure
- Battery
- Signal
- Historical Measurements

InfluxDB is optimized for time-series data.

---

## 3.4 MQTT Broker

Responsibilities

Reliable communication between devices and backend.

Current Broker

Mosquitto

Protocol

MQTT 3.1.1

QoS

1

---

## 3.5 ESP32 Firmware

Responsibilities

- Read sensors
- Build MQTT payload
- Publish telemetry
- Execute backend commands

Firmware contains no business logic.

---

## 3.6 Dashboard

Responsibilities

- Live Monitoring
- Historical Charts
- Alarm Visualization
- Configuration Management

Dashboard never performs calculations.

---

# 4. Backend Architecture

The backend follows a layered architecture.

Controller

↓

Service

↓

Repository

↓

Database

Each layer has one responsibility.

---

# 5. Request Flow

REST Request

↓

Route

↓

Controller

↓

Service

↓

Repository

↓

SQLite

↓

JSON Response

---

# 6. Telemetry Flow

ESP32

↓

MQTT Broker

↓

MQTT Client

↓

Topic Router

↓

Telemetry Handler

↓

Validation

↓

Sensor Resolution

↓

InfluxDB

↓

Alarm Engine

↓

Dashboard

---

# 7. MQTT Processing

Incoming Topic

bioems/{siteCode}/telemetry/{deviceId}

↓

Validate Topic

↓

Parse JSON

↓

Validate Device

↓

Validate Channels

↓

Resolve Sensors

↓

Store Telemetry

↓

Check Alarms

↓

Publish Notifications (Future)

---

# 8. Database Responsibilities

SQLite

Configuration Database

Stores

- Metadata
- Relationships
- Alarm Settings

InfluxDB

Telemetry Database

Stores

- Sensor Values
- Time Series

---

# 9. Module Structure

Backend

Modules

Authentication

Sites

Devices

Rooms

Sensors

Telemetry

MQTT

Alarms

Notifications

Users

Configuration

Each module is independent.

---

# 10. Data Ownership

SQLite owns

- Sites
- Rooms
- Devices
- Sensors

InfluxDB owns

- Measurements

MQTT owns

- Communication

Backend owns

- Business Rules

Dashboard owns

- Visualization

---

# 11. Alarm Processing

Telemetry arrives

↓

Sensor identified

↓

Alarm limits loaded

↓

Compare Value

↓

Normal

or

High Alarm

or

Low Alarm

↓

Store Alarm

↓

Notify Users

---

# 12. Device Lifecycle

Device Registered

↓

Configured

↓

Assigned to Site

↓

Assigned to Room

↓

Activated

↓

Publishing Telemetry

↓

Maintenance

↓

Retired

---

# 13. Security Model

Authentication

REST API

↓

Authorization

↓

Validation

↓

Business Logic

↓

Database

Future versions

- JWT
- HTTPS
- TLS MQTT
- Role Based Access Control

---

# 14. Scalability

The architecture supports

- Unlimited Sites
- Multiple Buildings
- Hundreds of Rooms
- Thousands of Sensors
- Millions of Measurements

without architectural redesign.

---

# 15. Error Handling

Errors never stop the pipeline.

Invalid messages are:

- Logged
- Rejected
- Ignored

Processing continues normally.

---

# 16. Design Principles

Single Responsibility

Single Source of Truth

Backend Owns Business Logic

Configuration Separate from Telemetry

Loose Coupling

High Cohesion

Fail Safe

Backward Compatibility

---

# 17. Future Extensions

Mobile Application

OTA Firmware Update

Audit Log

Notification Service

SMS

Email

WhatsApp

AI Analytics

Predictive Maintenance

Cloud Synchronization

Enterprise Multi-Tenant

---

# 18. Architecture Summary

ESP32 acquires data.

MQTT transports data.

Backend validates data.

SQLite stores configuration.

InfluxDB stores telemetry.

Alarm Engine evaluates measurements.

Dashboard visualizes information.

Together they form the BIO-EMS platform.
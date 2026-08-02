# BIO-EMS MQTT Protocol

Version: 1.0.0

Status: Implemented

---

# 1. Overview

BIO-EMS uses MQTT as the communication protocol between field devices and the backend monitoring system.

The MQTT layer is responsible for:

- Receiving telemetry messages from devices.
- Routing messages according to MQTT topics.
- Validating payload structure.
- Linking telemetry data to registered devices and sensors.
- Storing measurements in InfluxDB.

---

# 2. MQTT Topic Structure

Current telemetry topic format:

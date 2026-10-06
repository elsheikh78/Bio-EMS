export type HardwareLabExecutionMode = "AUTO" | "MANUAL" | "HYBRID";

export interface HardwareLabStepDefinition {
  code: string;
  sequence: number;
  title: string;
  executionMode: HardwareLabExecutionMode;
  acceptanceRule: string;
}

export const HARDWARE_PROFILE_REV = "Rev.A-2G";
export const TEST_PROFILE_REV = "HQT-1";

export const hardwareLabSteps: HardwareLabStepDefinition[] = [
  {
    code: "BENCH_SETUP",
    sequence: 0,
    title: "Bench setup and identification",
    executionMode: "MANUAL",
    acceptanceRule:
      "MAIN-01, SIM-01 and sensor labels recorded; DS18B20 ROM IDs captured; no 230 VAC on breadboard; DC/DC converters pre-adjusted.",
  },
  {
    code: "POWER_RAILS",
    sequence: 1,
    title: "Power rails",
    executionMode: "MANUAL",
    acceptanceRule:
      "24 V, MAIN 5 V, SIM 5 V and SIM800L 4.00 V rails stable through no-load and load checks with no abnormal heat, smell or unexplained voltage drop.",
  },
  {
    code: "SENSOR_SINGLE",
    sequence: 2,
    title: "Single DS18B20",
    executionMode: "HYBRID",
    acceptanceRule:
      "One DS18B20 reports a fixed ROM ID and stable temperature/CRC for one hour with no reset and no recurring unexplained 85 C, -127 C or disconnect errors.",
  },
  {
    code: "SENSOR_CABLE",
    sequence: 3,
    title: "Sensor cable 5 m / 10 m / 20 m",
    executionMode: "AUTO",
    acceptanceRule:
      "Two-hour run at each cable length with successful-read rate >= 99.99%. Start with 4.7 kΩ pull-up; if 20 m CRC errors occur, repeat with 2.2 kΩ and compare.",
  },
  {
    code: "SENSOR_FAULTS",
    sequence: 4,
    title: "Sensor fault injection",
    executionMode: "HYBRID",
    acceptanceRule:
      "Disconnect, reconnect, DATA-to-GND, VDD removal and sensor replacement are detected with the expected fault code and automatic recovery without resetting unrelated channels.",
  },
  {
    code: "SIMD4_CHANNELS",
    sequence: 5,
    title: "SIM-D4 four-channel isolation",
    executionMode: "HYBRID",
    acceptanceRule:
      "Four DS18B20 channels report independent ROM/temperature/status values; a CH2 fault does not disturb CH1, CH3 or CH4.",
  },
  {
    code: "RS485_SHORT",
    sequence: 6,
    title: "RS485 short-link Modbus RTU",
    executionMode: "HYBRID",
    acceptanceRule:
      "Modbus RTU 19200 8N1, SIM address 1, returns four temperatures/status values with no recurring timeouts/corrupt frames and recovers after cable reconnect.",
  },
  {
    code: "RS485_20M_POWER",
    sequence: 7,
    title: "RS485 + 24 V over 20 m",
    executionMode: "HYBRID",
    acceptanceRule:
      "Four-hour continuous polling over one 20 m cable remains stable with acceptable 24 V/5 V rails, no resets, no impactful drop and no continuous communication errors.",
  },
  {
    code: "ETHERNET_W5500",
    sequence: 8,
    title: "W5500 Ethernet",
    executionMode: "HYBRID",
    acceptanceRule:
      "Telemetry reaches BIO-EMS through W5500; a two-minute Ethernet outage does not stop local acquisition and the connection recovers automatically without manual restart.",
  },
  {
    code: "CELLULAR_SIM800L",
    sequence: 9,
    title: "SIM800L 2G / SMS",
    executionMode: "HYBRID",
    acceptanceRule:
      "SIM800L registers on 2G, records CSQ, sends 20 SMS attempts, and does not reset ESP32, SIM-D4 or Ethernet. Cellular failures are classified separately from sensor failures.",
  },
  {
    code: "INTEGRATED",
    sequence: 10,
    title: "Integrated MAIN + SIM-D4",
    executionMode: "HYBRID",
    acceptanceRule:
      "RS485, Ethernet and SIM800L operate together while exercising sensor, RS485, Ethernet and power-cycle recovery without an unrecovered fault.",
  },
  {
    code: "ENDURANCE_24H",
    sequence: 11,
    title: "24-hour endurance",
    executionMode: "AUTO",
    acceptanceRule:
      "Twenty-four hours complete with sensor/RS485/network/SMS counters retained and no unexplained reboot or unrecovered fault.",
  },
  {
    code: "MAIN_RS485_PORTS",
    sequence: 12,
    title: "Four MAIN RS485 ports",
    executionMode: "HYBRID",
    acceptanceRule:
      "All four MAIN RS485 ports are selected and exercised successfully before expanding to four SIM-D4 modules.",
  },
  {
    code: "SYSTEM_16_SENSOR_48H",
    sequence: 13,
    title: "16-sensor / 48-hour qualification",
    executionMode: "AUTO",
    acceptanceRule:
      "Four SIM-D4 modules / sixteen sensors run for 48 hours with fixed mapping, isolated SIM faults, Ethernet recovery, SMS during polling, and mapping persistence after MAIN reboot.",
  },
  {
    code: "ACCURACY_CALIBRATION",
    sequence: 14,
    title: "Accuracy and calibration",
    executionMode: "MANUAL",
    acceptanceRule:
      "Temperature accuracy is assessed against a traceable reference and the recorded calibration result is accepted before the pilot BOM is frozen.",
  },
];

export const hardwareLabFaultCodes = [
  "MISSING_SENSOR",
  "ERROR_CRC_SENSOR",
  "SENSOR_REPLACED",
  "SIM_COMM_LOSS",
  "SIM_POWER_RECOVERY",
  "DOWN_ETHERNET",
  "CELLULAR_NOT_REGISTERED",
  "FAILED_SEND_SMS",
  "STORAGE_UNAVAILABLE",
] as const;

export const hardwareLabFirmwareProfiles = [
  {
    target: "MAIN16",
    name: "BIOEMS-MAIN16-BENCH",
    chip: "ESP32-S3",
    purpose: "RS485 master, W5500, SIM800L, RTC/SD, counters, fault logging and test commands",
    requiredForPhysicalQualification: true,
  },
  {
    target: "SIMD4",
    name: "BIOEMS-SIMD4-BENCH",
    chip: "ATmega328P / Arduino Nano class",
    purpose: "Four independent DS18B20 channels, ROM/CRC/status and Modbus RTU slave",
    requiredForPhysicalQualification: true,
  },
  {
    target: "SITE_CONTROLLER",
    name: "BIOEMS-SITE-CONTROLLER-PILOT",
    chip: "ESP32-S3",
    purpose: "Post-qualification provisioning and platform binding firmware",
    requiredForPhysicalQualification: false,
  },
] as const;

export type HardwareFieldType = "text" | "number" | "boolean" | "choice";

export type HardwareAcceptanceRule =
  | { kind: "boolean"; expected: boolean }
  | { kind: "number-min"; value: number }
  | { kind: "number-max"; value: number }
  | { kind: "number-equals"; value: number }
  | { kind: "string-equals"; value: string }
  | { kind: "non-empty" };

export interface HardwareTestField {
  key: string;
  label: string;
  type: HardwareFieldType;
  required: boolean;
  unit?: string;
  options?: Array<{ value: string; label: string }>;
  help?: string;
  rule?: HardwareAcceptanceRule;
}

export interface HardwareTestStepDefinition {
  key: string;
  order: number;
  title: string;
  stage: string;
  instructions: string[];
  expectedDurationMinutes?: number;
  fields: HardwareTestField[];
  acceptanceNote?: string;
}

const yes = (key: string, label: string, help?: string): HardwareTestField => ({
  key,
  label,
  type: "boolean",
  required: true,
  help,
  rule: { kind: "boolean", expected: true },
});

const no = (key: string, label: string, help?: string): HardwareTestField => ({
  key,
  label,
  type: "boolean",
  required: true,
  help,
  rule: { kind: "boolean", expected: false },
});

const number = (
  key: string,
  label: string,
  unit?: string,
  rule?: HardwareAcceptanceRule,
  help?: string
): HardwareTestField => ({
  key,
  label,
  type: "number",
  required: true,
  unit,
  rule,
  help,
});

export const HARDWARE_TEST_PROFILE_REVISION = "REV-A-2G-HQT-1";

export const HARDWARE_FAULT_CODES = [
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

export const HARDWARE_FIRMWARE_CATALOG = [
  {
    target: "MAIN16_BENCH",
    name: "BIOEMS-MAIN16-BENCH",
    device: "ESP32-S3 N16R8",
    purpose: "Bench qualification: RS485 master, Ethernet, 2G/SMS and test counters.",
    availability: "SOURCE_REQUIRED",
  },
  {
    target: "SIMD4_BENCH",
    name: "BIOEMS-SIMD4-BENCH",
    device: "Arduino Nano / ATmega328P-class MCU",
    purpose: "Four independent DS18B20 channels and Modbus RTU slave qualification.",
    availability: "SOURCE_REQUIRED",
  },
  {
    target: "SITE_CONTROLLER_PILOT",
    name: "BIOEMS-SITE-CONTROLLER-PILOT",
    device: "ESP32-S3",
    purpose: "Final pilot pairing/provisioning firmware after hardware qualification.",
    availability: "DEVICE_PROVISIONING",
  },
] as const;

export const HARDWARE_TEST_STEPS: HardwareTestStepDefinition[] = [
  {
    key: "BENCH_SETUP",
    order: 0,
    title: "Bench setup and traceability",
    stage: "Stage 0",
    instructions: [
      "Label MAIN-01, SIM-01 and S01..S05 before energizing the prototype.",
      "Record DS18B20 ROM IDs and pre-adjust all DC/DC converters.",
      "Do not place 230 VAC mains on the breadboard.",
    ],
    fields: [
      yes("labelsComplete", "MAIN/SIM/sensor labels completed"),
      yes("romIdsRecorded", "Sensor ROM IDs recorded"),
      yes("noMainsOnBreadboard", "No 230 VAC mains on breadboard"),
      yes("dcDcPreadjusted", "DC/DC outputs pre-adjusted before connection"),
    ],
  },
  {
    key: "POWER_RAILS",
    order: 1,
    title: "Power rails",
    stage: "Stage 1",
    instructions: [
      "Start with ESP32, Nano and SIM800L disconnected.",
      "Measure MAIN 5 V, SIM-D4 5 V and SIM800L supply before load.",
      "Observe unloaded rails for 15 minutes, then repeat under load.",
    ],
    expectedDurationMinutes: 15,
    fields: [
      number("main5V", "MAIN rail", "V"),
      number("sim5V", "SIM-D4 rail", "V"),
      number("sim800Vbat", "SIM800L VBAT", "V"),
      yes("railsStable15m", "Rails stable for 15 minutes"),
      yes("noAbnormalHeat", "No abnormal heat"),
      yes("noSmell", "No abnormal smell"),
      yes("noImpactfulDrop", "No impactful voltage drop"),
    ],
    acceptanceNote:
      "The manual specifies the target rails and qualitative stability checks but does not define numeric tolerance bands; measured voltages are retained as evidence without inventing a tolerance.",
  },
  {
    key: "SINGLE_SENSOR",
    order: 2,
    title: "Single DS18B20",
    stage: "Stage 2",
    instructions: [
      "Connect one powered DS18B20 to the SIM-D4 MCU with a 4.7 kΩ pull-up.",
      "Read ROM ID, temperature and CRC once per second for one hour.",
      "Record any 85°C, -127°C, disconnect or reset condition.",
    ],
    expectedDurationMinutes: 60,
    fields: [
      {
        key: "romId",
        label: "DS18B20 ROM ID",
        type: "text",
        required: true,
        rule: { kind: "non-empty" },
      },
      number(
        "durationMinutes",
        "Observed duration",
        "min",
        { kind: "number-min", value: 60 }
      ),
      number(
        "successRatePercent",
        "Successful reads",
        "%",
        { kind: "number-min", value: 99.99 }
      ),
      yes("romStable", "ROM ID remained fixed"),
      number("resetCount", "MCU resets", undefined, { kind: "number-max", value: 0 }),
      no("recurringErrors", "Recurring unexplained sensor errors"),
    ],
    acceptanceNote:
      "Rev.A prints the read-success comparison in the opposite direction. This digital profile explicitly treats 99.99% as the minimum success target so the rule is visible rather than silently corrected.",
  },
  {
    key: "SENSOR_CABLE",
    order: 3,
    title: "Sensor cable 5 / 10 / 20 m",
    stage: "Stage 3",
    instructions: [
      "Test twisted-pair sensor cable at 5 m, 10 m and 20 m.",
      "Start with 4.7 kΩ pull-up; only retry 20 m with 2.2 kΩ if CRC errors appear.",
      "Record two hours at one reading per second for the tested length.",
    ],
    expectedDurationMinutes: 120,
    fields: [
      {
        key: "cableLengthM",
        label: "Cable length",
        type: "choice",
        required: true,
        options: [
          { value: "5", label: "5 m" },
          { value: "10", label: "10 m" },
          { value: "20", label: "20 m" },
        ],
      },
      {
        key: "pullupOhms",
        label: "Pull-up",
        type: "choice",
        required: true,
        options: [
          { value: "4700", label: "4.7 kΩ" },
          { value: "2200", label: "2.2 kΩ" },
        ],
      },
      number(
        "durationMinutes",
        "Observed duration",
        "min",
        { kind: "number-min", value: 120 }
      ),
      number(
        "successRatePercent",
        "Successful reads",
        "%",
        { kind: "number-min", value: 99.99 }
      ),
      no("recurringCrcErrors", "Recurring CRC errors"),
    ],
    acceptanceNote:
      "Complete this step once for each required cable length. Store the individual samples in Measurements before marking the step complete.",
  },
  {
    key: "SENSOR_FAULTS",
    order: 4,
    title: "Sensor fault injection",
    stage: "Stage 4",
    instructions: [
      "Disconnect the sensor and verify MISSING_SENSOR.",
      "Reconnect and verify automatic recovery without MCU reset.",
      "Short DATA to GND, disconnect VDD and replace S01 with S05.",
    ],
    fields: [
      yes("missingDetected", "Disconnect detected as MISSING_SENSOR"),
      yes("recoveredWithoutReset", "Reconnect recovered without reset"),
      yes("dataShortIsolated", "DATA-to-GND fault remained isolated"),
      yes("vddFaultDetected", "VDD disconnect detected"),
      yes("replacementDetected", "ROM change detected as SENSOR_REPLACED"),
    ],
  },
  {
    key: "FOUR_SENSOR_ISOLATION",
    order: 5,
    title: "Four-channel SIM-D4 isolation",
    stage: "Stage 5",
    instructions: [
      "Connect four DS18B20 sensors to independent GPIO channels and pull-ups.",
      "Capture ROM ID, temperature and status for all four channels.",
      "Fault CH2 and prove CH1, CH3 and CH4 remain healthy.",
    ],
    fields: [
      number("channelCount", "Connected channels", undefined, {
        kind: "number-equals",
        value: 4,
      }),
      yes("independentGpioPullups", "Independent GPIO and pull-up per channel"),
      yes("statusesCaptured", "ROM/temperature/status captured for all channels"),
      yes("unaffectedChannelsStable", "Other channels stayed stable during CH2 fault"),
    ],
  },
  {
    key: "RS485_SHORT",
    order: 6,
    title: "Short RS485 / Modbus RTU",
    stage: "Stage 6",
    instructions: [
      "Connect Nano → HW-519 and ESP32 → HW-519 over a 1–2 m cable.",
      "Use Modbus RTU 19200 baud, 8N1 and SIM address 1.",
      "Read four temperatures/status values and test cable disconnect/reconnect.",
    ],
    fields: [
      number("baud", "Baud rate", "baud", { kind: "number-equals", value: 19200 }),
      {
        key: "frameFormat",
        label: "Serial frame",
        type: "choice",
        required: true,
        options: [{ value: "8N1", label: "8N1" }],
        rule: { kind: "string-equals", value: "8N1" },
      },
      number("simAddress", "SIM Modbus address", undefined, {
        kind: "number-equals",
        value: 1,
      }),
      no("recurringTimeouts", "Recurring timeouts"),
      no("corruptFrames", "Recurring corrupt frames"),
      yes("autoRecovery", "Automatic recovery after cable reconnect"),
    ],
  },
  {
    key: "RS485_20M_POWER",
    order: 7,
    title: "20 m RS485 + 24 V",
    stage: "Stage 7",
    instructions: [
      "Run one 20 m cable carrying 24 V and RS485 to the SIM-D4.",
      "Measure 24 V at MAIN, 24 V at SIM and 5 V inside SIM-D4.",
      "Poll continuously for four hours.",
    ],
    expectedDurationMinutes: 240,
    fields: [
      number("cableLengthM", "Cable length", "m", { kind: "number-equals", value: 20 }),
      number(
        "durationMinutes",
        "Observed duration",
        "min",
        { kind: "number-min", value: 240 }
      ),
      number("main24V", "24 V at MAIN", "V"),
      number("sim24V", "24 V at SIM-D4", "V"),
      number("sim5V", "5 V inside SIM-D4", "V"),
      no("resets", "Unexpected resets"),
      no("impactfulVoltageDrop", "Impactful voltage drop"),
      no("continuousCommErrors", "Continuous communication errors"),
    ],
  },
  {
    key: "ETHERNET_W5500",
    order: 8,
    title: "W5500 Ethernet",
    stage: "Stage 8",
    instructions: [
      "Connect W5500 using the approved SPI pinout.",
      "Verify DHCP/static addressing and communication to the BIO-EMS PC.",
      "Send telemetry end-to-end, disconnect Ethernet for two minutes and verify automatic recovery while acquisition continues.",
    ],
    fields: [
      yes("addressConfigured", "DHCP/static address configured"),
      yes("platformReachable", "BIO-EMS PC reachable"),
      yes("telemetryEndToEnd", "Sensor → SIM → RS485 → ESP → Ethernet → BIO-EMS verified"),
      yes("acquisitionContinuesDuringLoss", "Local acquisition continued during 2-minute loss"),
      yes("autoRecovered", "Ethernet recovered without manual restart"),
    ],
  },
  {
    key: "SIM800L_SMS",
    order: 9,
    title: "SIM800L 2G / SMS",
    stage: "Stage 9",
    instructions: [
      "Confirm the SIM800L supply before connection and run AT, CREG?, CSQ and CMGF=1 checks.",
      "Verify 2G registration and signal quality.",
      "Complete and record a 20-send SMS sequence during normal operation.",
    ],
    fields: [
      number("sim800Vbat", "SIM800L VBAT", "V"),
      yes("atOk", "AT command accepted"),
      yes("registered", "Registered on 2G network"),
      number("csq", "CSQ", undefined),
      number("smsAttempts", "SMS attempts", undefined, {
        kind: "number-min",
        value: 20,
      }),
      number("smsAccepted", "SMS accepted by modem"),
      number("smsFailed", "SMS failed"),
      yes("twentySendSequenceCompleted", "20-send sequence completed"),
      no("espReset", "ESP32 reset during SMS activity"),
      no("simD4Reset", "SIM-D4 reset during SMS activity"),
      yes("ethernetUnaffected", "Ethernet operation remained stable"),
      yes("networkAdequate", "2G registration/signal adequate for the test"),
    ],
  },
  {
    key: "INTEGRATED",
    order: 10,
    title: "Integrated MAIN + SIM-D4",
    stage: "Stage 10",
    instructions: [
      "Operate RS485, Ethernet and SIM800L simultaneously with four sensors.",
      "Send SMS during polling and inject sensor, RS485 and Ethernet faults.",
      "Verify recovery after each fault and controlled power cycles.",
    ],
    fields: [
      yes("rs485Ok", "RS485 polling stable"),
      yes("ethernetOk", "Ethernet telemetry stable"),
      yes("sim800Ok", "SIM800L activity stable"),
      yes("smsDuringPollingOk", "SMS during polling did not disturb acquisition"),
      yes("sensorRecoveryOk", "Sensor disconnect/reconnect recovered"),
      yes("rs485RecoveryOk", "RS485 disconnect/reconnect recovered"),
      yes("ethernetRecoveryOk", "Ethernet loss/reconnect recovered"),
      yes("powerCycleRecoveryOk", "Power-cycle recovery completed"),
    ],
  },
  {
    key: "ENDURANCE_24H",
    order: 11,
    title: "24-hour endurance",
    stage: "Stage 11",
    instructions: [
      "Run continuously for at least 24 hours.",
      "Retain per-channel sensor attempts/success/CRC counters, RS485 requests/timeouts/CRC, reboot counters, Ethernet recovery and SMS results.",
      "No unexplained reboot or unrecovered fault is accepted.",
    ],
    expectedDurationMinutes: 1440,
    fields: [
      number(
        "durationMinutes",
        "Observed duration",
        "min",
        { kind: "number-min", value: 1440 }
      ),
      yes("countersCaptured", "Required firmware counters captured"),
      number("unrecoveredFaults", "Unrecovered faults", undefined, {
        kind: "number-max",
        value: 0,
      }),
      number("unexplainedEspReboots", "Unexplained ESP32 reboots", undefined, {
        kind: "number-max",
        value: 0,
      }),
      number("unexplainedNanoReboots", "Unexplained Nano reboots", undefined, {
        kind: "number-max",
        value: 0,
      }),
    ],
  },
  {
    key: "FOUR_MAIN_PORTS",
    order: 12,
    title: "Four MAIN RS485 ports",
    stage: "Expansion",
    instructions: [
      "After the first SIM-D4 passes, test all four MAIN RS485 ports through the selector.",
      "Verify port mapping and recovery from an isolated port fault.",
    ],
    fields: [
      number("portsTested", "MAIN RS485 ports tested", undefined, {
        kind: "number-equals",
        value: 4,
      }),
      yes("selectorMappingCorrect", "Selector-to-port mapping correct"),
      yes("eachPortPassed", "Every MAIN port passed"),
      yes("portFaultIsolated", "Fault on one port remained isolated and recovered"),
    ],
  },
  {
    key: "SIXTEEN_SENSOR_48H",
    order: 13,
    title: "16 sensors / 48-hour endurance",
    stage: "Expansion",
    instructions: [
      "Connect four qualified SIM-D4 units with 16 sensors.",
      "Run for at least 48 hours and fault each SIM-D4 in turn.",
      "Verify fixed mapping, ROM IDs, SMS during polling, Ethernet recovery and MAIN reboot recovery.",
    ],
    expectedDurationMinutes: 2880,
    fields: [
      number("sensorCount", "Connected sensors", undefined, {
        kind: "number-equals",
        value: 16,
      }),
      number(
        "durationMinutes",
        "Observed duration",
        "min",
        { kind: "number-min", value: 2880 }
      ),
      yes("mappingFixed", "Channel mapping remained fixed"),
      yes("romIdsMatch", "Sensor ROM IDs matched the approved mapping"),
      yes("faultsIsolated", "Each SIM-D4 fault remained isolated"),
      yes("smsDuringPolling", "SMS succeeded while all SIM-D4 units were polled"),
      yes("ethernetRecovery", "Ethernet recovered automatically"),
      yes("mainRebootRecovery", "MAIN reboot restored the approved mapping"),
      number("unrecoveredFaults", "Unrecovered faults", undefined, {
        kind: "number-max",
        value: 0,
      }),
    ],
  },
  {
    key: "ACCURACY_FINAL",
    order: 14,
    title: "Accuracy, calibration and final qualification",
    stage: "Final gate",
    instructions: [
      "Compare temperature performance against the approved traceable reference.",
      "Record calibration/accuracy evidence before freezing the pilot BOM.",
      "BIO-EMS qualifies the run only if every prior stage is PASS.",
    ],
    fields: [
      yes("traceableReferenceUsed", "Traceable reference used"),
      yes("accuracyWithinApprovedLimit", "Accuracy is within the approved project limit"),
      yes("calibrationRecorded", "Calibration/accuracy evidence recorded"),
    ],
    acceptanceNote:
      "Rev.A does not define a numeric temperature-accuracy tolerance. The approved project limit must be supplied by the calibration procedure; this profile does not invent one.",
  },
];

export type HardwareEvidenceValue = string | number | boolean | null;

export interface HardwareStepEvaluation {
  passed: boolean;
  reasons: string[];
}

function missing(value: HardwareEvidenceValue | undefined): boolean {
  return value === undefined || value === null || value === "";
}

function evaluateRule(
  field: HardwareTestField,
  value: HardwareEvidenceValue
): string | undefined {
  const rule = field.rule;
  if (!rule) return undefined;
  if (rule.kind === "boolean") {
    return value === rule.expected ? undefined : `${field.label}: expected ${rule.expected}`;
  }
  if (rule.kind === "non-empty") {
    return typeof value === "string" && value.trim().length > 0
      ? undefined
      : `${field.label}: value is required`;
  }
  if (rule.kind === "string-equals") {
    return value === rule.value ? undefined : `${field.label}: expected ${rule.value}`;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return `${field.label}: numeric value is required`;
  }
  if (rule.kind === "number-min") {
    return value >= rule.value ? undefined : `${field.label}: minimum is ${rule.value}`;
  }
  if (rule.kind === "number-max") {
    return value <= rule.value ? undefined : `${field.label}: maximum is ${rule.value}`;
  }
  return value === rule.value ? undefined : `${field.label}: expected ${rule.value}`;
}

export function evaluateHardwareStep(
  stepKey: string,
  values: Record<string, HardwareEvidenceValue>
): HardwareStepEvaluation {
  const step = HARDWARE_TEST_STEPS.find((item) => item.key === stepKey);
  if (!step) throw new Error("Unknown hardware test step");

  const reasons: string[] = [];
  for (const field of step.fields) {
    const value = values[field.key];
    if (field.required && missing(value)) {
      reasons.push(`${field.label}: required`);
      continue;
    }
    if (!missing(value)) {
      const reason = evaluateRule(field, value);
      if (reason) reasons.push(reason);
    }
  }
  return { passed: reasons.length === 0, reasons };
}

export function hardwareTestProfile() {
  return {
    revision: HARDWARE_TEST_PROFILE_REVISION,
    faultCodes: HARDWARE_FAULT_CODES,
    firmwareCatalog: HARDWARE_FIRMWARE_CATALOG,
    steps: HARDWARE_TEST_STEPS,
  };
}

#include <Arduino.h>

// Bench profile v0.1.0: externally powered, three-wire DS18B20 probes.
// One independent 1-Wire bus per channel, each with a 4.7k pull-up to 5 V.
// RS485 interface: HW-519 automatic-direction TTL<->RS485 on Serial D0/D1, 9600 8N1.
// D1/TX -> HW-519 RXD; D0/RX <- HW-519 TXD. No DE/RE direction GPIO is used.
// Address jumpers D7/D8 to GND: 1 through 4, sampled only at startup.
static const uint8_t kPins[4] = {2, 3, 4, 5};
static const uint8_t kAddressBit0 = 7;
static const uint8_t kAddressBit1 = 8;
static const uint16_t kVersion = 0x0100;
static const uint16_t kProfile = 1;

static uint8_t address;
static int16_t temperature[4]; // signed tenths of a degree C
static uint8_t status[4];      // 0=valid, 1=missing, 2=CRC, 3=power-on/invalid
static uint32_t lastSample;
static uint32_t conversionStarted;
static bool converting[4];
static bool conversionPending;
static uint8_t frame[8];
static uint8_t received;
static uint32_t lastByteUs;

static bool resetBus(uint8_t pin) {
  noInterrupts();
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  delayMicroseconds(480);
  pinMode(pin, INPUT_PULLUP);
  delayMicroseconds(70);
  const bool present = digitalRead(pin) == LOW;
  interrupts();
  delayMicroseconds(410);
  return present;
}

static void writeBit(uint8_t pin, bool bit) {
  noInterrupts();
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  delayMicroseconds(bit ? 6 : 60);
  pinMode(pin, INPUT_PULLUP);
  if (bit) delayMicroseconds(64);
  else delayMicroseconds(10);
  interrupts();
}

static bool readBit(uint8_t pin) {
  noInterrupts();
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  delayMicroseconds(6);
  pinMode(pin, INPUT_PULLUP);
  delayMicroseconds(9);
  const bool value = digitalRead(pin) == HIGH;
  interrupts();
  delayMicroseconds(55);
  return value;
}

static void writeByte(uint8_t pin, uint8_t value) {
  for (uint8_t bit = 0; bit < 8; ++bit) writeBit(pin, value & (1u << bit));
}

static uint8_t readByte(uint8_t pin) {
  uint8_t value = 0;
  for (uint8_t bit = 0; bit < 8; ++bit) if (readBit(pin)) value |= (1u << bit);
  return value;
}

static uint8_t crc8(const uint8_t *bytes, uint8_t length) {
  uint8_t crc = 0;
  for (uint8_t i = 0; i < length; ++i) {
    uint8_t value = bytes[i];
    for (uint8_t bit = 0; bit < 8; ++bit) {
      const bool mix = (crc ^ value) & 1;
      crc >>= 1;
      if (mix) crc ^= 0x8c;
      value >>= 1;
    }
  }
  return crc;
}

static uint16_t crc16(const uint8_t *bytes, uint8_t length) {
  uint16_t crc = 0xffff;
  for (uint8_t i = 0; i < length; ++i) {
    crc ^= bytes[i];
    for (uint8_t bit = 0; bit < 8; ++bit)
      crc = (crc & 1) ? (crc >> 1) ^ 0xa001 : crc >> 1;
  }
  return crc;
}

static void startSample() {
  for (uint8_t channel = 0; channel < 4; ++channel) {
    converting[channel] = resetBus(kPins[channel]);
    if (!converting[channel]) { status[channel] = 1; continue; }
    writeByte(kPins[channel], 0xcc); // SKIP ROM: one probe per channel
    writeByte(kPins[channel], 0x44); // CONVERT T
  }
  conversionStarted = millis();
  conversionPending = true;
}

static void finishSample() {
  for (uint8_t channel = 0; channel < 4; ++channel) {
    if (!converting[channel]) continue;
    if (!resetBus(kPins[channel])) { status[channel] = 1; continue; }
    writeByte(kPins[channel], 0xcc);
    writeByte(kPins[channel], 0xbe); // READ SCRATCHPAD
    uint8_t scratchpad[9];
    for (uint8_t i = 0; i < 9; ++i) scratchpad[i] = readByte(kPins[channel]);
    if (crc8(scratchpad, 8) != scratchpad[8]) { status[channel] = 2; continue; }
    const int16_t raw = static_cast<int16_t>(
      static_cast<uint16_t>(scratchpad[0]) | (static_cast<uint16_t>(scratchpad[1]) << 8));
    if (raw == 0x0550 || raw < -880 || raw > 2000) { status[channel] = 3; continue; }
    temperature[channel] = static_cast<int16_t>((static_cast<int32_t>(raw) * 10) / 16);
    status[channel] = 0;
  }
  lastSample = millis();
  conversionPending = false;
}

// Modbus zero-based holding registers, FC03 only. Invalid temperatures are 0x8000.
// 0 version; 1 protocol; 2 address; 3 channel count;
// 4..7 signed temperature in 0.1 C; 8..11 status; 12 sample age (seconds).
static uint16_t registerValue(uint16_t index) {
  if (index == 0) return kVersion;
  if (index == 1) return kProfile;
  if (index == 2) return address;
  if (index == 3) return 4;
  if (index < 8) return status[index - 4] == 0
    ? static_cast<uint16_t>(temperature[index - 4]) : 0x8000;
  if (index < 12) return status[index - 8];
  return static_cast<uint16_t>(min((millis() - lastSample) / 1000, 65535UL));
}

static void transmit(const uint8_t *bytes, uint8_t count) {
  // HW-519 controls half-duplex transmit/receive direction in hardware.
  Serial.write(bytes, count);
  Serial.flush();
}

static void respond() {
  if (received != 8 || frame[0] != address) return;
  const uint16_t check = crc16(frame, 6);
  if (frame[6] != lowByte(check) || frame[7] != highByte(check)) return;
  const uint16_t start = (static_cast<uint16_t>(frame[2]) << 8) | frame[3];
  const uint16_t count = (static_cast<uint16_t>(frame[4]) << 8) | frame[5];
  uint8_t output[31];
  output[0] = address;
  if (frame[1] != 3 || count == 0 || count > 12 || start >= 13 ||
      static_cast<uint32_t>(start) + count > 13) {
    output[1] = frame[1] | 0x80;
    output[2] = frame[1] == 3 ? 2 : 1; // illegal address / function
    const uint16_t crc = crc16(output, 3);
    output[3] = lowByte(crc); output[4] = highByte(crc);
    transmit(output, 5);
    return;
  }
  output[1] = 3;
  output[2] = static_cast<uint8_t>(count * 2);
  for (uint8_t i = 0; i < count; ++i) {
    const uint16_t value = registerValue(start + i);
    output[3 + i * 2] = highByte(value);
    output[4 + i * 2] = lowByte(value);
  }
  const uint8_t length = 3 + count * 2;
  const uint16_t crc = crc16(output, length);
  output[length] = lowByte(crc); output[length + 1] = highByte(crc);
  transmit(output, length + 2);
}

void setup() {
  pinMode(kAddressBit0, INPUT_PULLUP);
  pinMode(kAddressBit1, INPUT_PULLUP);
  address = 1 + (digitalRead(kAddressBit0) == LOW ? 1 : 0)
              + (digitalRead(kAddressBit1) == LOW ? 2 : 0);
  for (uint8_t i = 0; i < 4; ++i) {
    pinMode(kPins[i], INPUT_PULLUP);
    status[i] = 3;
  }
  Serial.begin(9600);
  lastSample = millis() - 2000;
}

void loop() {
  // Do not start a sensor conversion while a Modbus request is arriving.
  while (Serial.available()) {
    const uint8_t byte = static_cast<uint8_t>(Serial.read());
    if (received < sizeof(frame)) frame[received++] = byte;
    else received = 0;
    lastByteUs = micros();
  }
  if (received && static_cast<uint32_t>(micros() - lastByteUs) > 4000) {
    respond();
    received = 0;
  }
  if (!received && conversionPending && static_cast<uint32_t>(millis() - conversionStarted) >= 750)
    finishSample();
  if (!received && !conversionPending && static_cast<uint32_t>(millis() - lastSample) >= 2000)
    startSample();
}

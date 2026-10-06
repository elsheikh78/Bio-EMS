#include "sim_modbus.h"

#include <string.h>

#include "driver/uart.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"

static SemaphoreHandle_t bus_mutex;

// Bench pin assignment. Verify the chosen ESP32-S3 board before wiring.
#ifndef SIM_RS485_TX_GPIO
#define SIM_RS485_TX_GPIO 17
#endif
#ifndef SIM_RS485_RX_GPIO
#define SIM_RS485_RX_GPIO 18
#endif

#define SIM_UART UART_NUM_1
// Nano rejects requests for more than 12 registers per frame.
#define SIM_REGISTER_COUNT 12
#define SIM_RESPONSE_LENGTH (3 + SIM_REGISTER_COUNT * 2 + 2)

static uint16_t modbus_crc(const uint8_t *bytes, size_t length) {
  uint16_t crc = 0xffff;
  for (size_t i = 0; i < length; ++i) {
    crc ^= bytes[i];
    for (int bit = 0; bit < 8; ++bit) {
      crc = (crc & 1) ? (crc >> 1) ^ 0xa001 : crc >> 1;
    }
  }
  return crc;
}

bool sim_modbus_init(void) {
  uart_config_t config = {
      .baud_rate = 9600,
      .data_bits = UART_DATA_8_BITS,
      .parity = UART_PARITY_DISABLE,
      .stop_bits = UART_STOP_BITS_1,
      .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
      .source_clk = UART_SCLK_DEFAULT,
  };
  if (uart_driver_install(SIM_UART, 256, 0, 0, NULL, 0) != ESP_OK ||
      uart_param_config(SIM_UART, &config) != ESP_OK ||
      uart_set_pin(SIM_UART, SIM_RS485_TX_GPIO, SIM_RS485_RX_GPIO,
                   UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE) != ESP_OK) {
    return false;
  }
  // HW-519 performs automatic half-duplex direction control; no DE/RE GPIO is used.
  bus_mutex = xSemaphoreCreateMutex();
  return bus_mutex != NULL;
}

static bool read_frame(uint8_t address, sim_modbus_sample_t *sample) {
  if (!sample || address < 1 || address > SIM_MAX_MODULES) return false;
  uint8_t request[] = {address, 0x03, 0, 0, 0, SIM_REGISTER_COUNT, 0, 0};
  uint16_t crc = modbus_crc(request, sizeof(request) - 2);
  request[6] = (uint8_t)crc;
  request[7] = (uint8_t)(crc >> 8);
  uart_flush_input(SIM_UART);
  int written = uart_write_bytes(SIM_UART, request, sizeof(request));
  esp_err_t drained = uart_wait_tx_done(SIM_UART, pdMS_TO_TICKS(100));
  if (written != sizeof(request) || drained != ESP_OK) return false;

  uint8_t reply[SIM_RESPONSE_LENGTH] = {0};
  size_t received = 0;
  TickType_t deadline = xTaskGetTickCount() + pdMS_TO_TICKS(500);
  while (received < sizeof(reply) && xTaskGetTickCount() < deadline) {
    int count = uart_read_bytes(SIM_UART, reply + received,
                                sizeof(reply) - received, pdMS_TO_TICKS(30));
    if (count > 0) received += (size_t)count;
  }
  if (received != sizeof(reply) || reply[0] != address || reply[1] != 0x03 ||
      reply[2] != SIM_REGISTER_COUNT * 2) return false;
  crc = modbus_crc(reply, sizeof(reply) - 2);
  if (reply[sizeof(reply) - 2] != (uint8_t)crc ||
      reply[sizeof(reply) - 1] != (uint8_t)(crc >> 8)) return false;
  uint16_t regs[SIM_REGISTER_COUNT];
  for (int i = 0; i < SIM_REGISTER_COUNT; ++i) {
    regs[i] = ((uint16_t)reply[3 + i * 2] << 8) | reply[4 + i * 2];
  }
  if (regs[1] != 1 || regs[2] != address || regs[3] != SIM_CHANNELS_PER_MODULE)
    return false;
  sample->address = address;
  sample->firmware_profile = regs[0];
  for (int i = 0; i < SIM_CHANNELS_PER_MODULE; ++i) {
    sample->tenths_celsius[i] = (int16_t)regs[4 + i];
    sample->status[i] = regs[8 + i];
  }
  return true;
}


bool sim_modbus_read(uint8_t address, sim_modbus_sample_t *sample) {
  if (!bus_mutex || xSemaphoreTake(bus_mutex, pdMS_TO_TICKS(3000)) != pdTRUE)
    return false;
  bool ok = read_frame(address, sample);
  xSemaphoreGive(bus_mutex);
  return ok;
}

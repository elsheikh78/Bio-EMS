#include "gsm.h"
#include "gsm_protocol.h"
#include "driver/uart.h"
#include "esp_timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"
#include <stdio.h>
#include <string.h>

#define GSM_UART UART_NUM_2
// UART setup is lazy; only the serial command task calls these entry points.
static SemaphoreHandle_t mutex;
static bool installed;
static bool attempted;

static bool init_locked(void) {
#if CONFIG_BIOEMS_GSM_ENABLED
  if (attempted) return installed;
  attempted = true;
  uart_config_t cfg = {.baud_rate=9600, .data_bits=UART_DATA_8_BITS,
    .parity=UART_PARITY_DISABLE, .stop_bits=UART_STOP_BITS_1,
    .flow_ctrl=UART_HW_FLOWCTRL_DISABLE, .source_clk=UART_SCLK_DEFAULT};
  if (uart_driver_install(GSM_UART, 1024, 0, 0, NULL, 0) != ESP_OK) return false;
  if (uart_param_config(GSM_UART, &cfg) != ESP_OK ||
      uart_set_pin(GSM_UART, CONFIG_BIOEMS_GSM_TX, CONFIG_BIOEMS_GSM_RX,
        UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE) != ESP_OK ||
      uart_set_line_inverse(GSM_UART, CONFIG_BIOEMS_GSM_RX_INVERTED ?
        UART_SIGNAL_RXD_INV : 0) != ESP_OK) {
    uart_driver_delete(GSM_UART); return false;
  }
  installed = true;
  return true;
#else
  return false;
#endif
}
static bool lock(void) {
  // Modem entry points are called ONLY from the serial command task.
  // Lazy allocation therefore cannot race with polling/network tasks.
  if (!mutex) mutex = xSemaphoreCreateMutex();
  return mutex && xSemaphoreTake(mutex, pdMS_TO_TICKS(1000)) == pdTRUE;
}
static bool write_all(const char *data, size_t len) {
  return uart_write_bytes(GSM_UART, data, len) == (int)len &&
    uart_wait_tx_done(GSM_UART, pdMS_TO_TICKS(1000)) == ESP_OK;
}
static bool wait_reply(gsm_response_t *r, int timeout_ms, bool prompt) {
  int64_t deadline = esp_timer_get_time() + (int64_t)timeout_ms * 1000;
  while (esp_timer_get_time() < deadline) {
    char byte;
    if (uart_read_bytes(GSM_UART, &byte, 1, pdMS_TO_TICKS(20)) == 1) {
      gsm_response_feed(r, byte);
      if (r->error) return false;
      if (prompt && r->prompt) return true;
      if (r->ok) return !prompt;
    }
  }
  return false;
}
static bool command(const char *cmd, gsm_response_t *response, int timeout) {
  uart_flush_input(GSM_UART);
  memset(response, 0, sizeof(*response));
  return write_all(cmd, strlen(cmd)) && wait_reply(response, timeout, false);
}
static bool prepare(void) {
  if (!init_locked()) return false;
  gsm_response_t r;
  // ESC cancels an abandoned CMGS editor after an ambiguous previous timeout.
  if (!write_all("\x1b\r", 2)) return false;
  vTaskDelay(pdMS_TO_TICKS(200));
  bool awake=false;
  for (int i=0; i<3 && !awake; i++) awake = command("AT\r", &r, 1000);
  return awake && command("ATE0\r", &r, 1000) &&
    command("AT+CMGF=1\r", &r, 1000) &&
    command("AT+CSCS=\"GSM\"\r", &r, 1000) &&
    command("AT+CNMI=0,0,0,0,0\r", &r, 1000);
}
bool bioems_gsm_diagnostics(void) {
  if (!lock()) return false;
  gsm_response_t r;
  bool ok = prepare() && command("AT+CREG?\r", &r, 2000) && r.registered;
  xSemaphoreGive(mutex);
  printf("GSM: %s\n", ok ? "REGISTERED (home or roaming)" :
    "NOT READY: check power, UART circuit, antenna, SIM/PIN and 2G registration");
  return ok;
}
bool bioems_gsm_sms(const char *phone, const char *message) {
  if (!gsm_phone_valid(phone) || !gsm_message_valid(message) || !lock()) return false;
  gsm_response_t r;
  bool ok = prepare() && command("AT+CREG?\r", &r, 2000) && r.registered;
  if (ok) {
    char cmd[48];
    snprintf(cmd, sizeof(cmd), "AT+CMGS=\"%s\"\r", phone);
    uart_flush_input(GSM_UART);
    memset(&r, 0, sizeof(r));
    ok = write_all(cmd, strlen(cmd)) && wait_reply(&r, 5000, true);
    if (ok) {
      memset(&r, 0, sizeof(r));
      ok = write_all(message, strlen(message)) && write_all("\x1a", 1) &&
        wait_reply(&r, 60000, false) && r.sms_reference;
    }
    // No retry after submission: acceptance may be lost with the serial response.
    if (!ok) write_all("\x1b\r", 2);
  }
  xSemaphoreGive(mutex);
  printf("GSM SMS: %s\n", ok ? "ACCEPTED (delivery not confirmed)" :
    "FAILED OR UNKNOWN (not retried)");
  return ok;
}

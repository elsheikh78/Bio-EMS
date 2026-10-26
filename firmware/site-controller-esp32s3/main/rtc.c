#include "rtc.h"
#include "rtc_codec.h"
#include "driver/i2c_master.h"
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"

static i2c_master_dev_handle_t rtc;
static SemaphoreHandle_t mutex;
static bool read_reg(uint8_t reg, uint8_t *data, size_t len) {
  return i2c_master_transmit_receive(rtc, &reg, 1, data, len, 100) == ESP_OK;
}
static bool write_reg(uint8_t reg, uint8_t value) {
  uint8_t data[] = {reg, value};
  return i2c_master_transmit(rtc, data, sizeof(data), 100) == ESP_OK;
}
bool bioems_rtc_init(void) {
#if CONFIG_BIOEMS_RTC_ENABLED
  i2c_master_bus_config_t config = {.i2c_port=I2C_NUM_0,
    .sda_io_num=CONFIG_BIOEMS_RTC_SDA, .scl_io_num=CONFIG_BIOEMS_RTC_SCL,
    .clk_source=I2C_CLK_SRC_DEFAULT, .glitch_ignore_cnt=7};
  i2c_master_bus_handle_t bus;
  if (i2c_new_master_bus(&config, &bus) != ESP_OK) return false;
  i2c_device_config_t device = {.dev_addr_length=I2C_ADDR_BIT_LEN_7,
    .device_address=0x68, .scl_speed_hz=100000};
  if (i2c_master_bus_add_device(bus, &device, &rtc) != ESP_OK) {
    i2c_del_master_bus(bus); return false;
  }
  mutex = xSemaphoreCreateMutex();
  if (!mutex) { i2c_master_bus_rm_device(rtc); rtc=NULL; i2c_del_master_bus(bus); return false; }
  return true;
#else
  return false;
#endif
}
bool bioems_rtc_read(time_t *epoch) {
  if (!rtc || !mutex || !epoch || xSemaphoreTake(mutex, pdMS_TO_TICKS(500)) != pdTRUE) return false;
  uint8_t before=0, after=0, data[7];
  bool ok = read_reg(0x0f, &before, 1) && !(before & 0x80) &&
    read_reg(0, data, sizeof(data)) && read_reg(0x0f, &after, 1) &&
    !(after & 0x80) && rtc_decode(data, epoch) &&
    *epoch >= (time_t)1760000000 && (int64_t)*epoch < INT64_C(4102444800);
  xSemaphoreGive(mutex);
  return ok;
}
bool bioems_rtc_set(time_t epoch) {
  uint8_t data[8] = {0}, control=0, status=0;
  if (!rtc || !mutex || !rtc_encode(epoch, data+1) ||
      xSemaphoreTake(mutex, pdMS_TO_TICKS(500)) != pdTRUE) return false;
  // Caller invalidates the persisted trust marker before changing date registers.
  bool ok = read_reg(0x0e, &control, 1) && write_reg(0x0e, control & ~0x80) &&
    i2c_master_transmit(rtc, data, sizeof(data), 100) == ESP_OK;
  uint8_t verify[7];
  time_t actual=0;
  ok = ok && read_reg(0, verify, sizeof(verify)) && rtc_decode(verify, &actual) &&
    actual >= epoch && actual <= epoch+1 &&
    read_reg(0x0f, &status, 1) && write_reg(0x0f, status & ~0x80);
  xSemaphoreGive(mutex);
  return ok;
}

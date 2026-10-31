#include "sd_storage.h"
#include "driver/sdspi_host.h"
#include "driver/spi_master.h"
#include "esp_log.h"
#include "esp_vfs_fat.h"
#include "offline_queue.h"
#include "sdmmc_cmd.h"

static sdmmc_card_t *active_card;
static bool bus_started;
bool bioems_sd_mount(void) {
  if (active_card) {
    esp_vfs_fat_sdcard_unmount("/sdcard", active_card);
    active_card = NULL;
  }
  if (bus_started) {
    spi_bus_free(SPI3_HOST);
    bus_started = false;
  }
#if CONFIG_BIOEMS_SD_ENABLED
  // Separate SPI3 bus: W5500 owns SPI2. Do not share its CS or initialize its bus twice.
  spi_bus_config_t bus = {.mosi_io_num = CONFIG_BIOEMS_SD_MOSI,
                          .miso_io_num = CONFIG_BIOEMS_SD_MISO,
                          .sclk_io_num = CONFIG_BIOEMS_SD_SCLK,
                          .quadwp_io_num = -1,
                          .quadhd_io_num = -1,
                          .max_transfer_sz = 4096};
  if (spi_bus_initialize(SPI3_HOST, &bus, SPI_DMA_CH_AUTO) != ESP_OK)
    return false;
  bus_started = true;
  sdmmc_host_t host = SDSPI_HOST_DEFAULT();
  host.slot = SPI3_HOST;
  sdspi_device_config_t slot = SDSPI_DEVICE_CONFIG_DEFAULT();
  slot.host_id = SPI3_HOST;
  slot.gpio_cs = CONFIG_BIOEMS_SD_CS;
  esp_vfs_fat_mount_config_t mount = {
      .format_if_mount_failed = false, .max_files = 4, .allocation_unit_size = 16 * 1024};
  sdmmc_card_t *card = NULL;
  if (esp_vfs_fat_sdspi_mount("/sdcard", &host, &slot, &mount, &card) != ESP_OK) {
    spi_bus_free(SPI3_HOST);
    bus_started = false;
    return false;
  }
  active_card = card;
  return offline_queue_open("/sdcard/bioqueue", CONFIG_BIOEMS_SD_QUEUE_RECORDS);
#else
  return false;
#endif
}

bool bioems_sd_usage(unsigned *percent) {
  uint64_t total = 0, free_bytes = 0;
  if (!active_card || sdmmc_get_status(active_card) != ESP_OK ||
      esp_vfs_fat_info("/sdcard", &total, &free_bytes) != ESP_OK || !total)
    return false;
  *percent = (unsigned)((total - free_bytes) * 100 / total);
  return true;
}

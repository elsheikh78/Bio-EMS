idf_component_register(
  SRCS "main.c" "tls_policy.c" "usb_update.c" "sim_modbus.c" "ethernet.c" "offline_queue.c" "sd_storage.c"
    "rtc.c" "rtc_codec.c" "gsm.c" "gsm_protocol.c"
  INCLUDE_DIRS "."
  REQUIRES app_update mbedtls bootloader_support nvs_flash esp_eth esp_wifi esp_event esp_netif esp_http_client json driver fatfs sdmmc esp_driver_sdspi esp_driver_i2c esp_timer
)

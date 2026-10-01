idf_component_register(
  SRCS "main.c" "sim_modbus.c"
  INCLUDE_DIRS "."
  REQUIRES nvs_flash esp_wifi esp_event esp_netif esp_http_client json driver
)

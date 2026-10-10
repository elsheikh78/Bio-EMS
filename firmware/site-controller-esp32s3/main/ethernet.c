#include "ethernet.h"
#include "driver/spi_master.h"
#include "esp_eth.h"
#include "esp_eth_mac_spi.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "esp_mac.h"
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"
static EventGroupHandle_t events;
static bool started;
static void on_event(void *arg, esp_event_base_t base, int32_t id, void *data) {
  if (base == IP_EVENT && id == IP_EVENT_ETH_GOT_IP) xEventGroupSetBits(events, BIT0);
  if (base == ETH_EVENT && (id == ETHERNET_EVENT_DISCONNECTED || id == ETHERNET_EVENT_STOP)) xEventGroupClearBits(events, BIT0);
}
bool bioems_ethernet_ready(void) { return events && (xEventGroupGetBits(events) & BIT0); }
bool bioems_ethernet_connect(void) {
  if (!started) {
    ESP_ERROR_CHECK(esp_netif_init());
    esp_err_t loop = esp_event_loop_create_default();
    if (loop != ESP_OK && loop != ESP_ERR_INVALID_STATE) return false;
    if (!events) events = xEventGroupCreate();
    spi_bus_config_t bus = {.mosi_io_num=CONFIG_BIOEMS_ETH_MOSI, .miso_io_num=CONFIG_BIOEMS_ETH_MISO,
      .sclk_io_num=CONFIG_BIOEMS_ETH_SCLK, .quadwp_io_num=-1, .quadhd_io_num=-1};
    if (spi_bus_initialize(SPI2_HOST, &bus, SPI_DMA_CH_AUTO) != ESP_OK) return false;
    spi_device_interface_config_t dev = {.mode=0, .clock_speed_hz=10000000, .queue_size=20, .spics_io_num=CONFIG_BIOEMS_ETH_CS};
    eth_w5500_config_t chip = ETH_W5500_DEFAULT_CONFIG(SPI2_HOST, &dev);
    chip.int_gpio_num=-1; chip.poll_period_ms=10;
    eth_mac_config_t mc = ETH_MAC_DEFAULT_CONFIG();
    eth_phy_config_t pc = ETH_PHY_DEFAULT_CONFIG(); pc.reset_gpio_num=-1;
    esp_eth_mac_t *mac = esp_eth_mac_new_w5500(&chip, &mc);
    esp_eth_phy_t *phy = esp_eth_phy_new_w5500(&pc);
    if (!mac || !phy) { if(mac) mac->del(mac); if(phy) phy->del(phy); spi_bus_free(SPI2_HOST); return false; }
    esp_eth_config_t cfg = ETH_DEFAULT_CONFIG(mac, phy);
    esp_eth_handle_t handle;
    if (esp_eth_driver_install(&cfg, &handle) != ESP_OK) {mac->del(mac); phy->del(phy); spi_bus_free(SPI2_HOST); return false;}
    uint8_t addr[6]; ESP_ERROR_CHECK(esp_read_mac(addr, ESP_MAC_WIFI_STA)); addr[0]=(addr[0]|2)&0xfe;
    ESP_ERROR_CHECK(esp_eth_ioctl(handle, ETH_CMD_S_MAC_ADDR, addr));
    esp_netif_config_t nc = ESP_NETIF_DEFAULT_ETH();
    esp_netif_t *netif=esp_netif_new(&nc);
    ESP_ERROR_CHECK(esp_netif_attach(netif, esp_eth_new_netif_glue(handle)));
    ESP_ERROR_CHECK(esp_event_handler_register(ETH_EVENT, ESP_EVENT_ANY_ID, on_event, NULL));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_ETH_GOT_IP, on_event, NULL));
    ESP_ERROR_CHECK(esp_eth_start(handle)); started=true;
  }
  return (xEventGroupWaitBits(events, BIT0, pdFALSE, pdFALSE, pdMS_TO_TICKS(20000)) & BIT0) != 0;
}

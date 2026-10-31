#pragma once
#include <stdbool.h>
bool bioems_ethernet_connect(void);
bool bioems_ethernet_ready(void);

#include "esp_netif.h"
esp_netif_t *bioems_ethernet_netif(void);

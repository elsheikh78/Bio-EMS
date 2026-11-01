#pragma once
#include <stdint.h>
#define GPIO_MODE_INPUT 1
#define CONFIG_BIOEMS_MAINS_GOOD_GPIO 4
#define CONFIG_BIOEMS_BATTERY_LOW_GPIO 5
typedef struct {
  uint64_t pin_bit_mask;
  int mode;
} gpio_config_t;
int gpio_config(const gpio_config_t *cfg);
int gpio_get_level(int pin);

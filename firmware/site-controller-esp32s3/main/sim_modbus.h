#pragma once

#include <stdbool.h>
#include <stdint.h>

// Channel (address - 1) * 4 + probe, with address/probe starting at 1.
#define SIM_MAX_MODULES 4
#define SIM_CHANNELS_PER_MODULE 4

typedef struct {
  uint8_t address;
  uint16_t firmware_profile;
  int16_t tenths_celsius[SIM_CHANNELS_PER_MODULE];
  uint16_t status[SIM_CHANNELS_PER_MODULE];
} sim_modbus_sample_t;

bool sim_modbus_init(void);
bool sim_modbus_read(uint8_t address, sim_modbus_sample_t *sample);

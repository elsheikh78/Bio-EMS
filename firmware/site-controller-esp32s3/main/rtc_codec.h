#pragma once
#include <stdbool.h>
#include <stdint.h>
#include <time.h>

bool rtc_decode(const uint8_t registers[7], time_t *epoch);
bool rtc_encode(time_t epoch, uint8_t registers[7]);

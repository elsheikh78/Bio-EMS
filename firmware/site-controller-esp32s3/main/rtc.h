#pragma once
#include <stdbool.h>
#include <time.h>
bool bioems_rtc_init(void);
bool bioems_rtc_read(time_t *epoch);
bool bioems_rtc_set(time_t epoch);

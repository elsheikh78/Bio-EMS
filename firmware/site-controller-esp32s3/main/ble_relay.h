#pragma once
#include <stdbool.h>
#include <stddef.h>
bool bioems_ble_init(void);
void bioems_ble_enable(bool enabled);
bool bioems_ble_ready(void);
bool bioems_ble_exchange(const char *request, char *response, size_t capacity);

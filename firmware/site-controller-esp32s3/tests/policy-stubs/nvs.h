#pragma once
#include <stddef.h>
#define ESP_OK 0
#define NVS_READONLY 0
#define NVS_READWRITE 1
typedef int nvs_handle_t;
typedef int esp_err_t;
int nvs_open(const char *name, int mode, nvs_handle_t *h);
int nvs_get_str(nvs_handle_t h, const char *key, char *out, size_t *size);
int nvs_set_str(nvs_handle_t h, const char *key, const char *text);
int nvs_commit(nvs_handle_t h);
void nvs_close(nvs_handle_t h);

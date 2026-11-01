#pragma once
#include "cJSON.h"
#include <stdbool.h>
#include <stddef.h>
typedef struct {
  bool ethernet, wifi, bluetooth, offlineStorage, automaticReplay, powerAlarms,
      storageAlarms;
  int storageWarningPercent, revision;
  bool centralBatteryInstalled, hasWifiConfig;
  char ssid[33], password[65];
} runtime_policy_t;
extern runtime_policy_t runtime_policy;
void runtime_policy_init(void);
void runtime_policy_offer(const cJSON *response);
void runtime_policy_confirm(bool via_wifi);
bool runtime_policy_requires_wifi_test(void);
bool runtime_policy_wifi_credentials(char *ssid, size_t ssid_size,
                                     char *password, size_t password_size);
void runtime_policy_check_rollback(void);
void runtime_power_read(cJSON *health);
int runtime_policy_applied_revision(void);
const char *runtime_policy_error(void);

bool runtime_policy_wifi_enabled(void);

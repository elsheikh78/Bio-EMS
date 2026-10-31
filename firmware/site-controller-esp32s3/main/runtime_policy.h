#pragma once
#include "cJSON.h"
#include <stdbool.h>
typedef struct {
  bool ethernet,wifi,bluetooth,offlineStorage,automaticReplay,powerAlarms,storageAlarms;
  int storageWarningPercent, revision;
} runtime_policy_t;
extern runtime_policy_t runtime_policy;
void runtime_policy_init(void);
void runtime_policy_offer(const cJSON *response);
void runtime_policy_confirm(void);
void runtime_policy_check_rollback(void);
void runtime_power_read(cJSON *health);
int runtime_policy_applied_revision(void);
const char *runtime_policy_error(void);

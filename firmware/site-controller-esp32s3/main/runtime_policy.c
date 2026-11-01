#include "runtime_policy.h"
#include "driver/gpio.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "nvs.h"
#include <stdatomic.h>
#include <stdlib.h>
#include <string.h>
static atomic_bool wifi_enabled = true;
bool runtime_policy_wifi_enabled(void) { return atomic_load(&wifi_enabled); }
runtime_policy_t runtime_policy = {.ethernet = true,
                                   .wifi = true,
                                   .bluetooth = true,
                                   .offlineStorage = true,
                                   .automaticReplay = true,
                                   .powerAlarms = true,
                                   .storageAlarms = true,
                                   .storageWarningPercent = 80};
static runtime_policy_t committed;
static char candidate_json[1024];
static bool pending;
static int rejected_revision;
static int64_t offered_at;
static bool parse(const cJSON *root, runtime_policy_t *out) {
  const cJSON *p = cJSON_GetObjectItem(root, "policy"),
              *r = cJSON_GetObjectItem(root, "revision");
  if (!cJSON_IsObject(p) || !cJSON_IsNumber(r) || r->valueint < 0 ||
      r->valuedouble != r->valueint)
    return false;
  runtime_policy_t value = {0};
  value.revision = r->valueint;
  const char *names[] = {
      "ethernet",        "wifi",        "bluetooth",    "offlineStorage",
      "automaticReplay", "powerAlarms", "storageAlarms"};
  bool *fields[] = {&value.ethernet,        &value.wifi,
                    &value.bluetooth,       &value.offlineStorage,
                    &value.automaticReplay, &value.powerAlarms,
                    &value.storageAlarms};
  for (int i = 0; i < 7; i++) {
    const cJSON *v = cJSON_GetObjectItem(p, names[i]);
    if (!cJSON_IsBool(v))
      return false;
    *fields[i] = cJSON_IsTrue(v);
  }
  const cJSON *percent = cJSON_GetObjectItem(p, "storageWarningPercent");
  if (!cJSON_IsNumber(percent) || percent->valueint < 50 ||
      percent->valueint > 95)
    return false;
  value.storageWarningPercent = percent->valueint;
  if (!(value.ethernet || value.wifi || value.bluetooth) ||
      (value.automaticReplay && !value.offlineStorage))
    return false;
  const cJSON *battery = cJSON_GetObjectItem(p, "centralBatteryInstalled");
  if (battery && !cJSON_IsBool(battery))
    return false;
  value.centralBatteryInstalled = cJSON_IsTrue(battery);
  const cJSON *wifi = cJSON_GetObjectItem(root, "wifiConfig");
  if (wifi) {
    const cJSON *ssid = cJSON_GetObjectItem(wifi, "ssid"),
                *password = cJSON_GetObjectItem(wifi, "password");
    if (!cJSON_IsString(ssid) || !cJSON_IsString(password) ||
        !strlen(ssid->valuestring) || strlen(ssid->valuestring) > 32 ||
        strlen(password->valuestring) < 8 || strlen(password->valuestring) > 63)
      return false;
    value.hasWifiConfig = true;
    strlcpy(value.ssid, ssid->valuestring, sizeof(value.ssid));
    strlcpy(value.password, password->valuestring, sizeof(value.password));
  }
  *out = value;
  return true;
}
void runtime_policy_init(void) {
  runtime_policy = (runtime_policy_t){.ethernet = true,
                                      .wifi = true,
                                      .bluetooth = true,
                                      .offlineStorage = true,
                                      .automaticReplay = true,
                                      .powerAlarms = true,
                                      .storageAlarms = true,
                                      .storageWarningPercent = 80};
  pending = false;
  rejected_revision = 0;
  char raw[1024];
  size_t size = sizeof(raw);
  nvs_handle_t h;
  if (nvs_open("bioems", NVS_READONLY, &h) == ESP_OK) {
    if (nvs_get_str(h, "runtime_policy", raw, &size) == ESP_OK) {
      cJSON *root = cJSON_Parse(raw),
            *binding = cJSON_GetObjectItem(root, "binding");
      char current[40];
      size_t n = sizeof(current);
      if (cJSON_IsString(binding) &&
          nvs_get_str(h, "binding_id", current, &n) == ESP_OK &&
          !strcmp(current, binding->valuestring))
        parse(root, &runtime_policy);
      cJSON_Delete(root);
    }
    nvs_close(h);
  }
  committed = runtime_policy;
  atomic_store(&wifi_enabled, runtime_policy.wifi);
  int pins[] = {CONFIG_BIOEMS_MAINS_GOOD_GPIO, CONFIG_BIOEMS_BATTERY_LOW_GPIO};
  for (int i = 0; i < 2; i++)
    if (pins[i] >= 0) {
      gpio_config_t cfg = {.pin_bit_mask = 1ULL << pins[i],
                           .mode = GPIO_MODE_INPUT};
      gpio_config(&cfg);
    }
}
void runtime_policy_offer(const cJSON *response) {
  runtime_policy_t next;
  if (!parse(response, &next) || next.revision <= committed.revision ||
      next.revision == rejected_revision ||
      (pending && next.revision == runtime_policy.revision))
    return;
  cJSON *envelope = cJSON_CreateObject();
  nvs_handle_t h;
  char binding[40];
  size_t size = sizeof(binding);
  if (nvs_open("bioems", NVS_READONLY, &h) != ESP_OK) {
    cJSON_Delete(envelope);
    return;
  }
  esp_err_t found = nvs_get_str(h, "binding_id", binding, &size);
  nvs_close(h);
  if (found != ESP_OK) {
    cJSON_Delete(envelope);
    return;
  }
  cJSON_AddStringToObject(envelope, "binding", binding);
  cJSON_AddNumberToObject(envelope, "revision", next.revision);
  cJSON_AddItemToObject(
      envelope, "policy",
      cJSON_Duplicate(cJSON_GetObjectItem(response, "policy"), true));
  const cJSON *wifi = cJSON_GetObjectItem(response, "wifiConfig");
  if (wifi)
    cJSON_AddItemToObject(envelope, "wifiConfig", cJSON_Duplicate(wifi, true));
  char *json = cJSON_PrintUnformatted(envelope);
  if (json && strlen(json) < sizeof(candidate_json)) {
    strcpy(candidate_json, json);
    runtime_policy = next;
    atomic_store(&wifi_enabled, next.wifi);
    pending = true;
    offered_at = esp_timer_get_time();
  }
  free(json);
  cJSON_Delete(envelope);
}
bool runtime_policy_wifi_credentials(char *ssid, size_t ssid_size,
                                     char *password, size_t password_size) {
  if (!runtime_policy.hasWifiConfig)
    return false;
  strlcpy(ssid, runtime_policy.ssid, ssid_size);
  strlcpy(password, runtime_policy.password, password_size);
  return true;
}
bool runtime_policy_requires_wifi_test(void) {
  return pending && runtime_policy.wifi &&
         (!committed.wifi ||
          (runtime_policy.hasWifiConfig &&
           (!committed.hasWifiConfig ||
            strcmp(runtime_policy.ssid, committed.ssid) ||
            strcmp(runtime_policy.password, committed.password))));
}
void runtime_policy_confirm(bool via_wifi) {
  // Called only after a subsequent authenticated exchange using the candidate
  // paths.
  if (!pending || (runtime_policy_requires_wifi_test() && !via_wifi))
    return;
  nvs_handle_t h;
  if (nvs_open("bioems", NVS_READWRITE, &h) != ESP_OK)
    return;
  if (nvs_set_str(h, "runtime_policy", candidate_json) == ESP_OK &&
      nvs_commit(h) == ESP_OK) {
    committed = runtime_policy;
    rejected_revision = 0;
    pending = false;
  }
  nvs_close(h);
}
void runtime_policy_check_rollback(void) {
  if (pending && esp_timer_get_time() - offered_at > 60000000) {
    rejected_revision = runtime_policy.revision;
    runtime_policy = committed;
    atomic_store(&wifi_enabled, committed.wifi);
    pending = false;
    ESP_LOGE("policy", "POLICY_ROLLED_BACK: candidate did not confirm a "
                       "working path in 60 seconds");
  }
}
int runtime_policy_applied_revision(void) { return committed.revision; }
const char *runtime_policy_error(void) {
  return rejected_revision ? "POLICY_ROLLED_BACK" : NULL;
}
static void input(cJSON *root, const char *name, int pin) {
  if (pin < 0) {
    cJSON_AddNullToObject(root, name);
    return;
  }
  bool value = gpio_get_level(pin) != 0;
#ifdef CONFIG_BIOEMS_POWER_INPUT_ACTIVE_LOW
  value = !value;
#endif
  cJSON_AddBoolToObject(root, name, value);
}
void runtime_power_read(cJSON *health) {
  if (!runtime_policy.centralBatteryInstalled) {
    cJSON_AddNullToObject(health, "mains");
    cJSON_AddNullToObject(health, "batteryLow");
    return;
  }
  input(health, "mains", CONFIG_BIOEMS_MAINS_GOOD_GPIO);
  input(health, "batteryLow", CONFIG_BIOEMS_BATTERY_LOW_GPIO);
}

// Host tests exercise the actual runtime policy implementation with
// NVS/GPIO/time substitutes.
#include <assert.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
static size_t strlcpy(char *dst, const char *src, size_t n) {
  size_t len = strlen(src);
  if (n) {
    size_t k = len < n - 1 ? len : n - 1;
    memcpy(dst, src, k);
    dst[k] = 0;
  }
  return len;
}
#include "../main/runtime_policy.c"
static int64_t now;
static char saved[1200], staged[1200];
static const char *uid = "11111111-1111-4111-8111-111111111111";
static bool fail_commit;
int64_t esp_timer_get_time(void) { return now; }
int gpio_config(const gpio_config_t *cfg) {
  (void)cfg;
  return 0;
}
int gpio_get_level(int pin) { return pin == 4 ? 0 : 1; }
int nvs_open(const char *name, int mode, nvs_handle_t *h) {
  (void)name;
  (void)mode;
  *h = 1;
  return 0;
}
void nvs_close(nvs_handle_t h) { (void)h; }
int nvs_get_str(nvs_handle_t h, const char *key, char *out, size_t *size) {
  (void)h;
  const char *s = !strcmp(key, "binding_id")       ? uid
                  : !strcmp(key, "runtime_policy") ? saved
                                                   : "";
  if (!*s || strlen(s) + 1 > *size)
    return -1;
  strcpy(out, s);
  *size = strlen(s) + 1;
  return 0;
}
int nvs_set_str(nvs_handle_t h, const char *key, const char *s) {
  (void)h;
  (void)key;
  strlcpy(staged, s, sizeof(staged));
  return 0;
}
int nvs_commit(nvs_handle_t h) {
  (void)h;
  if (fail_commit)
    return -1;
  strcpy(saved, staged);
  return 0;
}
static cJSON *offer(int revision, bool battery, const char *ssid) {
  cJSON *root = cJSON_CreateObject(),
        *p = cJSON_AddObjectToObject(root, "policy");
  cJSON_AddNumberToObject(root, "revision", revision);
  const char *names[] = {
      "ethernet",        "wifi",        "bluetooth",    "offlineStorage",
      "automaticReplay", "powerAlarms", "storageAlarms"};
  for (int i = 0; i < 7; i++)
    cJSON_AddBoolToObject(p, names[i], true);
  cJSON_AddBoolToObject(p, "centralBatteryInstalled", battery);
  cJSON_AddNumberToObject(p, "storageWarningPercent", 80);
  if (ssid) {
    cJSON *w = cJSON_AddObjectToObject(root, "wifiConfig");
    cJSON_AddStringToObject(w, "ssid", ssid);
    cJSON_AddStringToObject(w, "password", "secret123");
  }
  runtime_policy_offer(root);
  return root;
}
int main(void) {
  runtime_policy_init();
  assert(!runtime_policy.centralBatteryInstalled);
  cJSON *health = cJSON_CreateObject();
  runtime_power_read(health);
  assert(cJSON_IsNull(cJSON_GetObjectItem(health, "batteryLow")));
  cJSON_Delete(health);
  cJSON *first = offer(1, true, "New Office");
  assert(runtime_policy_requires_wifi_test());
  assert(runtime_policy.revision == 1 &&
         runtime_policy_applied_revision() == 0);
  runtime_policy_confirm(false);
  assert(runtime_policy_applied_revision() == 0 && !saved[0]);
  now = 60000001;
  runtime_policy_check_rollback();
  assert(runtime_policy.revision == 0);
  assert(!strcmp(runtime_policy_error(), "POLICY_ROLLED_BACK"));
  runtime_policy_offer(first);
  assert(runtime_policy.revision == 0);
  cJSON_Delete(first);
  cJSON *second = offer(2, true, "New Office");
  runtime_policy_confirm(true);
  cJSON_Delete(second);
  assert(runtime_policy_applied_revision() == 2 && !runtime_policy_error());
  runtime_policy_init();
  char ssid[33], password[65];
  assert(runtime_policy_wifi_credentials(ssid, sizeof(ssid), password,
                                         sizeof(password)));
  assert(!strcmp(ssid, "New Office") && runtime_policy.centralBatteryInstalled);
  health = cJSON_CreateObject();
  runtime_power_read(health);
  assert(cJSON_IsTrue(cJSON_GetObjectItem(health, "batteryLow")));
  cJSON_Delete(health);
  cJSON *third = offer(3, false, "New Office");
  assert(!runtime_policy_requires_wifi_test());
  fail_commit = true;
  runtime_policy_confirm(false);
  assert(runtime_policy_applied_revision() == 2);
  fail_commit = false;
  runtime_policy_confirm(false);
  assert(runtime_policy_applied_revision() == 3);
  cJSON_Delete(third);
  runtime_policy_init();
  assert(!runtime_policy.centralBatteryInstalled);
  uid = "22222222-2222-4222-8222-222222222222";
  runtime_policy_init();
  assert(!runtime_policy.hasWifiConfig &&
         runtime_policy_applied_revision() == 0);
  puts("runtime policy trial, rollback, commit, binding isolation and optional "
       "battery: PASS");
}

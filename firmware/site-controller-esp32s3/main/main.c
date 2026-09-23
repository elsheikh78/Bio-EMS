#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "cJSON.h"
#include "esp_event.h"
#include "esp_http_client.h"
#include "esp_log.h"
#include "esp_mac.h"
#include "esp_netif.h"
#include "esp_wifi.h"
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"
#include "nvs.h"
#include "nvs_flash.h"

#include "bioems_version.h"

#define WIFI_CONNECTED_BIT BIT0
#define WIFI_FAILED_BIT BIT1
#define MAX_LINE 256
#define MAX_URL 192
#define MAX_NVS_TEXT 192

static const char *TAG = "bioems";
static EventGroupHandle_t wifi_events;
static int wifi_retry_count;

typedef struct {
  char *data;
  size_t length;
  size_t capacity;
} http_buffer_t;

static esp_err_t nvs_set_text(const char *key, const char *value) {
  nvs_handle_t handle;
  esp_err_t err = nvs_open("bioems", NVS_READWRITE, &handle);
  if (err != ESP_OK) return err;
  err = nvs_set_str(handle, key, value);
  if (err == ESP_OK) err = nvs_commit(handle);
  nvs_close(handle);
  return err;
}

static bool nvs_get_text(const char *key, char *buffer, size_t size) {
  nvs_handle_t handle;
  if (nvs_open("bioems", NVS_READONLY, &handle) != ESP_OK) return false;
  size_t required = size;
  esp_err_t err = nvs_get_str(handle, key, buffer, &required);
  nvs_close(handle);
  return err == ESP_OK;
}

static void hardware_uid(char out[33]) {
  uint8_t mac[6];
  ESP_ERROR_CHECK(esp_read_mac(mac, ESP_MAC_WIFI_STA));
  snprintf(
      out,
      33,
      "%02X%02X%02X%02X%02X%02X",
      mac[0],
      mac[1],
      mac[2],
      mac[3],
      mac[4],
      mac[5]);
}

static void wifi_event_handler(
    void *arg,
    esp_event_base_t event_base,
    int32_t event_id,
    void *event_data) {
  (void)arg;
  (void)event_data;
  if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
    esp_wifi_connect();
    return;
  }
  if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
    if (wifi_retry_count < 5) {
      wifi_retry_count++;
      esp_wifi_connect();
    } else {
      xEventGroupSetBits(wifi_events, WIFI_FAILED_BIT);
    }
    return;
  }
  if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
    wifi_retry_count = 0;
    xEventGroupSetBits(wifi_events, WIFI_CONNECTED_BIT);
  }
}

static bool connect_wifi(void) {
  char ssid[33] = {0};
  char password[65] = {0};
  if (!nvs_get_text("wifi_ssid", ssid, sizeof(ssid))) {
    printf("wifi not configured; use: setwifi <ssid> <password>\n");
    return false;
  }
  nvs_get_text("wifi_pass", password, sizeof(password));

  wifi_events = xEventGroupCreate();
  ESP_ERROR_CHECK(esp_netif_init());
  esp_err_t loop_result = esp_event_loop_create_default();
  if (loop_result != ESP_OK && loop_result != ESP_ERR_INVALID_STATE) {
    ESP_ERROR_CHECK(loop_result);
  }
  esp_netif_create_default_wifi_sta();

  wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
  ESP_ERROR_CHECK(esp_wifi_init(&cfg));
  ESP_ERROR_CHECK(
      esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &wifi_event_handler, NULL));
  ESP_ERROR_CHECK(
      esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &wifi_event_handler, NULL));

  wifi_config_t wifi_config = {0};
  strlcpy((char *)wifi_config.sta.ssid, ssid, sizeof(wifi_config.sta.ssid));
  strlcpy((char *)wifi_config.sta.password, password, sizeof(wifi_config.sta.password));
  wifi_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;

  ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
  ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
  ESP_ERROR_CHECK(esp_wifi_start());

  EventBits_t bits = xEventGroupWaitBits(
      wifi_events,
      WIFI_CONNECTED_BIT | WIFI_FAILED_BIT,
      pdFALSE,
      pdFALSE,
      pdMS_TO_TICKS(20000));
  return (bits & WIFI_CONNECTED_BIT) != 0;
}

static esp_err_t http_event(esp_http_client_event_t *event) {
  http_buffer_t *buffer = (http_buffer_t *)event->user_data;
  if (event->event_id != HTTP_EVENT_ON_DATA || !buffer || event->data_len <= 0) {
    return ESP_OK;
  }

  size_t required = buffer->length + (size_t)event->data_len + 1;
  if (required > buffer->capacity) {
    size_t next = required + 512;
    char *resized = realloc(buffer->data, next);
    if (!resized) return ESP_ERR_NO_MEM;
    buffer->data = resized;
    buffer->capacity = next;
  }

  memcpy(buffer->data + buffer->length, event->data, event->data_len);
  buffer->length += event->data_len;
  buffer->data[buffer->length] = '\0';
  return ESP_OK;
}

static bool valid_pairing_code(const char *code) {
  if (!code || strlen(code) != 12) return false;
  for (size_t i = 0; i < 12; i++) {
    if (!isdigit((unsigned char)code[i])) return false;
  }
  return true;
}

static bool persist_pairing_response(const char *body) {
  cJSON *root = cJSON_Parse(body);
  if (!root) return false;

  const cJSON *binding = cJSON_GetObjectItemCaseSensitive(root, "platform_binding_id");
  const cJSON *installation = cJSON_GetObjectItemCaseSensitive(root, "installation_id");
  const cJSON *device = cJSON_GetObjectItemCaseSensitive(root, "device_id");
  const cJSON *site = cJSON_GetObjectItemCaseSensitive(root, "site_code");
  const cJSON *mqtt = cJSON_GetObjectItemCaseSensitive(root, "mqtt");
  const cJSON *telemetry =
      mqtt ? cJSON_GetObjectItemCaseSensitive(mqtt, "telemetry_topic") : NULL;
  const cJSON *heartbeat =
      mqtt ? cJSON_GetObjectItemCaseSensitive(mqtt, "heartbeat_topic") : NULL;
  const cJSON *configuration = cJSON_GetObjectItemCaseSensitive(root, "configuration");
  const cJSON *revision =
      configuration ? cJSON_GetObjectItemCaseSensitive(configuration, "revision") : NULL;
  const cJSON *checksum =
      configuration ? cJSON_GetObjectItemCaseSensitive(configuration, "checksum") : NULL;

  bool valid =
      cJSON_IsString(binding) && cJSON_IsString(installation) && cJSON_IsString(device) &&
      cJSON_IsString(site) && cJSON_IsString(telemetry) && cJSON_IsString(heartbeat) &&
      cJSON_IsNumber(revision) && cJSON_IsString(checksum);

  if (valid) {
    char revision_text[16];
    snprintf(revision_text, sizeof(revision_text), "%d", revision->valueint);
    valid =
        nvs_set_text("binding_id", binding->valuestring) == ESP_OK &&
        nvs_set_text("install_id", installation->valuestring) == ESP_OK &&
        nvs_set_text("device_id", device->valuestring) == ESP_OK &&
        nvs_set_text("site_code", site->valuestring) == ESP_OK &&
        nvs_set_text("tele_topic", telemetry->valuestring) == ESP_OK &&
        nvs_set_text("heart_topic", heartbeat->valuestring) == ESP_OK &&
        nvs_set_text("config_rev", revision_text) == ESP_OK &&
        nvs_set_text("config_sha", checksum->valuestring) == ESP_OK &&
        nvs_set_text("bind_schema", "1") == ESP_OK;
  }

  cJSON_Delete(root);
  return valid;
}

static bool claim_pairing(const char *code) {
  if (!valid_pairing_code(code)) {
    printf("pairing code must contain exactly 12 digits\n");
    return false;
  }

  char base_url[MAX_URL] = {0};
  if (!nvs_get_text("platform_url", base_url, sizeof(base_url))) {
    printf("platform url not configured; use: setplatform <https://host:port>\n");
    return false;
  }

  if (!connect_wifi()) {
    printf("wifi connection failed\n");
    return false;
  }

  char uid[33];
  hardware_uid(uid);

  cJSON *payload = cJSON_CreateObject();
  cJSON_AddStringToObject(payload, "pairing_code", code);
  cJSON_AddStringToObject(payload, "hardware_uid", uid);
  cJSON_AddStringToObject(payload, "firmware_version", BIOEMS_FIRMWARE_VERSION);
  cJSON_AddStringToObject(payload, "protocol_version", BIOEMS_PROTOCOL_VERSION);
  cJSON_AddNumberToObject(payload, "binding_schema_version", BIOEMS_BINDING_SCHEMA_VERSION);
  char *json = cJSON_PrintUnformatted(payload);

  char url[MAX_URL + 48];
  snprintf(url, sizeof(url), "%s/api/v1/device-pairing/claim", base_url);

  http_buffer_t response = {0};
  esp_http_client_config_t config = {
      .url = url,
      .event_handler = http_event,
      .user_data = &response,
      .timeout_ms = 15000,
      /*
       * Pilot-only compatibility with the current customer-local TLS deployment.
       * Production firmware must replace this with BIO-EMS CA validation + mTLS.
       */
      .skip_cert_common_name_check = true,
  };
  esp_http_client_handle_t client = esp_http_client_init(&config);
  esp_http_client_set_method(client, HTTP_METHOD_POST);
  esp_http_client_set_header(client, "Content-Type", "application/json");
  esp_http_client_set_post_field(client, json, (int)strlen(json));

  esp_err_t result = esp_http_client_perform(client);
  int status = result == ESP_OK ? esp_http_client_get_status_code(client) : 0;

  bool paired = false;
  if (result == ESP_OK && status == 201 && response.data) {
    paired = persist_pairing_response(response.data);
  } else {
    printf(
        "pairing rejected: transport=%s status=%d response=%s\n",
        esp_err_to_name(result),
        status,
        response.data ? response.data : "");
  }

  esp_http_client_cleanup(client);
  cJSON_free(json);
  cJSON_Delete(payload);
  free(response.data);

  if (paired) {
    printf("pairing successful; pairing code was not stored\n");
  } else if (status == 201) {
    printf("pairing response could not be persisted\n");
  }
  return paired;
}

static void print_status(void) {
  char uid[33];
  hardware_uid(uid);
  char binding[MAX_NVS_TEXT] = {0};
  char installation[MAX_NVS_TEXT] = {0};
  char device[MAX_NVS_TEXT] = {0};
  char site[MAX_NVS_TEXT] = {0};
  bool paired = nvs_get_text("binding_id", binding, sizeof(binding));

  printf("BIO-EMS Site Controller\n");
  printf("  model: %s\n", BIOEMS_CONTROLLER_MODEL);
  printf("  firmware: %s\n", BIOEMS_FIRMWARE_VERSION);
  printf("  protocol: %s\n", BIOEMS_PROTOCOL_VERSION);
  printf("  binding-schema: %d\n", BIOEMS_BINDING_SCHEMA_VERSION);
  printf("  hardware-uid: %s\n", uid);
  printf("  state: %s\n", paired ? "PAIRED" : "PAIRING_MODE");

  if (paired) {
    nvs_get_text("install_id", installation, sizeof(installation));
    nvs_get_text("device_id", device, sizeof(device));
    nvs_get_text("site_code", site, sizeof(site));
    printf("  platform-binding-id: %s\n", binding);
    printf("  installation-id: %s\n", installation);
    printf("  device-id: %s\n", device);
    printf("  site-code: %s\n", site);
  }
}

static void clear_binding(void) {
  nvs_handle_t handle;
  if (nvs_open("bioems", NVS_READWRITE, &handle) != ESP_OK) return;
  const char *keys[] = {
      "binding_id",
      "install_id",
      "device_id",
      "site_code",
      "tele_topic",
      "heart_topic",
      "config_rev",
      "config_sha",
      "bind_schema",
  };
  for (size_t i = 0; i < sizeof(keys) / sizeof(keys[0]); i++) {
    nvs_erase_key(handle, keys[i]);
  }
  nvs_commit(handle);
  nvs_close(handle);
  printf("local binding cleared; backend binding must be revoked separately by System Owner\n");
}

static void command_loop(void) {
  char line[MAX_LINE];
  printf("commands: status | setwifi <ssid> <password> | setplatform <url> | pair <12-digit-code> | clearbinding\n");

  while (true) {
    printf("bioems> ");
    fflush(stdout);
    if (!fgets(line, sizeof(line), stdin)) {
      vTaskDelay(pdMS_TO_TICKS(250));
      continue;
    }
    line[strcspn(line, "\r\n")] = '\0';

    if (strcmp(line, "status") == 0) {
      print_status();
      continue;
    }
    if (strcmp(line, "clearbinding") == 0) {
      clear_binding();
      continue;
    }
    if (strncmp(line, "setwifi ", 8) == 0) {
      char *ssid = strtok(line + 8, " ");
      char *password = strtok(NULL, "");
      if (!ssid || !password) {
        printf("usage: setwifi <ssid> <password>\n");
        continue;
      }
      if (nvs_set_text("wifi_ssid", ssid) == ESP_OK &&
          nvs_set_text("wifi_pass", password) == ESP_OK) {
        printf("wifi configuration saved\n");
      }
      continue;
    }
    if (strncmp(line, "setplatform ", 12) == 0) {
      const char *url = line + 12;
      if (strlen(url) == 0 || strlen(url) >= MAX_URL) {
        printf("invalid platform url\n");
        continue;
      }
      if (nvs_set_text("platform_url", url) == ESP_OK) {
        printf("platform url saved\n");
      }
      continue;
    }
    if (strncmp(line, "pair ", 5) == 0) {
      claim_pairing(line + 5);
      continue;
    }

    printf("unknown command\n");
  }
}

void app_main(void) {
  esp_err_t nvs_result = nvs_flash_init();
  if (nvs_result == ESP_ERR_NVS_NO_FREE_PAGES ||
      nvs_result == ESP_ERR_NVS_NEW_VERSION_FOUND) {
    ESP_ERROR_CHECK(nvs_flash_erase());
    ESP_ERROR_CHECK(nvs_flash_init());
  } else {
    ESP_ERROR_CHECK(nvs_result);
  }

  ESP_LOGI(TAG, "BIO-EMS Site Controller boot");
  print_status();
  command_loop();
}

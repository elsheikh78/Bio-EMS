#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/time.h>
#include <time.h>

#include "cJSON.h"
#include "esp_event.h"
#include "esp_secure_boot.h"
#include "esp_flash_encrypt.h"
#include "tls_policy.h"
#include "usb_update.h"
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
#include "sim_modbus.h"
#include "ethernet.h"
#include "offline_queue.h"
#include "sd_storage.h"
#include "rtc.h"
#include "gsm.h"
#include "ble_relay.h"
#include "relay_crypto.h"
#include "runtime_policy.h"
#include "esp_random.h"
#include "esp_timer.h"
#include <net/if.h>
#include "freertos/semphr.h"
#include <strings.h>
#include <stdatomic.h>

#define WIFI_CONNECTED_BIT BIT0
#define WIFI_FAILED_BIT BIT1
#define MAX_LINE 256
#define MAX_URL 192
#define MAX_NVS_TEXT 192
#define MAX_CA_PEM 4096

static atomic_bool clock_trusted;
static atomic_bool server_time_synced;
static SemaphoreHandle_t clock_mutex;
static bool rtc_ready;
static bool storage_ready;
static atomic_uint queued_records;
static char ca_pem[MAX_CA_PEM];
static size_t ca_base64_length;

static const char *TAG = "bioems";
static EventGroupHandle_t wifi_events;
static int wifi_retry_count;
static esp_netif_t *wifi_netif;
static const char *active_transport="offline";

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

// Only USB provisioning or an authenticated HTTPS response may initialise RTC trust.
// Persist invalidation BEFORE a date write so power loss cannot trust partial registers.
static bool sync_clock(time_t epoch) {
  if (!clock_mutex || xSemaphoreTake(clock_mutex, pdMS_TO_TICKS(1500)) != pdTRUE) return false;
  struct timeval utc = {.tv_sec=epoch, .tv_usec=0};
  bool ok = settimeofday(&utc, NULL) == 0;
  if (ok) {
    atomic_store(&clock_trusted, true);
    if (rtc_ready) {
      bool saved = nvs_set_text("rtc_valid", "0") == ESP_OK && bioems_rtc_set(epoch) &&
        nvs_set_text("rtc_valid", "1") == ESP_OK;
      if (!saved) ESP_LOGW(TAG, "RTC_WRITE_FAILED: current boot time valid, battery restore not trusted");
    }
  }
  xSemaphoreGive(clock_mutex);
  return ok;
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
    xEventGroupClearBits(wifi_events, WIFI_CONNECTED_BIT);
    if (!runtime_policy.wifi) return;
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

static bool ethernet_selected(void) {
  char mode[16] = {0};
  return nvs_get_text("network_mode", mode, sizeof(mode)) && strcmp(mode, "ethernet") == 0;
}
static bool network_started;
static bool connect_wifi(void) {
  char ssid[33] = {0};
  char password[65] = {0};
  if (!nvs_get_text("wifi_ssid", ssid, sizeof(ssid))) {
    printf("wifi not configured; use: setwifi <ssid> <password>\n");
    return false;
  }
  nvs_get_text("wifi_pass", password, sizeof(password));

  if (wifi_events) {
    if(xEventGroupGetBits(wifi_events)&WIFI_CONNECTED_BIT)return true;
    esp_wifi_connect();
    return (xEventGroupWaitBits(wifi_events, WIFI_CONNECTED_BIT, pdFALSE, pdFALSE,
      pdMS_TO_TICKS(100)) & WIFI_CONNECTED_BIT) != 0;
  }
  wifi_events = xEventGroupCreate();
  /* shared network stack initialized at boot */
  esp_err_t loop_result = esp_event_loop_create_default();
  if (loop_result != ESP_OK && loop_result != ESP_ERR_INVALID_STATE) {
    ESP_ERROR_CHECK(loop_result);
  }
  wifi_netif=esp_netif_create_default_wifi_sta();

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
      pdMS_TO_TICKS(100));
  return (bits & WIFI_CONNECTED_BIT) != 0;
}

static bool connect_network(void) {
  network_started = true;
  if(!runtime_policy.wifi&&wifi_events&&(xEventGroupGetBits(wifi_events)&WIFI_CONNECTED_BIT))esp_wifi_disconnect();
  bool eth=runtime_policy.ethernet&&bioems_ethernet_connect();
  bool wifi=runtime_policy.wifi&&connect_wifi();
  return eth||wifi||(runtime_policy.bluetooth&&bioems_ble_ready());
}
static bool network_ready(void) {
  return (runtime_policy.ethernet&&bioems_ethernet_ready()) ||
    (runtime_policy.wifi&&wifi_events&&(xEventGroupGetBits(wifi_events)&WIFI_CONNECTED_BIT)) ||
    (runtime_policy.bluetooth&&bioems_ble_ready());
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
  const cJSON *telemetry_token = cJSON_GetObjectItemCaseSensitive(root, "telemetry_token");
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
  const cJSON *configured_device =
      configuration ? cJSON_GetObjectItemCaseSensitive(configuration, "device") : NULL;
  const cJSON *sim_modules = configured_device
      ? cJSON_GetObjectItemCaseSensitive(configured_device, "simModules") : NULL;
  const cJSON *mappings = configured_device
      ? cJSON_GetObjectItemCaseSensitive(configured_device, "mappings") : NULL;

  bool valid =
      cJSON_IsString(binding) && cJSON_IsString(installation) && cJSON_IsString(device) &&
      cJSON_IsString(site) && cJSON_IsString(telemetry) && cJSON_IsString(heartbeat) &&
      cJSON_IsNumber(revision) && cJSON_IsString(checksum);
  valid = valid && cJSON_IsString(telemetry_token) &&
          strlen(telemetry_token->valuestring) == 64;
  if (sim_modules && (!cJSON_IsNumber(sim_modules) ||
                      sim_modules->valuedouble != sim_modules->valueint ||
                      sim_modules->valueint < 1 ||
                      sim_modules->valueint > SIM_MAX_MODULES)) valid = false;
  uint32_t mapped_mask = 0;
  if (sim_modules) {
    if (!cJSON_IsArray(mappings)) valid = false;
    const cJSON *mapping = NULL;
    cJSON_ArrayForEach(mapping, mappings) {
      const cJSON *channel = cJSON_GetObjectItemCaseSensitive(mapping, "channel");
      if (!cJSON_IsNumber(channel) || channel->valuedouble != channel->valueint ||
          channel->valueint < 1 || channel->valueint > sim_modules->valueint * 4)
        valid = false;
      else mapped_mask |= 1u << (channel->valueint - 1);
    }
  }

  if (valid) {
    char revision_text[16];
    snprintf(revision_text, sizeof(revision_text), "%d", revision->valueint);
    char module_count[2];
    char channel_mask[9];
    snprintf(module_count, sizeof(module_count), "%d", sim_modules ? sim_modules->valueint : 0);
    snprintf(channel_mask, sizeof(channel_mask), "%08lx", (unsigned long)mapped_mask);
    valid =
        nvs_set_text("binding_id", binding->valuestring) == ESP_OK &&
        nvs_set_text("tele_token", telemetry_token->valuestring) == ESP_OK &&
        nvs_set_text("install_id", installation->valuestring) == ESP_OK &&
        nvs_set_text("device_id", device->valuestring) == ESP_OK &&
        nvs_set_text("site_code", site->valuestring) == ESP_OK &&
        nvs_set_text("tele_topic", telemetry->valuestring) == ESP_OK &&
        nvs_set_text("heart_topic", heartbeat->valuestring) == ESP_OK &&
        nvs_set_text("config_rev", revision_text) == ESP_OK &&
        nvs_set_text("config_sha", checksum->valuestring) == ESP_OK &&
        nvs_set_text("sim_count", module_count) == ESP_OK &&
        nvs_set_text("sim_mask", channel_mask) == ESP_OK &&
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
  if (!nvs_get_text("tls_ca", ca_pem, sizeof(ca_pem))) {
    printf("platform certificate not installed; use USB provisioning\n");
    return false;
  }

  if (!connect_network()) {
    printf("network connection failed\n");
    return false;
  }

  if (!bioems_https_origin_valid(base_url)) { printf("platform HTTPS origin invalid\n"); return false; }

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
      .cert_pem = ca_pem,
      /* Validate the provisioned certificate and the URL's DNS/IP identity. */
      .skip_cert_common_name_check = false,
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
  printf("  network-mode: %s\n", ethernet_selected() ? "ethernet" : "wifi");
  printf("  model: %s\n", BIOEMS_CONTROLLER_MODEL);
  printf("  firmware: %s\n", BIOEMS_FIRMWARE_VERSION);
  bioems_update_status();
  printf("  tls-identity-validation: REQUIRED\n");
  printf("  secure-boot-enabled: %s\n", esp_secure_boot_enabled() ? "true" : "false");
  printf("  flash-encryption-enabled: %s\n", esp_flash_encryption_enabled() ? "true" : "false");
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
      "tele_token",
      "install_id",
      "device_id",
      "site_code",
      "tele_topic",
      "heart_topic",
      "config_rev",
      "config_sha",
      "bind_schema",
      "sim_count",
      "sim_mask",
  };
  for (size_t i = 0; i < sizeof(keys) / sizeof(keys[0]); i++) {
    nvs_erase_key(handle, keys[i]);
  }
  nvs_commit(handle);
  nvs_close(handle);
  printf("local binding cleared; backend binding must be revoked separately by System Owner\n");
}

static bool runtime_exchange(const char *binding,const char *type,const char *body) {
  char active[40],token[65],base[MAX_URL],certificate[MAX_CA_PEM];
  if(!nvs_get_text("binding_id",active,sizeof(active))||strcmp(binding,active)||
     !nvs_get_text("tele_token",token,sizeof(token)))return false;
  uint32_t random[4];esp_fill_random(random,sizeof(random));char id[33];
  snprintf(id,sizeof(id),"%08lx%08lx%08lx%08lx",(unsigned long)random[0],(unsigned long)random[1],(unsigned long)random[2],(unsigned long)random[3]);
  cJSON *message=cJSON_CreateObject(),*payload=cJSON_Parse(body);
  if(!message||!payload){cJSON_Delete(message);cJSON_Delete(payload);return false;}
  cJSON_AddStringToObject(message,"id",id);cJSON_AddStringToObject(message,"type",type);
  cJSON_AddItemToObject(message,"payload",payload);
  char *plain=cJSON_PrintUnformatted(message);cJSON_Delete(message);
  char *encrypted=malloc(4096),*response=malloc(4096),*decrypted=malloc(2048);
  bool ok=false;
  if(!plain||!encrypted||!response||!decrypted||!relay_encrypt(binding,token,plain,encrypted,4096))goto finish;
  static int64_t retry_after[2],ready_since[2];
  int64_t now=esp_timer_get_time();
  bool ready[2]={runtime_policy.ethernet&&bioems_ethernet_ready(),runtime_policy.wifi&&wifi_events&&(xEventGroupGetBits(wifi_events)&WIFI_CONNECTED_BIT)};
  for(int i=0;i<2;i++){if(!ready[i])ready_since[i]=0;else if(!ready_since[i])ready_since[i]=now;}
  for(int path=0;path<3&&!ok;path++) {
    bool delivered=false;response[0]=0;
    if(path<2){
      if(!ready[path]||now<retry_after[path])continue;
      const char *name=path==0?"ethernet":"wifi";
      // Require 10 seconds of link stability before upgrading an already working lower-priority path.
      if(strcmp(active_transport,"offline")&&strcmp(active_transport,name)&&now-ready_since[path]<10000000)continue;
      if(!nvs_get_text("platform_url",base,sizeof(base))||!nvs_get_text("tls_ca",certificate,sizeof(certificate))||!bioems_https_origin_valid(base))continue;
      struct ifreq interface={0};esp_netif_t *netif=path==0?bioems_ethernet_netif():wifi_netif;
      if(!netif||esp_netif_get_netif_impl_name(netif,interface.ifr_name)!=ESP_OK)continue;
      char url[MAX_URL+64];snprintf(url,sizeof(url),"%s/api/v1/controller-runtime/exchange",base);
      http_buffer_t buffer={0};
      esp_http_client_config_t config={.url=url,.cert_pem=certificate,.timeout_ms=2000,
        .skip_cert_common_name_check=false,.event_handler=http_event,.user_data=&buffer,.if_name=&interface};
      esp_http_client_handle_t client=esp_http_client_init(&config);
      if(!client)continue;
      esp_http_client_set_method(client,HTTP_METHOD_POST);esp_http_client_set_header(client,"Content-Type","application/json");
      esp_http_client_set_post_field(client,encrypted,strlen(encrypted));
      delivered=esp_http_client_perform(client)==ESP_OK&&esp_http_client_get_status_code(client)==200&&buffer.data&&buffer.length<4096;
      if(delivered)strcpy(response,buffer.data);
      free(buffer.data);esp_http_client_cleanup(client);
    }else if(runtime_policy.bluetooth)delivered=bioems_ble_exchange(encrypted,response,4096);
    if(delivered&&relay_decrypt(binding,token,response,decrypted,2048)){
      cJSON *ack=cJSON_Parse(decrypted),*received=ack?cJSON_GetObjectItem(ack,"id"):NULL;
      cJSON *accepted=ack?cJSON_GetObjectItem(ack,"accepted"):NULL;
      ok=cJSON_IsString(received)&&!strcmp(received->valuestring,id)&&cJSON_IsTrue(accepted);
      if(ok){
        active_transport=path==0?"ethernet":path==1?"wifi":"bluetooth";
        runtime_policy_confirm();runtime_policy_offer(ack);
        cJSON *epoch=cJSON_GetObjectItem(ack,"epoch");
        if(cJSON_IsNumber(epoch)&&epoch->valuedouble>=1760000000&&epoch->valuedouble<=4102444800&&!atomic_load(&server_time_synced))
          if(sync_clock((time_t)epoch->valuedouble))atomic_store(&server_time_synced,true);
      }cJSON_Delete(ack);
    }
    if(path<2)retry_after[path]=ok?0:now+15000000;
  }
finish:
  if(!ok)active_transport="offline";
  free(plain);free(encrypted);free(response);free(decrypted);return ok;
}
static bool send_sample(const char *binding,const char *body) {return runtime_exchange(binding,"sample",body);}

static void replay_samples(void) {
  // Bound replay per cycle so live acquisition is never starved by a long backlog.
  for (int batch = 0; runtime_policy.automaticReplay && storage_ready && network_ready() && batch < 8; batch++) {
    char record[OFFLINE_RECORD_MAX];
    int result = offline_queue_peek(record, sizeof(record));
    if (!result) return;
    if (result < 0) { ESP_LOGE(TAG, "STORAGE_CORRUPT: replay stopped; preserve card for recovery"); return; }
    cJSON *root = cJSON_Parse(record);
    cJSON *binding = root ? cJSON_GetObjectItemCaseSensitive(root, "binding") : NULL;
    cJSON *payload = root ? cJSON_GetObjectItemCaseSensitive(root, "payload") : NULL;
    if (!cJSON_IsString(binding) || !cJSON_IsObject(payload)) {
      cJSON_Delete(root); ESP_LOGE(TAG, "STORAGE_CORRUPT: invalid envelope"); return;
    }
    cJSON_ReplaceItemInObject(payload, "mode", cJSON_CreateString("REPLAY"));
    char *body = cJSON_PrintUnformatted(payload);
    bool accepted = body && send_sample(binding->valuestring, body);
    free(body); cJSON_Delete(root);
    if (!accepted) return;
    if (!offline_queue_ack()) { ESP_LOGE(TAG, "STORAGE_ACK_FAILED"); return; }
    atomic_store(&queued_records, offline_queue_count());
  }
}

static void deliver_or_store(const char *readings) {
  char binding[40];
  if (!nvs_get_text("binding_id", binding, sizeof(binding))) return;
  wifi_ap_record_t ap = {0};
  int signal = esp_wifi_sta_get_ap_info(&ap) == ESP_OK ? ap.rssi : 0;
  bool trusted = atomic_load(&clock_trusted);
  char timestamp[32] = {0}, body[512];
  if (trusted) {
    struct timeval now; gettimeofday(&now, NULL);
    struct tm utc; gmtime_r(&now.tv_sec, &utc);
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%S", &utc);
    size_t used = strlen(timestamp);
    snprintf(timestamp + used, sizeof(timestamp) - used, ".%03ldZ", (long)(now.tv_usec / 1000));
  }
  // Without current-boot time sync, only live server-timestamped delivery is safe.
  if (trusted) snprintf(body, sizeof(body),
    "{\"timestamp\":\"%s\",\"mode\":\"LIVE\",\"signal\":%d,\"sensors\":[%s]}", timestamp, signal, readings);
  else snprintf(body, sizeof(body), "{\"signal\":%d,\"sensors\":[%s]}", signal, readings);
  cJSON *sample=cJSON_Parse(body);unsigned char rnd[16];char sample_id[33];esp_fill_random(rnd,sizeof(rnd));
  for(int i=0;i<16;i++)snprintf(sample_id+i*2,3,"%02x",rnd[i]);
  cJSON_AddStringToObject(sample,"sampleId",sample_id);
  char *identified=cJSON_PrintUnformatted(sample);cJSON_Delete(sample);
  if(!identified||strlen(identified)>=sizeof(body)){free(identified);return;}
  strcpy(body,identified);free(identified);
  bool queued=false;
  bool was_empty=offline_queue_count()==0;
  if(trusted&&runtime_policy.offlineStorage&&storage_ready){
    char record[OFFLINE_RECORD_MAX];
    snprintf(record,sizeof(record),"{\"binding\":\"%s\",\"payload\":%s}",binding,body);
    queued=offline_queue_append(record);
    if(!queued){storage_ready=false;ESP_LOGE(TAG,"STORAGE_WRITE_FAILED_OR_FULL");}
    atomic_store(&queued_records,offline_queue_count());
  }
  if(send_sample(binding,body)){
    if(queued&&was_empty&&offline_queue_ack())atomic_store(&queued_records,offline_queue_count());
    return;
  }
  if(!queued)ESP_LOGE(TAG,"SAMPLE_NOT_RETAINED: storage disabled/unavailable or time untrusted");

}

static void report_health(void);

// A small independent NVS journal preserves power/card transitions when the SD is unavailable.
// Never overwrite unacknowledged events. Full journal is an explicit fault, not silent success.
static void report_health(void) {
  char binding[40];
  if(!nvs_get_text("binding_id",binding,sizeof(binding))||!atomic_load(&clock_trusted))return;
  unsigned disk=0;
  bool healthy=storage_ready&&bioems_sd_usage(&disk);
  if(storage_ready&&!healthy)storage_ready=false;
  static int64_t remount_at;
  if(!storage_ready&&runtime_policy.offlineStorage&&esp_timer_get_time()>remount_at){
    remount_at=esp_timer_get_time()+30000000;
    storage_ready=bioems_sd_mount();healthy=storage_ready&&bioems_sd_usage(&disk);
  }
  if(healthy){
    unsigned queue_percent=(unsigned)((uint64_t)offline_queue_count()*100/CONFIG_BIOEMS_SD_QUEUE_RECORDS);
    if(queue_percent>disk)disk=queue_percent;
    if(disk>100)disk=100;
  }
  cJSON *health=cJSON_CreateObject();
  time_t now=time(NULL);struct tm utc;gmtime_r(&now,&utc);char timestamp[32];
  strftime(timestamp,sizeof(timestamp),"%Y-%m-%dT%H:%M:%SZ",&utc);
  cJSON_AddStringToObject(health,"timestamp",timestamp);
  cJSON_AddNumberToObject(health,"appliedRevision",runtime_policy.revision);
  cJSON_AddStringToObject(health,"transport",active_transport);
  cJSON_AddStringToObject(health,"storage",!runtime_policy.offlineStorage?"disabled":healthy?"ready":"fault");
  if(healthy)cJSON_AddNumberToObject(health,"storageUsedPercent",disk);else cJSON_AddNullToObject(health,"storageUsedPercent");
  cJSON_AddNumberToObject(health,"queued",offline_queue_count());runtime_power_read(health);
  char signature[80];
  cJSON *mains=cJSON_GetObjectItem(health,"mains"),*battery=cJSON_GetObjectItem(health,"batteryLow");
  snprintf(signature,sizeof(signature),"%s:%d:%d:%d:%d:%d",binding,healthy,
    cJSON_IsNull(mains)?-1:cJSON_IsTrue(mains),cJSON_IsNull(battery)?-1:cJSON_IsTrue(battery),
    healthy&&disk>=(unsigned)runtime_policy.storageWarningPercent,runtime_policy.offlineStorage);
  static char previous[80];
  char *raw=malloc(12288);
  if(!raw){cJSON_Delete(health);return;}
  cJSON *journal=nvs_get_text("health_journal",raw,12288)?cJSON_Parse(raw):cJSON_CreateArray();
  if(!cJSON_IsArray(journal)){ESP_LOGE(TAG,"HEALTH_JOURNAL_CORRUPT: preserve NVS for recovery");free(raw);cJSON_Delete(journal);cJSON_Delete(health);return;}
  if(strcmp(previous,signature)){
    if(cJSON_GetArraySize(journal)<24){
      cJSON *event=cJSON_CreateObject();cJSON_AddStringToObject(event,"binding",binding);
      cJSON_AddItemToObject(event,"payload",cJSON_Duplicate(health,true));cJSON_AddItemToArray(journal,event);
      char *saved=cJSON_PrintUnformatted(journal);
      if(saved&&strlen(saved)<12288&&nvs_set_text("health_journal",saved)==ESP_OK)strcpy(previous,signature);
      else ESP_LOGE(TAG,"HEALTH_JOURNAL_WRITE_FAILED");
      free(saved);
    }else ESP_LOGE(TAG,"HEALTH_JOURNAL_FULL: unacknowledged events preserved; service required");
  }
  bool flushed=true;
  // Bounded journal replay; current health follows only after historical transitions are acknowledged.
  for(int i=0;i<3&&cJSON_GetArraySize(journal);i++){
    cJSON *event=cJSON_GetArrayItem(journal,0),*owner=cJSON_GetObjectItem(event,"binding");
    char *body=cJSON_PrintUnformatted(cJSON_GetObjectItem(event,"payload"));
    bool accepted=cJSON_IsString(owner)&&!strcmp(owner->valuestring,binding)&&body&&runtime_exchange(binding,"health",body);
    free(body);
    if(!accepted){flushed=false;break;}
    cJSON_DeleteItemFromArray(journal,0);char *saved=cJSON_PrintUnformatted(journal);
    if(!saved||nvs_set_text("health_journal",saved)!=ESP_OK){free(saved);flushed=false;break;}free(saved);
  }
  if(flushed&&!cJSON_GetArraySize(journal)){
    char *body=cJSON_PrintUnformatted(health);if(body)runtime_exchange(binding,"health",body);free(body);
  }
  cJSON_Delete(journal);free(raw);cJSON_Delete(health);
}

static void sim_poll_task(void *argument) {
  (void)argument;
  while (true) {
    runtime_policy_check_rollback();
    bioems_ble_enable(runtime_policy.bluetooth);
    connect_network();
    report_health();
    char count_text[2] = {0};
    char mask_text[9] = {0};
    int count = nvs_get_text("sim_count", count_text, sizeof(count_text))
        ? atoi(count_text) : 0;
    uint32_t mapped_mask = nvs_get_text("sim_mask", mask_text, sizeof(mask_text))
        ? (uint32_t)strtoul(mask_text, NULL, 16) : 0;
    for (int address = 1; address <= count && address <= SIM_MAX_MODULES; ++address) {
      sim_modbus_sample_t sample = {0};
      if (!sim_modbus_read(address, &sample)) {
        ESP_LOGW(TAG, "SIM-D4 address %d did not return a valid Modbus frame", address);
        continue;
      }
      char readings[256] = {0};
      size_t used = 0;
      for (int probe = 0; probe < SIM_CHANNELS_PER_MODULE; ++probe) {
        int channel = (address - 1) * SIM_CHANNELS_PER_MODULE + probe + 1;
        if (!(mapped_mask & (1u << (channel - 1)))) continue;
        if (sample.status[probe] == 0 && sample.tenths_celsius[probe] != INT16_MIN) {
          ESP_LOGI(TAG, "SIM channel %d = %.1f C", channel,
                   (double)sample.tenths_celsius[probe] / 10.0);
          int written = snprintf(readings + used, sizeof(readings) - used,
              "%s{\"channel\":%d,\"value\":%.1f}", used ? "," : "",
              channel, (double)sample.tenths_celsius[probe] / 10.0);
          if (written > 0 && (size_t)written < sizeof(readings) - used) used += written;
        } else {
          ESP_LOGW(TAG, "SIM channel %d sensor status %u", channel, sample.status[probe]);
        }
      }
      if (used) deliver_or_store(readings);
    }
    replay_samples();
    if (runtime_policy.wifi && wifi_events && !(xEventGroupGetBits(wifi_events) & WIFI_CONNECTED_BIT))
      esp_wifi_connect();
    vTaskDelay(pdMS_TO_TICKS(5000));
  }
}

static void print_sim_scan(void) {
  cJSON *root = cJSON_CreateObject();
  cJSON *modules = cJSON_AddArrayToObject(root, "modules");
  char uid[33];
  hardware_uid(uid);
  cJSON_AddStringToObject(root, "hardwareUid", uid);
  for (int address = 1; address <= SIM_MAX_MODULES; ++address) {
    sim_modbus_sample_t sample = {0};
    bool present = sim_modbus_read(address, &sample);
    cJSON *module = cJSON_CreateObject();
    cJSON_AddNumberToObject(module, "address", address);
    cJSON_AddBoolToObject(module, "responding", present);
    cJSON_AddItemToArray(modules, module);
    cJSON *inputs = cJSON_AddArrayToObject(module, "inputs");
    if (!present) continue;
    for (int input = 0; input < SIM_CHANNELS_PER_MODULE; ++input) {
      cJSON *probe = cJSON_CreateObject();
      cJSON_AddNumberToObject(probe, "input", input + 1);
      cJSON_AddNumberToObject(probe, "channel", (address - 1) * 4 + input + 1);
      cJSON_AddNumberToObject(probe, "status", sample.status[input]);
      bool valid = sample.status[input] == 0 && sample.tenths_celsius[input] != INT16_MIN;
      if (valid) cJSON_AddNumberToObject(probe, "value", sample.tenths_celsius[input] / 10.0);
      cJSON_AddItemToArray(inputs, probe);
    }
  }
  char *json = cJSON_PrintUnformatted(root);
  if (json) { printf("BIOEMS_SIM_SCAN:%s\n", json); free(json); }
  cJSON_Delete(root);
}

static void command_loop(void) {
  char line[MAX_LINE];
  printf("bench: rtc | gsmdiag | gsmtest <+country-number> (sends one SMS)\n");
  printf("commands: status | setwifi <ssid> <password> | setplatform <url> | pair <12-digit-code> | clearbinding\n");

  while (true) {
    bioems_update_poll();
    printf("bioems> ");
    fflush(stdout);
    if (!fgets(line, sizeof(line), stdin)) {
      vTaskDelay(pdMS_TO_TICKS(250));
      continue;
    }
    line[strcspn(line, "\r\n")] = '\0';

    if (bioems_update_command(line)) continue;
    if (strcmp(line, "rtc") == 0) {
      time_t epoch = 0;
      bool valid = bioems_rtc_read(&epoch);
      char commissioned[4] = {0};
      bool saved = nvs_get_text("rtc_valid", commissioned, sizeof(commissioned)) &&
        strcmp(commissioned, "1") == 0;
      printf("RTC readable=%d commissioned=%d UTC=%lld timeTrusted=%d\n",
        valid, saved, valid ? (long long)epoch : 0, atomic_load(&clock_trusted));
      continue;
    }
    if (strcmp(line, "gsmdiag") == 0) {
      bioems_gsm_diagnostics();
      continue;
    }
    if (strncmp(line, "gsmtest ", 8) == 0) {
      if (!bioems_gsm_sms(line + 8, "BIOEMS bench test"))
        printf("SMS not confirmed. Use international phone format and check gsmdiag.\n");
      continue;
    }
    if (strcmp(line, "storage") == 0) {
      printf("SD mounted=%d timeTrusted=%d queued=%u\n",
        storage_ready, atomic_load(&clock_trusted), atomic_load(&queued_records));
      continue;
    }
    if (strcmp(line, "simscan") == 0) {
      print_sim_scan();
      continue;
    }
    if (strcmp(line, "status") == 0) {
      print_status();
      continue;
    }
    if (strcmp(line, "clearbinding") == 0) {
      clear_binding();
      continue;
    }
    if (strncmp(line, "setnetwork ", 11) == 0) {
      const char *mode = line + 11;
      if (strcmp(mode, "wifi") && strcmp(mode, "ethernet")) { printf("invalid network mode\n"); continue; }
      if (network_started) { printf("reboot required before changing network mode\n"); continue; }
      if (nvs_set_text("network_mode", mode) == ESP_OK) printf("network configuration saved\n");
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
      char *url = line + 12;
      if (!bioems_https_origin_valid(url)) {
        printf("invalid platform url\n");
        continue;
      }
      size_t url_length = strlen(url);
      if (url_length && url[url_length-1] == '/') url[url_length-1] = 0;
      if (nvs_set_text("platform_url", url) == ESP_OK) {
        printf("platform url saved\n");
      }
      continue;
    }
    if (strcmp(line, "cabegin") == 0) {
      ca_base64_length = 0;
      ca_pem[0] = '\0';
      printf("certificate transfer started\n");
      continue;
    }
    if (strncmp(line, "cachunk ", 8) == 0) {
      const char *chunk = line + 8;
      size_t length = strlen(chunk);
      bool valid = length > 0;
      for (size_t i = 0; i < length; ++i) {
        if (!(isalnum((unsigned char)chunk[i]) || chunk[i] == '+' ||
              chunk[i] == '/' || chunk[i] == '=')) valid = false;
      }
      if (!valid || ca_base64_length + length > MAX_CA_PEM - 128) {
        printf("certificate chunk rejected\n");
      } else {
        memcpy(ca_pem + ca_base64_length, chunk, length);
        ca_base64_length += length;
        ca_pem[ca_base64_length] = '\0';
        printf("certificate chunk saved\n");
      }
      continue;
    }
    if (strcmp(line, "caend") == 0) {
      if (ca_base64_length < 100 || ca_base64_length > MAX_CA_PEM - 128) {
        printf("certificate transfer invalid\n");
        continue;
      }
      memmove(ca_pem + 28, ca_pem, ca_base64_length);
      memcpy(ca_pem, "-----BEGIN CERTIFICATE-----\n", 28);
      size_t end = ca_base64_length + 28;
      memcpy(ca_pem + end, "\n-----END CERTIFICATE-----\n", 27);
      ca_pem[end + 27] = '\0';
      if (nvs_set_text("tls_ca", ca_pem) == ESP_OK)
        printf("platform certificate saved\n");
      continue;
    }
    if (strncmp(line, "settime ", 8) == 0) {
      char *end = NULL;
      long long epoch = strtoll(line + 8, &end, 10);
      if (!end || *end != '\0' || epoch < 1760000000LL ||
          epoch >= 4102444800LL) {
        printf("invalid UTC epoch\n");
        continue;
      }
      if (!sync_clock((time_t)epoch) ||
          nvs_set_text("utc_epoch", line + 8) != ESP_OK) {
        printf("UTC time could not be saved\n");
      } else {
        atomic_store(&clock_trusted, true);
        printf("UTC time saved\n");
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
  bioems_update_init();
#ifdef CONFIG_BIOEMS_REQUIRE_PRODUCTION_SECURITY
  if (!bioems_security_policy_satisfied(true, esp_secure_boot_enabled(), esp_flash_encryption_enabled())) {
    ESP_LOGE(TAG, "PRODUCTION_SECURITY_REQUIRED: secure boot and flash encryption are not both enabled; startup refused");
    return;
  }
#endif
  esp_err_t nvs_result = nvs_flash_init();
  if (nvs_result == ESP_ERR_NVS_NO_FREE_PAGES ||
      nvs_result == ESP_ERR_NVS_NEW_VERSION_FOUND) {
#ifdef CONFIG_BIOEMS_USB_AB_MAINTENANCE
    ESP_LOGE(TAG, "NVS initialization failed; preserving configuration and rebooting for rollback");
    esp_restart();
#else
    ESP_ERROR_CHECK(nvs_flash_erase());
#endif
    ESP_ERROR_CHECK(nvs_flash_init());
  } else {
    ESP_ERROR_CHECK(nvs_result);
  }

  // Bench bootstrap: restore the last trusted USB-provisioned epoch before TLS.
  // A restored old epoch is sufficient only for TLS bootstrap, never historical timestamps.
  char saved_epoch[24] = {0};
  if (nvs_get_text("utc_epoch", saved_epoch, sizeof(saved_epoch))) {
    time_t epoch = (time_t)strtoll(saved_epoch, NULL, 10);
    struct timeval utc = {.tv_sec = epoch, .tv_usec = 0};
    settimeofday(&utc, NULL);
  }

  clock_mutex = xSemaphoreCreateMutex();
  rtc_ready = bioems_rtc_init();
  char rtc_valid[4] = {0};
  time_t rtc_epoch = 0;
  if (rtc_ready && nvs_get_text("rtc_valid", rtc_valid, sizeof(rtc_valid)) &&
      strcmp(rtc_valid, "1") == 0 && bioems_rtc_read(&rtc_epoch)) {
    struct timeval utc = {.tv_sec=rtc_epoch, .tv_usec=0};
    if (settimeofday(&utc, NULL) == 0) {
      atomic_store(&clock_trusted, true);
      ESP_LOGI(TAG, "UTC restored from commissioned DS3231 (battery/OSF valid)");
    }
  }
  if (!atomic_load(&clock_trusted))
    ESP_LOGW(TAG, "RTC_UNTRUSTED: fresh provisioning or authenticated server time required");

  ESP_ERROR_CHECK(esp_netif_init());
  runtime_policy_init();
  if(!bioems_ble_init())ESP_LOGE(TAG,"BLE_INIT_FAILED");
  bioems_ble_enable(runtime_policy.bluetooth);
  storage_ready = bioems_sd_mount();
  atomic_store(&queued_records, offline_queue_count());
  if (!storage_ready) ESP_LOGW(TAG, "STORAGE_UNAVAILABLE: live delivery only");
  ESP_LOGI(TAG, "BIO-EMS Site Controller boot");
  print_status();
  char current_binding[MAX_NVS_TEXT];
  if (nvs_get_text("binding_id", current_binding, sizeof(current_binding)))
    connect_network();
  if (sim_modbus_init())
    xTaskCreate(sim_poll_task, "sim_modbus", 32768, NULL, 5, NULL);
  else
    ESP_LOGE(TAG, "SIM-D4 UART initialization failed");
  command_loop();
}

#include "usb_update.h"
#include "sdkconfig.h"
#include <stdio.h>
#include <string.h>
#ifdef CONFIG_BIOEMS_USB_AB_MAINTENANCE
#include <stdlib.h>
#include <stdatomic.h>
#include "esp_ota_ops.h"
#include "esp_system.h"
#include "esp_timer.h"
#include "mbedtls/base64.h"
#include "mbedtls/md.h"

#define UPDATE_CHUNK_BYTES 128
#define UPDATE_BASE64_BYTES 172
#define UPDATE_HASH_BYTES 32
#define UPDATE_IDLE_US (30LL * 1000000LL)
static esp_ota_handle_t handle;
static bool active, baseline_confirmed;
static atomic_bool pending;
static esp_timer_handle_t confirmation_timer;
static unsigned expected, received;
static unsigned char expected_hash[UPDATE_HASH_BYTES];
static mbedtls_md_context_t hash;
static const esp_partition_t *destination;
static int64_t last_chunk;

static void abort_update(void) {
  if (active) { esp_ota_abort(handle); mbedtls_md_free(&hash); }
  active = false;
}
static bool parse_hash(const char *text, unsigned char *bytes) {
  static const char digits[] = "0123456789abcdef";
  if (strlen(text) != UPDATE_HASH_BYTES * 2) return false;
  for (unsigned i = 0; i < UPDATE_HASH_BYTES; i++) {
    const char *a = strchr(digits, text[i*2]);
    const char *b = strchr(digits, text[i*2+1]);
    if (!a || !b) return false;
    bytes[i] = (unsigned char)(((a-digits) << 4) | (b-digits));
  }
  return true;
}
static void confirmation_timeout(void *argument) {
  (void)argument;
  if (pending) esp_restart(); /* Bootloader rolls back an unconfirmed application. */
}
void bioems_update_init(void) {
  const esp_partition_t *running = esp_ota_get_running_partition();
  esp_ota_img_states_t state;
  bool known = running && esp_ota_get_state_partition(running, &state) == ESP_OK;
  pending = known && state == ESP_OTA_IMG_PENDING_VERIFY;
  baseline_confirmed = known && state == ESP_OTA_IMG_VALID;
  if (pending) {
    const esp_timer_create_args_t timer = {.callback=confirmation_timeout,.name="update-confirm"};
    if (esp_timer_create(&timer,&confirmation_timer) != ESP_OK ||
        esp_timer_start_once(confirmation_timer,(uint64_t)CONFIG_BIOEMS_UPDATE_CONFIRM_SECONDS * 1000000ULL) != ESP_OK) esp_restart();
  }
}
void bioems_update_status(void) {
  const esp_partition_t *running = esp_ota_get_running_partition();
  printf("  update-profile: USB_AB_MAINTENANCE\n  update-slot: %s\n  update-state: %s\n  rollback-available: %s\n",
    running ? running->label : "UNKNOWN", pending ? "PENDING_VERIFY" : (baseline_confirmed ? "CONFIRMED" : "BASELINE_UNCONFIRMED"),
    esp_ota_check_rollback_is_possible() ? "true" : "false");
}
void bioems_update_poll(void) {
  int64_t now = esp_timer_get_time();
  if (active && now-last_chunk > UPDATE_IDLE_US) { abort_update(); printf("UPDATE_ABORTED idle timeout\n"); }

}
bool bioems_update_command(const char *line) {
  if (strncmp(line, "update", 6)) return false;
  bioems_update_poll();
  if (!strcmp(line, "updateabort")) { abort_update(); printf("UPDATE_ABORTED\n"); return true; }
  if (!strcmp(line, "updateconfirm")) {
    const esp_partition_t *running = esp_ota_get_running_partition();
    bool registered = pending || (!baseline_confirmed && running && esp_ota_set_boot_partition(running) == ESP_OK);
    if (registered && esp_ota_mark_app_valid_cancel_rollback() == ESP_OK) {
      pending = false; baseline_confirmed = true;
      if (confirmation_timer) esp_timer_stop(confirmation_timer);
      printf("UPDATE_CONFIRMED\n");
    } else printf("UPDATE_REJECTED no unconfirmed application or baseline registration failed\n");
    return true;
  }
  if (!strcmp(line, "updaterollback")) {
    abort_update();
    if (!esp_ota_check_rollback_is_possible()) { printf("UPDATE_REJECTED no valid alternate application\n"); return true; }
    printf("UPDATE_ROLLBACK rebooting\n"); fflush(stdout);
    if (esp_ota_mark_app_invalid_rollback_and_reboot() != ESP_OK) printf("UPDATE_REJECTED rollback failed\n");
    return true;
  }
  if (!strncmp(line, "updatebegin ", 12)) {
    unsigned size; char hex[UPDATE_HASH_BYTES*2+1], extra;
    if (active || pending || !baseline_confirmed || sscanf(line+12, "%u %64s %c", &size, hex, &extra) != 2 ||
        !size || !parse_hash(hex, expected_hash)) { printf("UPDATE_REJECTED begin\n"); return true; }
    destination = esp_ota_get_next_update_partition(NULL);
    if (!destination || size > destination->size) { printf("UPDATE_REJECTED inactive slot unavailable or image too large\n"); return true; }
    mbedtls_md_init(&hash);
    if (mbedtls_md_setup(&hash, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 0) || mbedtls_md_starts(&hash)) {
      mbedtls_md_free(&hash); printf("UPDATE_REJECTED hash initialization\n"); return true;
    }
    if (esp_ota_begin(destination, size, &handle) != ESP_OK) { mbedtls_md_free(&hash); printf("UPDATE_REJECTED slot initialization\n"); return true; }
    active = true; expected = size; received = 0; last_chunk = esp_timer_get_time();
    printf("UPDATE_READY 0\n"); return true;
  }
  if (!strncmp(line, "updatechunk ", 12)) {
    unsigned offset; char data[UPDATE_BASE64_BYTES+1], extra; unsigned char bytes[UPDATE_CHUNK_BYTES]; size_t length = 0;
    if (!active || sscanf(line+12, "%u %172s %c", &offset, data, &extra) != 2 || offset != received ||
        mbedtls_base64_decode(bytes,sizeof(bytes),&length,(const unsigned char *)data,strlen(data)) ||
        !length || length > expected-received || esp_ota_write(handle,bytes,length) != ESP_OK || mbedtls_md_update(&hash,bytes,length)) {
      abort_update(); printf("UPDATE_REJECTED chunk; transfer aborted\n"); return true;
    }
    received += length; last_chunk = esp_timer_get_time(); printf("UPDATE_ACK %u\n",received); return true;
  }
  if (!strcmp(line, "updateend")) {
    unsigned char actual[UPDATE_HASH_BYTES];
    if (!active || received != expected || mbedtls_md_finish(&hash,actual) || memcmp(actual,expected_hash,sizeof(actual))) {
      abort_update(); printf("UPDATE_REJECTED incomplete or hash mismatch\n"); return true;
    }
    mbedtls_md_free(&hash); active = false;
    if (esp_ota_end(handle) != ESP_OK) { printf("UPDATE_REJECTED image or signature validation\n"); return true; }
    esp_app_desc_t description;
    if (esp_ota_get_partition_description(destination,&description) != ESP_OK ||
        strcmp(description.project_name,"bioems_site_controller") || esp_ota_set_boot_partition(destination) != ESP_OK) {
      printf("UPDATE_REJECTED image identity or boot selection\n"); return true;
    }
    printf("UPDATE_STAGED rebooting; confirmation required\n"); fflush(stdout); esp_restart(); return true;
  }
  printf("UPDATE_REJECTED command\n"); return true;
}
#else
void bioems_update_init(void) {}
void bioems_update_poll(void) {}
void bioems_update_status(void) { printf("  update-profile: SINGLE_APP_PILOT\n"); }
bool bioems_update_command(const char *line) {
  if (strncmp(line,"update",6)) return false;
  printf("UPDATE_REJECTED A/B profile not installed\n"); return true;
}
#endif

#include "ble_relay.h"
#include "esp_err.h"
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"
#include "freertos/task.h"
#include "host/ble_hs.h"
#include "nimble/nimble_port.h"
#include "nimble/nimble_port_freertos.h"
#include "services/gap/ble_svc_gap.h"
#include "services/gatt/ble_svc_gatt.h"
#include <stdatomic.h>
#include <string.h>

// BLE only transports AES-GCM authenticated ciphertext, never tokens or
// plaintext readings. UUIDs: 4b494f45-4d53-4000-8000-000000000001 service;
// ...0002 TX; ...0003 RX.
static const ble_uuid128_t service_uuid =
    BLE_UUID128_INIT(1, 0, 0, 0, 0, 0, 0, 0x80, 0, 0x40, 0x53, 0x4d, 0x45, 0x4f, 0x49, 0x4b);
static const ble_uuid128_t tx_uuid =
    BLE_UUID128_INIT(2, 0, 0, 0, 0, 0, 0, 0x80, 0, 0x40, 0x53, 0x4d, 0x45, 0x4f, 0x49, 0x4b);
static const ble_uuid128_t rx_uuid =
    BLE_UUID128_INIT(3, 0, 0, 0, 0, 0, 0, 0x80, 0, 0x40, 0x53, 0x4d, 0x45, 0x4f, 0x49, 0x4b);
static atomic_bool enabled, subscribed;
static atomic_uint_least16_t connection = BLE_HS_CONN_HANDLE_NONE;
static uint16_t tx_handle;
static uint8_t address_type;
static atomic_bool synced;
static SemaphoreHandle_t lock, received;
static char incoming[4096];
static size_t used;

static void advertise(void);
static int gap_event(struct ble_gap_event *event, void *arg) {
  (void)arg;
  if (event->type == BLE_GAP_EVENT_CONNECT) {
    if (!event->connect.status)
      connection = event->connect.conn_handle;
    else
      advertise();
  } else if (event->type == BLE_GAP_EVENT_DISCONNECT) {
    connection = BLE_HS_CONN_HANDLE_NONE;
    atomic_store(&subscribed, false);
    advertise();
  } else if (event->type == BLE_GAP_EVENT_SUBSCRIBE) {
    if (event->subscribe.attr_handle == tx_handle)
      atomic_store(&subscribed, event->subscribe.cur_notify);
  } else if (event->type == BLE_GAP_EVENT_ADV_COMPLETE)
    advertise();
  return 0;
}
static void advertise(void) {
  if (!synced || !atomic_load(&enabled) || connection != BLE_HS_CONN_HANDLE_NONE)
    return;
  struct ble_hs_adv_fields fields = {0};
  fields.flags = BLE_HS_ADV_F_DISC_GEN | BLE_HS_ADV_F_BREDR_UNSUP;
  fields.uuids128 = (ble_uuid128_t *)&service_uuid;
  fields.num_uuids128 = 1;
  fields.uuids128_is_complete = 1;
  if (ble_gap_adv_set_fields(&fields))
    return;
  struct ble_gap_adv_params params = {0};
  params.conn_mode = BLE_GAP_CONN_MODE_UND;
  params.disc_mode = BLE_GAP_DISC_MODE_GEN;
  ble_gap_adv_start(address_type, NULL, BLE_HS_FOREVER, &params, gap_event, NULL);
}
static int access_rx(uint16_t conn, uint16_t attr, struct ble_gatt_access_ctxt *ctxt, void *arg) {
  (void)conn;
  (void)attr;
  (void)arg;
  if (!atomic_load(&enabled) || ctxt->op != BLE_GATT_ACCESS_OP_WRITE_CHR)
    return BLE_ATT_ERR_WRITE_NOT_PERMITTED;
  uint16_t length = OS_MBUF_PKTLEN(ctxt->om);
  if (length > 512 || xSemaphoreTake(lock, 0) != pdTRUE)
    return BLE_ATT_ERR_INSUFFICIENT_RES;
  char chunk[512];
  int rc = ble_hs_mbuf_to_flat(ctxt->om, chunk, sizeof(chunk), NULL);
  if (!rc)
    for (unsigned i = 0; i < length; i++) {
      if (chunk[i] == '\n') {
        incoming[used] = 0;
        xSemaphoreGive(received);
        break;
      }
      if (used + 1 >= sizeof(incoming)) {
        used = 0;
        rc = BLE_ATT_ERR_INVALID_ATTR_VALUE_LEN;
        break;
      }
      incoming[used++] = chunk[i];
    }
  xSemaphoreGive(lock);
  return rc;
}
static int notify_only(uint16_t conn, uint16_t attr, struct ble_gatt_access_ctxt *ctxt, void *arg) {
  (void)conn;
  (void)attr;
  (void)ctxt;
  (void)arg;
  return BLE_ATT_ERR_READ_NOT_PERMITTED;
}
static const struct ble_gatt_svc_def services[] = {
    {.type = BLE_GATT_SVC_TYPE_PRIMARY,
     .uuid = &service_uuid.u,
     .characteristics =
         (struct ble_gatt_chr_def[]){
             {.uuid = &tx_uuid.u,
              .flags = BLE_GATT_CHR_F_NOTIFY,
              .access_cb = notify_only,
              .val_handle = &tx_handle},
             {.uuid = &rx_uuid.u, .flags = BLE_GATT_CHR_F_WRITE, .access_cb = access_rx},
             {0}}},
    {0}};
static void on_sync(void) {
  if (ble_hs_id_infer_auto(0, &address_type))
    return;
  synced = true;
  advertise();
}
static void host_task(void *arg) {
  (void)arg;
  nimble_port_run();
  nimble_port_freertos_deinit();
}
bool bioems_ble_init(void) {
  lock = xSemaphoreCreateMutex();
  received = xSemaphoreCreateBinary();
  if (!lock || !received || nimble_port_init() != ESP_OK)
    return false;
  ble_svc_gap_init();
  ble_svc_gatt_init();
  ble_svc_gap_device_name_set("BIOEMS-Main");
  ble_hs_cfg.sync_cb = on_sync;
  if (ble_gatts_count_cfg(services) || ble_gatts_add_svcs(services))
    return false;
  nimble_port_freertos_init(host_task);
  return true;
}
void bioems_ble_enable(bool value) {
  atomic_store(&enabled, value);
  if (!synced)
    return;
  if (value)
    advertise();
  else {
    ble_gap_adv_stop();
    if (connection != BLE_HS_CONN_HANDLE_NONE)
      ble_gap_terminate(connection, BLE_ERR_REM_USER_CONN_TERM);
  }
}
bool bioems_ble_ready(void) { return atomic_load(&enabled) && atomic_load(&subscribed); }
bool bioems_ble_exchange(const char *request, char *response, size_t capacity) {
  if (!bioems_ble_ready())
    return false;
  xSemaphoreTake(received, 0);
  xSemaphoreTake(lock, portMAX_DELAY);
  used = 0;
  incoming[0] = 0;
  xSemaphoreGive(lock);
  size_t length = strlen(request);
  // 20-byte fragments also work with the minimum BLE MTU. Newline frames a
  // complete envelope.
  for (size_t offset = 0; offset <= length;) {
    char chunk[20];
    size_t n = length - offset;
    if (n > sizeof(chunk))
      n = sizeof(chunk);
    memcpy(chunk, request + offset, n);
    if (n < sizeof(chunk))
      chunk[n++] = '\n';
    struct os_mbuf *buffer = ble_hs_mbuf_from_flat(chunk, n);
    if (!buffer || ble_gatts_notify_custom(connection, tx_handle, buffer))
      return false;
    offset += n;
    vTaskDelay(pdMS_TO_TICKS(12));
  }
  if (xSemaphoreTake(received, pdMS_TO_TICKS(6000)) != pdTRUE)
    return false;
  xSemaphoreTake(lock, portMAX_DELAY);
  bool ok = used < capacity;
  if (ok)
    memcpy(response, incoming, used + 1);
  xSemaphoreGive(lock);
  return ok;
}

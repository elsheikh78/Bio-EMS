#include "runtime_policy.h"
#include "nvs.h"
#include "driver/gpio.h"
#include "esp_timer.h"
#include "esp_log.h"
#include <string.h>
#include <stdlib.h>
runtime_policy_t runtime_policy = {true,true,true,true,true,true,true,80,0};
static runtime_policy_t committed;
static char candidate_json[512];
static bool pending;
static int64_t offered_at;
static bool parse(const cJSON *root, runtime_policy_t *out) {
  const cJSON *p=cJSON_GetObjectItem(root,"policy"),*r=cJSON_GetObjectItem(root,"revision");
  if(!cJSON_IsObject(p)||!cJSON_IsNumber(r)||r->valueint<0||r->valuedouble!=r->valueint)return false;
  runtime_policy_t value={0}; value.revision=r->valueint;
  const char *names[]={"ethernet","wifi","bluetooth","offlineStorage","automaticReplay","powerAlarms","storageAlarms"};
  bool *fields[]={&value.ethernet,&value.wifi,&value.bluetooth,&value.offlineStorage,&value.automaticReplay,&value.powerAlarms,&value.storageAlarms};
  for(int i=0;i<7;i++){const cJSON *v=cJSON_GetObjectItem(p,names[i]);if(!cJSON_IsBool(v))return false;*fields[i]=cJSON_IsTrue(v);}
  const cJSON *percent=cJSON_GetObjectItem(p,"storageWarningPercent");
  if(!cJSON_IsNumber(percent)||percent->valueint<50||percent->valueint>95)return false;
  value.storageWarningPercent=percent->valueint;
  if(!(value.ethernet||value.wifi||value.bluetooth)||(value.automaticReplay&&!value.offlineStorage))return false;
  *out=value;return true;
}
void runtime_policy_init(void) {
  char raw[512];size_t size=sizeof(raw);nvs_handle_t h;
  if(nvs_open("bioems",NVS_READONLY,&h)==ESP_OK){
    if(nvs_get_str(h,"runtime_policy",raw,&size)==ESP_OK){cJSON *root=cJSON_Parse(raw);parse(root,&runtime_policy);cJSON_Delete(root);}nvs_close(h);
  }
  committed=runtime_policy;
  int pins[]={CONFIG_BIOEMS_MAINS_GOOD_GPIO,CONFIG_BIOEMS_BATTERY_LOW_GPIO};
  for(int i=0;i<2;i++)if(pins[i]>=0){gpio_config_t cfg={.pin_bit_mask=1ULL<<pins[i],.mode=GPIO_MODE_INPUT};gpio_config(&cfg);}
}
void runtime_policy_offer(const cJSON *response) {
  runtime_policy_t next;
  if(!parse(response,&next)||next.revision<=committed.revision||
    (pending&&next.revision==runtime_policy.revision))return;
  cJSON *envelope=cJSON_CreateObject();
  cJSON_AddNumberToObject(envelope,"revision",next.revision);
  cJSON_AddItemToObject(envelope,"policy",cJSON_Duplicate(cJSON_GetObjectItem(response,"policy"),true));
  char *json=cJSON_PrintUnformatted(envelope);
  if(json&&strlen(json)<sizeof(candidate_json)){
    strcpy(candidate_json,json);runtime_policy=next;pending=true;offered_at=esp_timer_get_time();
  }free(json);cJSON_Delete(envelope);
}
void runtime_policy_confirm(void) {
  // Called only after a subsequent authenticated exchange using the candidate paths.
  if(!pending)return;
  nvs_handle_t h;
  if(nvs_open("bioems",NVS_READWRITE,&h)!=ESP_OK)return;
  if(nvs_set_str(h,"runtime_policy",candidate_json)==ESP_OK&&nvs_commit(h)==ESP_OK){committed=runtime_policy;pending=false;}
  nvs_close(h);
}
void runtime_policy_check_rollback(void) {
  if(pending&&esp_timer_get_time()-offered_at>60000000){
    runtime_policy=committed;pending=false;
    ESP_LOGE("policy","POLICY_ROLLED_BACK: candidate did not confirm a working path in 60 seconds");
  }
}
static void input(cJSON *root,const char *name,int pin) {
  if(pin<0){cJSON_AddNullToObject(root,name);return;}
  bool value=gpio_get_level(pin)!=0;
#ifdef CONFIG_BIOEMS_POWER_INPUT_ACTIVE_LOW
  value=!value;
#endif
  cJSON_AddBoolToObject(root,name,value);
}
void runtime_power_read(cJSON *health) {
  input(health,"mains",CONFIG_BIOEMS_MAINS_GOOD_GPIO);
  input(health,"batteryLow",CONFIG_BIOEMS_BATTERY_LOW_GPIO);
}

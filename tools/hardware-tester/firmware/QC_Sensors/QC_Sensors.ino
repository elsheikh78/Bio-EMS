// Independent QC firmware 0.1.0. ESP32: disconnect SD (GPIO4 conflict).
// Nano: disconnect HW-519 D0/D1 for USB. Externally powered probes only.
#include <OneWire.h>
#include <DallasTemperature.h>
#if defined(ARDUINO_ARCH_ESP32)
const char BOARD[]="esp32s3";
OneWire w1(4); DallasTemperature s1(&w1);
DallasTemperature* sensors[]={&s1};
#else
const char BOARD[]="nano";
OneWire w1(2),w2(3),w3(4),w4(5);
DallasTemperature s1(&w1),s2(&w2),s3(&w3),s4(&w4);
DallasTemperature* sensors[]={&s1,&s2,&s3,&s4};
#endif
const uint8_t N=sizeof(sensors)/sizeof(sensors[0]); uint32_t sequence=0;
void setup(){Serial.begin(115200);delay(1500);}
void loop(){
 uint32_t started=millis(); uint8_t counts[N]; DeviceAddress roms[N]; bool found[N];
 for(uint8_t i=0;i<N;i++){
  sensors[i]->begin();counts[i]=sensors[i]->getDeviceCount();
  found[i]=counts[i]==1&&sensors[i]->getAddress(roms[i],0);
  sensors[i]->setResolution(12);sensors[i]->setWaitForConversion(false);
  if(found[i])sensors[i]->requestTemperatures();
 }
 delay(800);
 Serial.print(F("{\"protocol\":\"bioems-qc/1\",\"board\":\""));Serial.print(BOARD);
 Serial.print(F("\",\"uid\":\""));
#if defined(ARDUINO_ARCH_ESP32)
 uint64_t chip=ESP.getEfuseMac();char uid[17];snprintf(uid,sizeof(uid),"%04X%08X",(uint16_t)(chip>>32),(uint32_t)chip);Serial.print(uid);
#else
 Serial.print(F("NANO-UNIQUE-ID-UNAVAILABLE"));
#endif
 Serial.print(F("\",\"firmware\":\"qc-sensors-0.1.0\",\"seq\":"));Serial.print(++sequence);
 Serial.print(F(",\"uptime_ms\":"));Serial.print(millis());Serial.print(F(",\"channels\":["));
 for(uint8_t i=0;i<N;i++){
  if(i)Serial.print(','); const char* status="ok";float value=0;
  if(counts[i]==0)status="missing";else if(counts[i]>1)status="multiple";
  else if(!found[i]||roms[i][0]!=0x28)status="invalid";
  else if(sensors[i]->isParasitePowerMode())status="parasite";
  else {value=sensors[i]->getTempC(roms[i]);if(value==DEVICE_DISCONNECTED_C||value< -55||value>125)status="crc";}
  Serial.print(F("{\"channel\":"));Serial.print(i+1);Serial.print(F(",\"status\":\""));Serial.print(status);Serial.print('"');
  if(found[i]){Serial.print(F(",\"rom\":\""));for(uint8_t b=0;b<8;b++){if(roms[i][b]<16)Serial.print('0');Serial.print(roms[i][b],HEX);}Serial.print('"');}
  if(!strcmp(status,"ok")){Serial.print(F(",\"temperature_c\":"));Serial.print(value,4);}Serial.print('}');
 }
 Serial.println(F("]}"));uint32_t elapsed=millis()-started;if(elapsed<2000)delay(2000-elapsed);
}

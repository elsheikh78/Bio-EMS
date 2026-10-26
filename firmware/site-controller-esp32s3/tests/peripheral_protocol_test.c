#include "rtc_codec.h"
#include "gsm_protocol.h"
#include <assert.h>
#include <stdio.h>
#include <string.h>

static gsm_response_t response(const char *text) {
  gsm_response_t r = {0};
  while (*text) gsm_response_feed(&r, *text++);
  return r;
}
int main(void) {
  uint8_t r[7]; time_t epoch=0;
  assert(rtc_encode((time_t)1709210096, r)); // 2024-02-29 12:34:56 UTC
  assert(r[0]==0x56 && r[1]==0x34 && r[2]==0x12 && r[4]==0x29 && r[5]==2 && r[6]==0x24);
  assert(rtc_decode(r, &epoch) && epoch==(time_t)1709210096);
  r[2]=0x72; assert(rtc_decode(r, &epoch) && epoch==(time_t)1709210096); // 12 PM
  r[2]=0x52; assert(rtc_decode(r, &epoch) && epoch==(time_t)1709166896); // 12 AM
  r[2]=0x40; assert(!rtc_decode(r, &epoch)); // 12-hour zero invalid
  assert(rtc_encode((time_t)1709210096, r));
  r[6]=0x23; assert(!rtc_decode(r, &epoch)); // 2023-02-29 invalid
  r[6]=0x24; r[5]=0x82; assert(!rtc_decode(r, &epoch)); // 2100 century not accepted
  r[5]=2; r[0]=0x6a; assert(!rtc_decode(r, &epoch)); // invalid BCD
  assert(!rtc_encode((time_t)4102444800LL, r));
  assert(!rtc_encode((time_t)0, r));
  // Exercise every supported date through leap boundaries, independent known endpoints.
  for (int64_t t=946684800; t<INT64_C(4102444800); t+=86400) {
    assert(rtc_encode((time_t)t, r));
    assert(rtc_decode(r, &epoch) && (int64_t)epoch==t);
  }
  assert(gsm_phone_valid("+201012345678"));
  assert(!gsm_phone_valid("+0201012345678"));
  assert(!gsm_phone_valid("01012345678"));
  assert(!gsm_phone_valid("+201012345678\"\rAT"));
  assert(gsm_message_valid("BIOEMS bench test"));
  assert(!gsm_message_valid("test\x1a"));
  assert(!gsm_message_valid("test\nAT"));
  assert(!gsm_message_valid(""));
  gsm_response_t g=response("\r\nAT\r\nOK\r\n");
  assert(g.ok && !g.error);
  g=response("\r\nBROKEN OK TEXT\r\n"); assert(!g.ok);
  g=response("\r\n+CREG: 0,5\r\nOK\r\n"); assert(g.registered && g.ok);
  g=response("\r\n+CREG: 0,2\r\nOK\r\n"); assert(!g.registered && g.ok);
  g=response("\r\n+CREG: 1\r\n"); assert(!g.registered);
  g=response("\r\n> "); assert(g.prompt && !g.ok);
  g=response("\r\n+CMGS: 42\r\nOK\r\n"); assert(g.sms_reference && g.ok);
  g=response("\r\nOK\r\n"); assert(!g.sms_reference);
  g=response("\r\n+CMS ERROR: 500\r\n"); assert(g.error);
  g=response("\r\n+CME ERROR: 10\r\n"); assert(g.error);
  memset(&g,0,sizeof(g));
  for (int i=0;i<300;i++) gsm_response_feed(&g,'X');
  for (const char *p="OK\r\n";*p;p++) gsm_response_feed(&g,*p);
  assert(!g.ok); // never accept suffix of truncated line
  for (const char *p="OK\r\n";*p;p++) gsm_response_feed(&g,*p);
  assert(g.ok); // resynchronise at a full line
  puts("RTC calendar and GSM protocol tests: PASS");
}

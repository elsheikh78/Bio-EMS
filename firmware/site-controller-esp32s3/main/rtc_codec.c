#include "rtc_codec.h"
#include <stddef.h>

static int unbcd(uint8_t value) {
  return (value & 15) > 9 || (value >> 4) > 9 ? -1 :
    (value >> 4) * 10 + (value & 15);
}
static uint8_t bcd(int value) { return (uint8_t)((value / 10) * 16 + value % 10); }
static bool leap(int year) { return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0); }
static int month_days(int year, int month) {
  static const int days[] = {31,28,31,30,31,30,31,31,30,31,30,31};
  return days[month - 1] + (month == 2 && leap(year));
}
bool rtc_decode(const uint8_t r[7], time_t *epoch) {
  if (!r || !epoch || (r[0] & 0x80) || (r[1] & 0x80) ||
      (r[2] & 0x80) || (r[4] & 0xc0) || (r[5] & 0xe0)) return false;
  int sec = unbcd(r[0]), min = unbcd(r[1]);
  int hour = unbcd(r[2] & ((r[2] & 0x40) ? 0x1f : 0x3f));
  if (r[2] & 0x40) {
    if (hour < 1 || hour > 12) return false;
    hour = hour % 12 + ((r[2] & 0x20) ? 12 : 0);
  }
  int day = unbcd(r[4]), month = unbcd(r[5]), year = unbcd(r[6]);
  if (sec < 0 || sec > 59 || min < 0 || min > 59 || hour < 0 || hour > 23 ||
      r[3] < 1 || r[3] > 7 || year < 0 || month < 1 || month > 12) return false;
  year += 2000;
  if (day < 1 || day > month_days(year, month)) return false;
  int64_t days = 10957; // 1970-01-01 to 2000-01-01
  for (int y = 2000; y < year; y++) days += leap(y) ? 366 : 365;
  for (int m = 1; m < month; m++) days += month_days(year, m);
  *epoch = (time_t)((days + day - 1) * 86400 + hour * 3600 + min * 60 + sec);
  return true;
}
bool rtc_encode(time_t epoch, uint8_t r[7]) {
  // DS3231 century-bit dates are deliberately outside this deployment profile.
  if (!r || epoch < (time_t)946684800 || (int64_t)epoch >= INT64_C(4102444800)) return false;
  struct tm utc;
  if (!gmtime_r(&epoch, &utc)) return false;
  r[0] = bcd(utc.tm_sec); r[1] = bcd(utc.tm_min); r[2] = bcd(utc.tm_hour);
  r[3] = (uint8_t)(utc.tm_wday + 1); r[4] = bcd(utc.tm_mday);
  r[5] = bcd(utc.tm_mon + 1); r[6] = bcd(utc.tm_year - 100);
  return true;
}

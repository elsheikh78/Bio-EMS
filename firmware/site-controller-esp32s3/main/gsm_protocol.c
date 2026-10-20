#include "gsm_protocol.h"
#include <stdio.h>
#include <string.h>
bool gsm_phone_valid(const char *phone) {
  if (!phone || phone[0] != '+') return false;
  size_t len = strlen(phone);
  if (len < 9 || len > 16 || phone[1] == '0') return false;
  for (size_t i=1; i<len; i++) if (phone[i] < '0' || phone[i] > '9') return false;
  return true;
}
bool gsm_message_valid(const char *message) {
  if (!message || !*message || strlen(message) > 140) return false;
  for (const unsigned char *p=(const unsigned char *)message; *p; p++) {
    // Deliberately a restricted GSM-7 subset, no Ctrl-Z/ESC/AT injection or extensions.
    if (*p != ' ' && *p != '.' && *p != ':' && *p != '-' &&
        !(*p >= '0' && *p <= '9') && !(*p >= 'A' && *p <= 'Z') &&
        !(*p >= 'a' && *p <= 'z')) return false;
  }
  return true;
}
void gsm_response_feed(gsm_response_t *r, char byte) {
  if (byte == '>' && r->used == 0 && !r->overflow) r->prompt = true;
  if (byte == '\r') return;
  if (byte != '\n') {
    if (r->used + 1 < sizeof(r->line)) r->line[r->used++] = byte;
    else r->overflow = true;
    return;
  }
  r->line[r->used] = 0;
  if (!r->overflow) {
    if (!strcmp(r->line, "OK")) r->ok = true;
    if (!strcmp(r->line, "ERROR") || !strncmp(r->line, "+CMS ERROR:", 11) ||
        !strncmp(r->line, "+CME ERROR:", 11)) r->error = true;
    int n=-1, stat=-1, used=0;
    // Query response requires both mode and status, never an unsolicited one-field URC.
    if (sscanf(r->line, "+CREG: %d,%d%n", &n, &stat, &used) == 2 &&
        n >= 0 && n <= 2 && (stat == 1 || stat == 5) &&
        (!r->line[used] || r->line[used] == ',')) r->registered = true;
    int reference=-1;
    used=0;
    if (sscanf(r->line, "+CMGS: %d%n", &reference, &used) == 1 &&
        reference >= 0 && !r->line[used]) r->sms_reference = true;
  }
  r->used = 0; r->overflow = false;
}

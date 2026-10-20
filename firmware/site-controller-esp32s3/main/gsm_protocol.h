#pragma once
#include <stdbool.h>
#include <stddef.h>
typedef struct {
  char line[192];
  size_t used;
  bool overflow, prompt, ok, error, sms_reference, registered;
} gsm_response_t;
void gsm_response_feed(gsm_response_t *response, char byte);
bool gsm_phone_valid(const char *phone);
bool gsm_message_valid(const char *message);

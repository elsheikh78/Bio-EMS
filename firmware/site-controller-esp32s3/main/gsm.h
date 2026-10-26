#pragma once
#include <stdbool.h>
bool bioems_gsm_diagnostics(void);
// Success means modem/network accepted the message, NOT handset delivery.
// On ambiguous timeout it is not automatically resent (duplicate SMS risk).
bool bioems_gsm_sms(const char *phone, const char *message);

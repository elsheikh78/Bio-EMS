#pragma once
#include <stdbool.h>
bool bioems_https_origin_valid(const char *url);
bool bioems_security_policy_satisfied(bool required, bool secure_boot, bool flash_encryption);

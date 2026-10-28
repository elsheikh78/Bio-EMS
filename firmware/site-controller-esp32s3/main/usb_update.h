#pragma once
#include <stdbool.h>
void bioems_update_init(void);
void bioems_update_poll(void);
void bioems_update_status(void);
bool bioems_update_command(const char *line);

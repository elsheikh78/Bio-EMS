#pragma once
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#define OFFLINE_RECORD_MAX 768
// Single-owner API: only the acquisition task may call these functions.
bool offline_queue_open(const char *directory, unsigned capacity);
bool offline_queue_append(const char *record);
// 1 = record available, 0 = empty, -1 = IO/corruption; never skips bad data.
int offline_queue_peek(char *record, size_t size);
bool offline_queue_ack(void);
unsigned offline_queue_count(void);

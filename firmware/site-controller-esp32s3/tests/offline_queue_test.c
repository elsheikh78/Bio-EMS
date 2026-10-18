#define _POSIX_C_SOURCE 200809L
#include "offline_queue.h"
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
int main(void) {
  char directory[] = "/tmp/bioems-queue-XXXXXX";
  assert(mkdtemp(directory));
  assert(offline_queue_open(directory, 2));
  char record[OFFLINE_RECORD_MAX];
  assert(offline_queue_peek(record, sizeof(record)) == 0);
  assert(offline_queue_append("{\"timestamp\":\"2026-10-18T16:00:00Z\"}"));
  assert(offline_queue_append("second"));
  assert(!offline_queue_append("overflow"));
  // Reboot before acknowledgement must retain the oldest record.
  assert(offline_queue_open(directory, 2));
  assert(offline_queue_count() == 2);
  assert(offline_queue_peek(record, sizeof(record)) == 1);
  assert(strstr(record, "2026-10-18T16:00:00Z"));
  assert(offline_queue_peek(record, sizeof(record)) == 1);
  assert(offline_queue_ack());
  assert(offline_queue_open(directory, 2));
  assert(offline_queue_count() == 1);
  assert(offline_queue_peek(record, sizeof(record)) == 1);
  assert(strcmp(record, "second") == 0);
  char path[256];
  snprintf(path, sizeof(path), "%s/%020d.rec", directory, 1);
  FILE *file = fopen(path, "ab"); assert(file); fputs("corrupted", file); fclose(file);
  assert(offline_queue_peek(record, sizeof(record)) == -1);
  // Corrupt records are not silently skipped or erased.
  assert(offline_queue_count() == 1);
  assert(offline_queue_open(directory, 2));
  assert(offline_queue_peek(record, sizeof(record)) == -1);
  unlink(path);
  assert(offline_queue_open(directory, 2));
  char maximum[OFFLINE_RECORD_MAX];
  memset(maximum, 'x', sizeof(maximum) - 1); maximum[sizeof(maximum) - 1] = 0;
  assert(offline_queue_append(maximum));
  assert(offline_queue_peek(record, sizeof(record)) == 1);
  assert(strcmp(maximum, record) == 0);
  assert(offline_queue_ack());
  assert(offline_queue_open(directory, 2));
  assert(offline_queue_count() == 0);
  rmdir(directory);
  puts("offline queue: capacity, FIFO, reboot, retry, corruption PASS");
}

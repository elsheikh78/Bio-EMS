#include "offline_queue.h"
#include <dirent.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>
#include <inttypes.h>
#include <stdlib.h>

static char root[128];
static uint64_t first, next;
static unsigned count, limit;
static bool opened;
static uint32_t checksum(const char *s) {
  uint32_t hash = 2166136261u;
  while (*s) { hash ^= (unsigned char)*s++; hash *= 16777619u; }
  return hash;
}
static void path_for(char *path, size_t size, uint64_t id) {
  snprintf(path, size, "%s/%020" PRIu64 ".rec", root, id);
}
bool offline_queue_open(const char *directory, unsigned capacity) {
  opened = false;
  if (!capacity || strlen(directory) >= sizeof(root)) return false;
  strcpy(root, directory);
  if (mkdir(root, 0700) != 0) { struct stat st; if (stat(root, &st) || !S_ISDIR(st.st_mode)) return false; }
  DIR *dir = opendir(root);
  if (!dir) return false;
  count = 0; first = UINT64_MAX; next = 0; limit = capacity;
  struct dirent *entry;
  while ((entry = readdir(dir))) {
    uint64_t id; char tail;
    if (strlen(entry->d_name) != 24 || strcmp(entry->d_name + 20, ".rec") ||
        strspn(entry->d_name, "0123456789") != 20 || sscanf(entry->d_name, "%20" SCNu64 ".rec%c", &id, &tail) != 1) continue;
    if (id == UINT64_MAX) { closedir(dir); return false; }
    if (id < first) first = id;
    if (id >= next) next = id + 1;
    count++;
  }
  closedir(dir);
  if (!count) first = next;
  opened = true;
  return true;
}
bool offline_queue_append(const char *record) {
  size_t length = strlen(record);
  if (!opened || count >= limit || next == UINT64_MAX || !length || length >= OFFLINE_RECORD_MAX || strchr(record, '\n')) return false;
  char path[180]; path_for(path, sizeof(path), next);
  // Write final name: a torn record is visible and blocks replay, never silently lost.
  FILE *file = fopen(path, "wb");
  if (!file) return false;
  bool ok = fprintf(file, "%08" PRIx32 "\n%s", checksum(record), record) > 0;
  if (fflush(file) != 0 || fsync(fileno(file)) != 0) ok = false;
  if (fclose(file) != 0) ok = false;
  if (!count) first = next;
  next++; count++;
  return ok;
}
int offline_queue_peek(char *record, size_t size) {
  if (!opened || size < 2) return -1;
  if (!count) return 0;
  char path[180]; path_for(path, sizeof(path), first);
  FILE *file = fopen(path, "rb");
  if (!file) return -1;
  uint32_t expected;
  bool header = fscanf(file, "%8" SCNx32, &expected) == 1 && fgetc(file) == '\n';
  size_t used = fread(record, 1, size - 1, file);
  bool ok = header && used && !ferror(file) && fgetc(file) == EOF && !ferror(file);
  record[used] = 0;
  fclose(file);
  return ok && expected == checksum(record) ? 1 : -1;
}
bool offline_queue_ack(void) {
  if (!opened || !count) return false;
  char path[180]; path_for(path, sizeof(path), first);
  if (unlink(path) != 0) return false;
  first++; count--;
  return true;
}
unsigned offline_queue_count(void) { return count; }

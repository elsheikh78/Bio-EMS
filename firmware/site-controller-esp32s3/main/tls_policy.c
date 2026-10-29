#include "tls_policy.h"
#include <ctype.h>
#include <stdlib.h>
#include <string.h>

bool bioems_https_origin_valid(const char *url) {
  if (!url || strncmp(url, "https://", 8) || !url[8] || strlen(url) >= 192) return false;
  const char *host = url + 8, *end = host + strlen(host);
  if (end[-1] == '/') end--;
  if (host == end) return false;
  for (const char *p = host; p < end; p++)
    if (isspace((unsigned char)*p) || strchr("/@?#\\", *p)) return false;
  const char *port = NULL;
  if (*host == '[') {
    const char *close = memchr(host, ']', (size_t)(end-host));
    if (!close || close == host+1) return false;
    for (const char *p = host+1; p < close; p++)
      if (!isxdigit((unsigned char)*p) && *p != ':' && *p != '.') return false;
    if (close+1 < end) { if (close[1] != ':') return false; port = close+2; }
  } else {
    const char *colon = memchr(host, ':', (size_t)(end-host));
    const char *host_end = colon ? colon : end;
    if (host_end == host) return false;
    for (const char *p = host; p < host_end; p++)
      if (!isalnum((unsigned char)*p) && *p != '-' && *p != '.') return false;
    if (colon) port = colon+1;
  }
  if (port) {
    if (port == end || end-port > 5) return false;
    unsigned number = 0;
    for (const char *p = port; p < end; p++) { if (!isdigit((unsigned char)*p)) return false; number = number*10 + (unsigned)(*p-'0'); }
    if (!number || number > 65535) return false;
  }
  return true;
}
bool bioems_security_policy_satisfied(bool required, bool secure_boot, bool flash_encryption) {
  return !required || (secure_boot && flash_encryption);
}

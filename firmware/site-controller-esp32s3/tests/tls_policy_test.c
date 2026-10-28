#include "tls_policy.h"
#include <assert.h>
#include <stdio.h>
int main(void) {
  const char *valid[] = {"https://ems.local", "https://192.168.1.20:3443", "https://[2001:db8::10]:443/"};
  const char *invalid[] = {"http://ems.local", "https://", "https://ems.local/path", "https://user@ems.local", "https://ems.local?x", "https://ems.local#x", "https://ems.local:0", "https://ems.local:65536", "https://ems.local:abc", "https://ems local", "https://[::1]garbage", "https://[]"};
  for (unsigned i=0;i<sizeof(valid)/sizeof(valid[0]);i++) assert(bioems_https_origin_valid(valid[i]));
  for (unsigned i=0;i<sizeof(invalid)/sizeof(invalid[0]);i++) assert(!bioems_https_origin_valid(invalid[i]));
  assert(!bioems_https_origin_valid(NULL));
  assert(bioems_security_policy_satisfied(false,false,false));
  assert(!bioems_security_policy_satisfied(true,false,true));
  assert(!bioems_security_policy_satisfied(true,true,false));
  assert(bioems_security_policy_satisfied(true,true,true));
  puts("HTTPS origin and production security gate PASS");
}

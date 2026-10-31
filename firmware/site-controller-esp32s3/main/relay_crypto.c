#include "relay_crypto.h"
#include "cJSON.h"
#include "esp_random.h"
#include "mbedtls/gcm.h"
#include "mbedtls/sha256.h"
#include <stdlib.h>
#include <string.h>
static const char hex[] = "0123456789abcdef";
static void encode(const unsigned char *data, size_t n, char *out) {
  for (size_t i = 0; i < n; i++) {
    out[i * 2] = hex[data[i] >> 4];
    out[i * 2 + 1] = hex[data[i] & 15];
  }
  out[n * 2] = 0;
}
static bool decode(const char *s, unsigned char *out, size_t n) {
  if (strlen(s) != n * 2)
    return false;
  for (size_t i = 0; i < n; i++) {
    const char *a = strchr(hex, s[i * 2]), *b = strchr(hex, s[i * 2 + 1]);
    if (!a || !b)
      return false;
    out[i] = (a - hex) * 16 + (b - hex);
  }
  return true;
}
bool relay_encrypt(const char *binding, const char *token, const char *plain,
                   char *out, size_t capacity) {
  size_t n = strlen(plain);
  if (n > 1536)
    return false;
  unsigned char key[32], iv[12], tag[16], cipher[1536];
  char ivhex[25], taghex[33], cipherhex[3073];
  if (mbedtls_sha256((const unsigned char *)token, strlen(token), key, 0))
    return false;
  esp_fill_random(iv, sizeof(iv));
  mbedtls_gcm_context ctx;
  mbedtls_gcm_init(&ctx);
  int rc = mbedtls_gcm_setkey(&ctx, MBEDTLS_CIPHER_ID_AES, key, 256);
  if (!rc)
    rc = mbedtls_gcm_crypt_and_tag(
        &ctx, MBEDTLS_GCM_ENCRYPT, n, iv, sizeof(iv),
        (const unsigned char *)binding, strlen(binding),
        (const unsigned char *)plain, cipher, sizeof(tag), tag);
  mbedtls_gcm_free(&ctx);
  memset(key, 0, sizeof(key));
  if (rc)
    return false;
  encode(iv, sizeof(iv), ivhex);
  encode(tag, sizeof(tag), taghex);
  encode(cipher, n, cipherhex);
  cJSON *root = cJSON_CreateObject();
  cJSON_AddStringToObject(root, "binding", binding);
  cJSON_AddStringToObject(root, "nonce", ivhex);
  cJSON_AddStringToObject(root, "data", cipherhex);
  cJSON_AddStringToObject(root, "tag", taghex);
  char *json = cJSON_PrintUnformatted(root);
  bool ok = json && strlen(json) < capacity;
  if (ok)
    strcpy(out, json);
  free(json);
  cJSON_Delete(root);
  return ok;
}
bool relay_decrypt(const char *binding, const char *token, const char *envelope,
                   char *out, size_t capacity) {
  cJSON *root = cJSON_Parse(envelope);
  if (!root)
    return false;
  cJSON *b = cJSON_GetObjectItem(root, "binding"),
        *iv = cJSON_GetObjectItem(root, "nonce"),
        *data = cJSON_GetObjectItem(root, "data"),
        *tag = cJSON_GetObjectItem(root, "tag");
  bool ok = cJSON_IsString(b) && !strcmp(b->valuestring, binding) &&
            cJSON_IsString(iv) && cJSON_IsString(data) && cJSON_IsString(tag);
  unsigned char key[32], nonce[12], auth[16], cipher[1536];
  size_t n = ok ? strlen(data->valuestring) / 2 : 0;
  ok = ok && n < capacity && n <= sizeof(cipher) &&
       decode(iv->valuestring, nonce, 12) &&
       decode(tag->valuestring, auth, 16) &&
       decode(data->valuestring, cipher, n);
  if (ok) {
    mbedtls_gcm_context ctx;
    mbedtls_gcm_init(&ctx);
    ok = !mbedtls_sha256((const unsigned char *)token, strlen(token), key, 0) &&
         !mbedtls_gcm_setkey(&ctx, MBEDTLS_CIPHER_ID_AES, key, 256) &&
         !mbedtls_gcm_auth_decrypt(
             &ctx, n, nonce, 12, (const unsigned char *)binding,
             strlen(binding), auth, 16, cipher, (unsigned char *)out);
    mbedtls_gcm_free(&ctx);
    memset(key, 0, sizeof(key));
    if (ok)
      out[n] = 0;
  }
  cJSON_Delete(root);
  return ok;
}

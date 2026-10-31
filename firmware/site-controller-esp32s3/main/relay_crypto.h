#pragma once
#include <stddef.h>
#include <stdbool.h>
bool relay_encrypt(const char *binding,const char *token,const char *plain,char *out,size_t capacity);
bool relay_decrypt(const char *binding,const char *token,const char *envelope,char *out,size_t capacity);

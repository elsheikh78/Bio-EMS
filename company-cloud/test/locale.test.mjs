import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { messages, translate } from "../public/locale.js";

test("portal markup and dynamic UI strings have Arabic and English translations", () => {
  const html = readFileSync(
    new URL("../public/index.html", import.meta.url),
    "utf8",
  );
  const js = readFileSync(
    new URL("../public/portal.js", import.meta.url),
    "utf8",
  );
  const keys = [
    ...html.matchAll(/data-i18n="([^"]+)"/g),
    ...js.matchAll(/\bt\("([^"]+)"/g),
  ].map((m) => m[1]);
  for (const key of keys) {
    assert.ok(messages[key], key);
    assert.ok(translate("ar", key).trim(), key);
    assert.ok(translate("en", key).trim(), key);
  }
  for (const [key, pair] of Object.entries(messages)) {
    assert.equal(pair.length, 2, key);
    assert.deepEqual(
      [...pair[0].matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort(),
      [...pair[1].matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort(),
      key,
    );
  }
  assert.equal(
    translate("en", "editLicense", { site: "<Site>" }),
    "Renew / edit license for <Site>",
  );
});

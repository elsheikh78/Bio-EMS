import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COMPANY_HOME,
  isCompanyUrl,
  isDocumentFailure,
} from "../src/navigation";

test("company portal and selected site's System Owner stay within the app", () => {
  for (const path of [
    "",
    "system-owner/login",
    "system-owner/settings?tab=licenses",
    "viewer/",
  ]) {
    assert.equal(isCompanyUrl(`${COMPANY_HOME}${path}`), true);
  }
});

test("API authentication errors do not hide the portal's own login or validation UI", () => {
  assert.equal(
    isDocumentFailure(COMPANY_HOME, `${COMPANY_HOME}api/company/sites`, 401),
    false,
  );
  assert.equal(
    isDocumentFailure(COMPANY_HOME, `${COMPANY_HOME}portal.js`, 404),
    false,
  );
  assert.equal(isDocumentFailure(COMPANY_HOME, COMPANY_HOME, 200), false);
  assert.equal(
    isDocumentFailure(`${COMPANY_HOME}#sites`, COMPANY_HOME, 503),
    true,
  );
  assert.equal(
    isDocumentFailure(COMPANY_HOME, "https://evil.test/", 503),
    false,
  );
});

test("external, credential-bearing and non-HTTPS destinations are blocked", () => {
  for (const url of [
    "http://bioems-company.bioems-egypt.workers.dev/",
    "https://bioems-company.bioems-egypt.workers.dev.evil.test/",
    "https://bioems-company.bioems-egypt.workers.dev@evil.test/",
    "https://evil.test/?next=" + COMPANY_HOME,
    "https://user:password@bioems-company.bioems-egypt.workers.dev/",
    "https://bioems-company.bioems-egypt.workers.dev:8443/",
    "javascript:alert(1)",
    "file:///etc/passwd",
    "data:text/html,test",
    "intent://settings",
    "about:blank",
    "//evil.test",
    "not a URL",
  ])
    assert.equal(isCompanyUrl(url), false, url);
});

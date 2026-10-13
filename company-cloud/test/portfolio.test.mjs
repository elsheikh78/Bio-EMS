import { test } from "node:test";
import assert from "node:assert/strict";
import { currentPortfolio } from "../public/portfolio.js";
test("current portfolio excludes revoked enrollments and their licenses, preserving offline and pending sites", () => {
  const state = {
    sites: [
      { id: "old", name: "Elmanial", revoked: 1 },
      { id: "new", name: "Elmanial", revoked: 0, connection: "online" },
      { id: "off", revoked: 0, connection: "offline" },
      { id: "pending", revoked: 0, connection: "pending" },
    ],
    licenses: [
      { id: "historical", site_id: "old" },
      { id: "current", site_id: "new" },
      { id: "offline-license", site_id: "off" },
    ],
  };
  const current = currentPortfolio(state);
  assert.deepEqual(
    current.sites.map((s) => s.id),
    ["new", "off", "pending"],
  );
  assert.deepEqual(
    current.licenses.map((l) => l.id),
    ["current", "offline-license"],
  );
  assert.equal(state.sites.length, 4);
  assert.equal(state.licenses.length, 3);
  assert.deepEqual(
    currentPortfolio({
      sites: [{ id: "old", revoked: 1 }],
      licenses: [{ site_id: "old" }],
    }),
    { sites: [], licenses: [] },
  );
});

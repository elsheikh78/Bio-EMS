PRAGMA foreign_keys = ON;
CREATE TABLE customers (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE sites (
  id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES customers(id),
  name TEXT NOT NULL, agent_hash TEXT NOT NULL, public_key TEXT,
  heartbeat TEXT, last_seen INTEGER, revoked INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE licenses (
  id TEXT PRIMARY KEY, site_id TEXT NOT NULL REFERENCES sites(id),
  starts_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
  sensor_limit INTEGER NOT NULL, device_limit INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('trial','active','suspended')),
  created_at INTEGER NOT NULL
);
CREATE INDEX licenses_site ON licenses(site_id);
CREATE TABLE jobs (
  id TEXT PRIMARY KEY, site_id TEXT NOT NULL REFERENCES sites(id),
  envelope TEXT NOT NULL, result TEXT,
  state TEXT NOT NULL CHECK(state IN ('queued','claimed','completed','expired')),
  created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX jobs_poll ON jobs(site_id,state,created_at);
CREATE TABLE audit (
  id TEXT PRIMARY KEY, action TEXT NOT NULL, target TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE INDEX audit_created ON audit(created_at);
CREATE TABLE login_attempts (bucket TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL);

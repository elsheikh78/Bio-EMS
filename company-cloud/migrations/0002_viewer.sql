CREATE TABLE viewer_users (
 id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES customers(id),
 username TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password_hash TEXT NOT NULL,
 disabled INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
);
CREATE TABLE viewer_sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES viewer_users(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL
);
CREATE TABLE viewer_snapshots (
 site_id TEXT PRIMARY KEY REFERENCES sites(id) ON DELETE CASCADE,
 payload TEXT NOT NULL, received_at INTEGER NOT NULL
);
CREATE TABLE viewer_subscriptions (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES viewer_users(id) ON DELETE CASCADE,
 endpoint TEXT NOT NULL UNIQUE, subscription TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE viewer_push_jobs (
 id TEXT PRIMARY KEY, site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
 subscription_id TEXT NOT NULL REFERENCES viewer_subscriptions(id) ON DELETE CASCADE,
 alarm_key TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0,
 next_at INTEGER NOT NULL, created_at INTEGER NOT NULL, UNIQUE(site_id, subscription_id, alarm_key)
);
CREATE INDEX viewer_push_due ON viewer_push_jobs(state,next_at);
CREATE INDEX viewer_sessions_expiry ON viewer_sessions(expires_at);

-- Revocable company cookies; legacy stateless cookies require a fresh login.
CREATE TABLE company_sessions (
  token_hash TEXT PRIMARY KEY,
  admin_key_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX company_sessions_expiry ON company_sessions(expires_at);

# AUTH-RECOVERY-01 — Password Recovery Security Model

Status: IMPLEMENTATION IN PROGRESS  
Tracking: #236

## Invariants

1. BIO-EMS never retrieves or displays an existing password. Recovery always means password reset.
2. Passwords and password hashes must never be written to recovery audit records, logs, screenshots, URLs, or recovery packages.
3. Customer ADMIN authority must never reset, commission, or impersonate SYSTEM_OWNER.
4. There is no master password or universal recovery credential.
5. Manufacturer signing private keys remain offline and never enter GitHub, CI, Setup, logs, or customer machines.

## Customer users

VIEWER and OPERATOR recovery is ADMIN-controlled. The reset produces a new credential and sets `password_change_required=1`. The user must choose a compliant private password before normal authenticated use continues.

ADMIN recovery has two paths:

- while another authorized ADMIN remains available, an authorized administrative reset may be used subject to audit and forced change;
- when administrative access is completely lost, a local Windows Administrator recovery procedure may reset an existing ADMIN only. It must not create users, change roles, or touch SYSTEM_OWNER state.

## Forgot password entry point

The login page exposes `Forgot password? / نسيت كلمة المرور؟`.

The public request endpoint must use a generic response regardless of whether a username exists. It must not disclose role, status, email, installation details, or account existence. Rate limiting applies to the public request path.

For customer accounts, a request becomes an administrative recovery item; it does not email or expose a reusable password automatically.

## SYSTEM_OWNER recovery

SYSTEM_OWNER recovery is manufacturer-controlled. A customer installation may generate a recovery challenge/request containing only non-secret identifiers required to bind the operation to that installation. Manufacturer tooling signs an expiring recovery authorization offline. The installation verifies it using trusted manufacturer public-key material before allowing a new SYSTEM_OWNER password to be set.

A recovery authorization must be installation-bound, purpose-bound, expiring, one-time-use, and auditable. ADMIN cannot approve it.

## Persistence

Migration 028 introduces:

- `users.password_change_required`;
- `password_recovery_requests` for lifecycle state;
- `password_recovery_audit` for security evidence.

Recovery records contain no passwords or password hashes.

## Acceptance gates

AUTH-RECOVERY-01 is not accepted until automated tests and a clean Windows Pilot Setup prove:

- Forgot Password is present in Arabic and English;
- public requests do not enumerate accounts;
- ADMIN can reset an eligible customer user and forced password change is enforced;
- local ADMIN recovery resets only an existing ADMIN;
- SYSTEM_OWNER recovery requires valid manufacturer authorization and rejects wrong-installation, expired, replayed, or invalid signatures;
- all recovery paths produce secret-free audit evidence;
- normal login remains compatible after migration 028.

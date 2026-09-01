# SYSTEM_OWNER Bootstrap and Platform JWT Runbook

**Date:** 1 September 2026  
**Scope:** local development and controlled deployment preparation for the isolated BIO-EMS SYSTEM_OWNER trust domain.

## Purpose

The SYSTEM_OWNER account is intentionally separate from customer `ADMIN`, `OPERATOR`, and `VIEWER` accounts. Customer credentials must not be reused for the owner console. The owner frontend is reached through `/system-owner/login` and is backed by the separate `/api/v1/platform-auth` authentication contract.

This runbook documents the supported one-time owner bootstrap, Platform JWT configuration, restart requirements, verification, and troubleshooting without storing real credentials or secrets in Git.

## Security Rules

- Never commit a SYSTEM_OWNER password, Platform JWT secret, access token, or generated `.env` file.
- `.env` and `backend/.env` are ignored by repository policy and may be used only for controlled local configuration.
- Do not keep the one-time bootstrap password in `backend/.env` after the owner has been created.
- Production secrets must come from the host/service secret-management mechanism, not repository files.
- The backend derives SYSTEM_OWNER actor identity from the authenticated platform principal. Do not add client-supplied actor identity fields.
- There may be only one SYSTEM_OWNER record. A repeated bootstrap is expected to fail.

## Password Policy

The bootstrap uses the same controlled password service as the rest of the backend. A new password must:

- contain at least 12 Unicode characters;
- use no more than 72 UTF-8 bytes;
- contain at least one uppercase ASCII letter;
- contain at least one lowercase ASCII letter;
- contain at least one digit.

Passwords are stored as bcrypt hashes with cost 12. Do not print or log the plaintext password.

## One-Time Local SYSTEM_OWNER Bootstrap

Run from `C:\Users\BioHome\bio-ems-project\backend` or the equivalent local backend directory.

Use PowerShell secure input so the password is not typed into command history:

```powershell
$OwnerPassword = Read-Host "Enter SYSTEM_OWNER password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($OwnerPassword)

try {
    $env:BIOEMS_BOOTSTRAP_SYSTEM_OWNER_USERNAME = "system-owner"
    $env:BIOEMS_BOOTSTRAP_SYSTEM_OWNER_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($BSTR)

    npm run bootstrap:system-owner
}
finally {
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    Remove-Item Env:BIOEMS_BOOTSTRAP_SYSTEM_OWNER_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:BIOEMS_BOOTSTRAP_SYSTEM_OWNER_USERNAME -ErrorAction SilentlyContinue
}
```

Expected successful message:

```text
System owner created
```

The bootstrap initializes required SQLite tables/migrations, hashes the password through the controlled password service, generates the owner ID, and writes the single active `SYSTEM_OWNER` principal. If an owner already exists, the command intentionally fails rather than creating another privileged identity.

## Verify the Owner Record Without Exposing Credentials

```powershell
node -e "const Database=require('better-sqlite3'); const db=new Database('database/bioems.db',{readonly:true}); console.table(db.prepare('SELECT id, principal_type, username, status FROM platform_principals').all());"
```

Expected properties are:

```text
principal_type  SYSTEM_OWNER
username        system-owner
status          active
```

Do not query or display `password_hash` during routine verification.

## Platform JWT Configuration

SYSTEM_OWNER login requires the separate Platform JWT configuration. `BIOEMS_PLATFORM_JWT_SECRET` must contain at least 32 UTF-8 bytes. The optional expiry, issuer, and audience values have backend defaults, but controlled environments should state them explicitly.

For a local development secret, generate cryptographically random bytes rather than using a hard-coded value:

```powershell
$bytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$PlatformJwtSecret = [Convert]::ToBase64String($bytes)
```

For the current PowerShell process:

```powershell
$env:BIOEMS_PLATFORM_JWT_SECRET = $PlatformJwtSecret
$env:BIOEMS_PLATFORM_JWT_EXPIRE_MINUTES = "60"
$env:BIOEMS_PLATFORM_JWT_ISSUER = "bio-ems-platform"
$env:BIOEMS_PLATFORM_JWT_AUDIENCE = "bio-ems-platform-api"
```

For persistent **local development only**, place the values in the ignored `backend/.env` file so a normal backend restart can load them through dotenv:

```dotenv
BIOEMS_PLATFORM_JWT_SECRET=<generated-secret-at-least-32-bytes>
BIOEMS_PLATFORM_JWT_EXPIRE_MINUTES=60
BIOEMS_PLATFORM_JWT_ISSUER=bio-ems-platform
BIOEMS_PLATFORM_JWT_AUDIENCE=bio-ems-platform-api
```

Do not add `BIOEMS_BOOTSTRAP_SYSTEM_OWNER_PASSWORD` to the persistent `.env` file. After the one-time bootstrap, it is no longer required.

## Restart Requirement

Platform JWT configuration is loaded when the backend process starts. Changing environment variables does not reconfigure an already-running process.

If port 3001 is occupied by an older backend process, identify and stop that process, then start the backend from the environment that contains the required Platform JWT settings:

```powershell
$pid3001 = (Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue).OwningProcess
if ($pid3001) {
    Stop-Process -Id $pid3001 -Force
}

npm run dev
```

For deployed service/process managers, inject the Platform JWT variables into the service environment and restart the managed backend using the controlled deployment procedure.

## API Verification

From another PowerShell window, test the login without writing the password into command history:

```powershell
$Password = Read-Host "SYSTEM_OWNER password"
$Body = @{
    username = "system-owner"
    password = $Password
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:3001/api/v1/platform-auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $Body
```

A successful response contains a bearer access token and a platform principal with `type = SYSTEM_OWNER`. Treat the returned token as a secret; do not paste it into tickets, documentation, screenshots, chat, or Git.

Then validate the frontend at:

```text
http://localhost:5173/system-owner/login
```

A customer `admin` account is not valid for this page by design.

## Troubleshooting

### `PLATFORM_AUTH_UNAVAILABLE`

The backend process serving the request does not currently have a usable Platform JWT configuration. Confirm `BIOEMS_PLATFORM_JWT_SECRET` exists in the process environment or ignored `backend/.env`, then restart the backend. Also check that an older process is not still holding port 3001.

### `INVALID_CREDENTIALS` / System Owner authentication failed

Confirm the username is the bootstrapped SYSTEM_OWNER username, the password is correct, the principal status is `active`, and the request is going to `/platform-auth/login` rather than customer `/auth/login`.

### `System owner bootstrap failed`

Typical controlled causes are missing bootstrap environment variables, a password that does not satisfy policy, or an existing SYSTEM_OWNER. Inspect the owner table using the read-only verification query before attempting any database changes.

## Operational Boundary

Successful SYSTEM_OWNER login proves only the software authentication path and local configuration. It does not prove production deployment, customer acceptance, billing/payment settlement, live remote update execution, physical installation, hardware qualification, field commissioning, provider delivery, or UAT.

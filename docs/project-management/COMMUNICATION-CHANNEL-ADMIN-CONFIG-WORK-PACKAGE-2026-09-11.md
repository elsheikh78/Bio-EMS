# BIO-EMS Communication Channel Administration Work Package

**Status:** APPROVED / PLANNED — implementation not yet claimed  
**Decision date:** 11 September 2026  
**Target:** Controlled pilot completion before pilot closure  
**Parent area:** Customer Configuration / Alarm Notification Infrastructure

## 1. Objective

Provide an Admin/System Owner managed configuration surface for alarm-delivery provider connectivity so operational staff can replace or update Email, Telegram, WhatsApp and SMS/GSM connection details without editing source code, PowerShell environment variables, deployment files or rebuilding the installer.

This work package complements the existing Notification Recipient Directory and Escalation Policy configuration. It does not replace them.

## 2. Approved navigation

`Configuration -> Communication Channels`

The page shall be available only to authorized configuration roles:

- SYSTEM_OWNER
- ADMIN

Operator and Viewer roles shall not be permitted to change provider credentials or transport configuration.

## 3. Supported channels

### Email / SMTP

Configurable fields shall include, as applicable:

- enabled/disabled;
- SMTP host;
- SMTP port;
- transport security/encryption mode;
- sender display name;
- sender address;
- username;
- password/app password/secret;
- timeout/retry settings where supported;
- Test Email action.

### Telegram

Configurable fields shall include:

- enabled/disabled;
- Bot Token;
- destination Chat ID / target;
- Test Telegram action.

### WhatsApp / Meta

Configurable fields shall include, where required by the selected provider contract:

- enabled/disabled;
- provider type;
- Phone Number ID;
- Business Account ID;
- Access Token;
- sender/default number identity;
- Test WhatsApp action.

The current external Meta registration blocker remains separate from source implementation status.

### SMS / GSM

The design shall support the selected deployment transport without hard-coding one modem/vendor implementation.

Configuration may include:

- enabled/disabled;
- transport type: local modem/SIM or HTTP SMS provider;
- SIM/mobile number metadata;
- mobile operator/network metadata;
- modem/COM port when applicable;
- APN when applicable;
- HTTP provider endpoint/account metadata when applicable;
- Test SMS action.

## 4. Routing and failover

The configuration shall support explicit channel availability and ordered fallback/priority, for example:

`WhatsApp -> Telegram -> Email -> SMS`

The exact dispatch semantics must remain compatible with the existing escalation engine and durable delivery jobs.

Changing provider connectivity must not silently alter recipient eligibility, severity rules, Site scope or escalation timing.

## 5. Secret-handling requirements

Provider secrets must not be stored or returned as ordinary plaintext configuration.

Required behavior:

- encrypt/protect provider secrets at rest using the deployment security boundary;
- never write tokens/passwords to logs, audit payloads, health reports or exported diagnostics;
- frontend receives masked/redacted representations only;
- an existing secret may remain unchanged without being re-entered;
- replacing a secret requires an explicit new value;
- API responses must not expose reversible secret material;
- backup/restore handling must preserve confidentiality and integrity.

The work package must reuse the strongest existing BIO-EMS protected local configuration/secret-storage primitive where practical rather than inventing a weaker parallel mechanism.

## 6. Administration and audit

All channel configuration mutations shall be authenticated, authorized and auditable.

Audit evidence shall record:

- actor identity;
- role;
- timestamp;
- channel/provider changed;
- action type;
- success/failure;
- non-secret configuration delta or redacted change evidence.

Audit records must never include passwords, access tokens, bot tokens or equivalent credentials.

## 7. Runtime behavior

Provider settings shall be reloadable without a full application rebuild.

Preferred acceptance behavior:

- Save validates the configuration contract;
- provider runtime picks up the new configuration through controlled reload/reinitialization;
- Test Connection/Test Message validates the effective configuration;
- validation failures are shown without exposing secrets;
- failed edits do not destroy the last known-good configuration where rollback is possible;
- settings survive service restart/reboot;
- configuration changes do not require a new BIO-EMS Setup package.

If a specific provider cannot safely hot-reload, a controlled service restart may be used and must be clearly indicated.

## 8. Existing boundaries to preserve

The following existing domains remain authoritative:

- Notification Recipients define who may receive messages.
- Escalation Policies define severity, recipient-role, Site scope, delay and channel selection.
- Delivery jobs provide durable provider-dispatch evidence.
- Email and Telegram live end-to-end Alarm delivery evidence from 9 September 2026 remains valid.
- WhatsApp live acceptance remains externally blocked by Meta.
- SMS live delivery evidence remains open.

This work package adds provider connection administration; it must not rewrite existing evidence as though all channels are live-qualified.

## 9. Proposed implementation sequence

### COM-01 — Configuration domain and secure storage

- provider/channel configuration schema;
- encrypted/redacted secret fields;
- migration/data model;
- validation rules;
- repository/service layer;
- no-secret logging tests.

### COM-02 — RBAC-protected API

- GET effective redacted settings;
- PATCH/PUT provider configuration;
- enable/disable channel;
- channel ordering/failover configuration;
- ADMIN + SYSTEM_OWNER mutation authorization;
- negative RBAC and secret-disclosure tests.

### COM-03 — Provider runtime integration

- Email provider reads managed configuration;
- Telegram provider reads managed configuration;
- WhatsApp provider reads managed configuration;
- SMS/GSM provider abstraction reads managed configuration;
- safe reload/restart behavior;
- backward-compatible transition from deployment environment values where required.

### COM-04 — Configuration UI

- `Configuration -> Communication Channels`;
- Email, Telegram, WhatsApp and SMS/GSM cards/sections;
- masked secret inputs;
- enable/disable;
- Save/Cancel;
- provider validation states;
- Arabic/English and RTL/LTR support;
- light/dark responsive design.

### COM-05 — Test actions and diagnostics

- Test Email;
- Test Telegram;
- Test WhatsApp;
- Test SMS;
- safe result messages;
- no-secret diagnostics/audit evidence.

### COM-06 — Failover and operational regression

- ordered channel fallback/priority;
- non-regression of recipient/escalation semantics;
- durable-delivery integration;
- reboot persistence;
- provider failure behavior;
- audit verification;
- full backend/frontend CI gates.

### COM-07 — Pilot acceptance

Required acceptance evidence before this package is marked complete:

- Admin can replace Email credentials and send a test without rebuild;
- Admin can replace Telegram Bot/Chat configuration and send a test without rebuild;
- WhatsApp fields can be changed and validated at source level even if Meta remains externally blocked;
- SMS/GSM configuration can be changed according to the implemented transport;
- secrets are not visible in API responses/logs/audit;
- Operator/Viewer cannot mutate provider settings;
- reboot preserves effective configuration;
- channel failover behaves according to configured order;
- existing live Email/Telegram Alarm path remains functional;
- bilingual RTL/LTR UI passes regression.

## 10. Release/evidence rule

This document is an approved implementation requirement, not implementation evidence.

No COM item may be marked complete until its source, automated tests, PR/CI and merge evidence exist. External provider acceptance remains a separate evidence gate.

## 11. Pilot priority

This work package is approved as a pilot-completion requirement because normal operation must not require PowerShell or deployment-file edits when a SIM, Email account, Telegram bot/target or WhatsApp account changes.

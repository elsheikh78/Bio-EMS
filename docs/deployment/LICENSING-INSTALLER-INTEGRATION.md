# Licensing Installer Integration Contract

> Documentation review: 2026-10-28. Retained specification/policy; requirements are not proof of implementation. [Current implementation guide](<../current/SECURITY-AND-IDENTITY.md>) describes the reviewed source baseline; [Project state](<../../PROJECT_STATE.md>) controls current status. [Original pre-audit document](<../archive/2026-10-28-pre-audit/docs/deployment/LICENSING-INSTALLER-INTEGRATION.md>) preserves the unmodified earlier text. Claims below retain their original evidence date and do not establish current deployment or acceptance.


**Work package:** LIC-11  
**Scope:** DEP-01 integration contract; not DEP-01 installer qualification

## Required installation sequence

The Windows installer must run the licensing provisioning hook exactly once, after the
final BIO-EMS Windows service identity and protected data paths exist and before any
activation request is accepted.

1. Create ACL-protected persistent directories owned by the final service identity.
2. Set `BIOEMS_INSTALLATION_IDENTITY_PATH` and
   `BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH` to different persistent files.
3. Run `npm run licensing:provision-installation` under the final service identity.
4. Treat a non-zero exit code as an installation failure; do not retry by deleting or
   replacing an existing identity.
5. Retain the secret-free receipt as installation evidence and submit its Installation
   ID and public identity through the controlled activation workflow.

On Windows, the private installation key is protected with DPAPI `CurrentUser`.
Provisioning under a temporary installer account would therefore make the installed
service unable to use the key and is prohibited.

The hook creates only `NEW_UNACTIVATED_IDENTITY`. It never embeds a license, activation
receipt, signing private key, shared secret or reusable identity in the installer.
Both identity and receipt use create-only writes, so Repair and Upgrade must preserve
them rather than invoke first-install provisioning again. Uninstall must follow the
DEP-01 retained-customer-data decision and must not silently make a copied identity a
new licensed installation.

The machine-readable contract is
`deployment/windows/licensing-provisioning.contract.json`.

## Acceptance boundary

Automated repository tests verify fresh provisioning, uniqueness, create-only
behavior, secret-free evidence and failure of a copied protected identity under a
different KEK. DEP-01 must still execute this contract on clean supported Windows
machines and retain installer, Repair, Upgrade, rollback and Uninstall evidence before
the Production Installer can be qualified.

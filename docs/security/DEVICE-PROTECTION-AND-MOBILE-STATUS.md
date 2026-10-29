# Device protection and mobile dependency status

29 October 2026. Implementation evidence is distinct from production acceptance.

## Main protection boundary

Main pilot.9 reports actual `secure-boot-enabled` and `flash-encryption-enabled` values through ESP-IDF runtime APIs, plus required TLS identity checking. Tester 0.6.2 captures these fields without modifying the device. Missing, duplicate or malformed values remain unknown; even enabled flags are `REPORTED_ENABLED_NOT_ATTESTED`, never automatic production acceptance.

The optional `sdkconfig.production-gate` overlay enables `CONFIG_BIOEMS_REQUIRE_PRODUCTION_SECURITY`. That build refuses application startup unless both actual hardware protections report enabled. It does not generate keys, sign images, enable encryption, burn eFuses, disable debug/download access or configure recovery. The default pilot build remains usable for reversible qualification.

Production closure still requires owner-controlled signing keys and custody, unique device encryption keys, compatible signed bootloader/app/OTA/recovery images, manufacturing/eFuse records linked to hardware UID, independent ROM/eFuse verification, clone/revocation policy and tested recovery on designated hardware. Full device PKI/mTLS remains open. Do not enable irreversible hardware settings on an unidentified field board through an ordinary Tester flash.

## Mobile dependencies

Both Expo 57 app locks received compatible Zod/node-forge/deepmerge updates; app/SDK versions and declared API contracts remain unchanged. Each full npm audit now has eight affected package entries (three High, five Low), down from nine (four High, five Low). This is a package-entry count, not eight independently reachable exploits. Remaining entries are Expo CLI/config/build tooling and their Zod/deepmerge dependency chains. Backend/frontend/company-cloud zero-entry scans do not imply mobile clearance.

Do not apply the registry's suggested Expo 51 downgrade or force Zod 4 into Expo's Zod 3 contract. Both typechecks, three app tests each, `expo install --check`, and Android/iOS exports with source maps passed locally. Vendor/tooling advisories remain tracked pending a supported Expo fix or reviewed upgrade. Export success does not establish native device acceptance, iOS signing, background notifications or store approval.

## Database deployment

Migration `company-cloud/migrations/0003_company_sessions.sql` is additive. Before deployment identify the intended Cloudflare account and configured `bioems-company` D1 database, obtain a recoverable export or Time Travel bookmark and record it privately, inspect pending migrations, then apply 0003 before the matched Worker. Verify table/index presence and login/logout/copied-cookie rejection; retain deployment identifiers and backup evidence without secrets. Old stateless-Worker rollback requires session-secret rotation to invalidate copied legacy cookies.

No remote D1 migration, Worker deployment, existing-PC certificate replacement or physical protection activation has been performed by this source work. Cloudflare authentication is required for the remote steps. Production migration acceptance must record the actual database and deployment result rather than a local test.

## Integrated follow-up

PR #313 is merged. All nine workflows on acf2b6e passed, including native Windows certificate rotation and failure recovery, both Main build profiles and complete installer lifecycle checks. The [execution guide](SECURITY-OPERATIONS-AR.md) covers D1 deployment, certificate/server/controller trust rollout, separate A/B USB maintenance and owner-side signing-key preparation. Physical validation, live operations, key custody, production NVS protection and authenticated/disabled mutating USB-console policy remain open. Secure Boot/encryption flags alone do not close those controls.

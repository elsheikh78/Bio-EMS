# BIO-EMS Device Identity, Registration & Platform Trust

**Status:** Approved security architecture; not yet implementation evidence  
**Decision date:** 2026-09-11  
**Applies to:** ESP32-based Site Controller v1 and any future BIO-EMS gateway/controller

## 1. Decision

BIO-EMS shall accept telemetry and control traffic only from an individually registered controller whose cryptographic identity is authorized for the licensed Customer and Site.

A controller must **not** carry the platform/server private key and must not share one reusable client certificate with other controllers. Instead, trust is based on a private BIO-EMS certificate hierarchy:

- the platform/server presents its own TLS server certificate;
- every controller has its own non-exportable private key and unique client certificate;
- both certificates chain to BIO-EMS-controlled certificate authorities;
- the MQTT/API channel uses mutual TLS (mTLS);
- the backend also checks the controller registry, status, Site binding and license entitlements.

The intended trust chain is:

`BIO-EMS Root CA → Server CA → Installation server certificate`

`BIO-EMS Root CA → Device CA → Unique controller certificate`

Sharing the same private key or certificate between the platform and devices is explicitly forbidden.

## 2. Security objectives

The design must prevent or detect:

1. an unknown ESP32 publishing readings to BIO-EMS;
2. a copied MQTT username/password being used by another controller;
3. one valid controller being moved to another Customer or Site without authorization;
4. a cloned controller identity being used simultaneously;
5. a copied platform installation accepting arbitrary third-party hardware;
6. a revoked, replaced or lost controller reconnecting as valid;
7. a platform-PC replacement unnecessarily requiring all field controllers to be re-provisioned.

## 3. Per-controller identity

Each manufactured/provisioned controller receives:

- immutable `device_id`;
- generated public/private key pair;
- unique X.509 client certificate;
- certificate serial number;
- Customer ID and Site ID assignment held by the authoritative registry;
- model/hardware revision and firmware identity;
- lifecycle status: `PENDING`, `ACTIVE`, `SUSPENDED`, `REVOKED`, `REPLACED`;
- optional secure-element/eFuse identity evidence.

The private key must be generated on the controller where possible and must never be stored in GitHub, the installer, the customer database, firmware source, shared configuration, or an exportable provisioning spreadsheet.

## 4. ESP32 key protection profiles

### Minimum acceptable profile

For capable ESP32 variants:

- Secure Boot enabled;
- Flash Encryption enabled;
- security eFuses irreversibly configured only after controlled production validation;
- encrypted NVS or equivalent protected credential storage;
- debug/download interfaces restricted according to the recovery policy;
- signed firmware and anti-rollback policy.

### Preferred commercial profile

Use a hardware secure element, such as an appropriate ATECC608-class device or equivalent, so the controller private key is generated and used without being exportable.

The exact ESP32 model and production tooling must be confirmed before irreversible eFuse operations. Development boards must not be permanently locked until firmware recovery, manufacturing and replacement procedures have passed validation.

## 5. Mutual TLS connection

For normal communication:

1. the controller validates the platform/server certificate and expected hostname;
2. the platform/MQTT broker requests the controller client certificate;
3. the controller proves possession of its private key during the TLS handshake;
4. the broker/backend validates the client certificate chain, validity and revocation status;
5. the backend maps the certificate fingerprint/serial to exactly one `device_id`;
6. the backend checks that the device is `ACTIVE`, licensed and assigned to the claimed Site;
7. the backend authorizes only that device's topic namespace.

Example topic boundary:

`bioems/v1/customers/{customer_id}/sites/{site_id}/devices/{device_id}/telemetry`

Certificate authentication is necessary but not sufficient: application authorization must reject a valid certificate used against the wrong Customer, Site, device ID or topic.

## 6. Provisioning workflow

1. Create the device record as `PENDING`.
2. Generate the device key on-device where supported.
3. Produce a certificate signing request (CSR).
4. Approve provisioning using a short-lived, single-use commissioning token or controlled wired factory procedure.
5. BIO-EMS Device CA issues the unique client certificate.
6. Bind its fingerprint/serial to Customer, Site, installation and `device_id`.
7. Deliver the CA trust bundle and endpoint configuration.
8. Require an authenticated commissioning challenge/response.
9. Mark the device `ACTIVE` only after successful receipt, configuration checksum acknowledgement and commissioning evidence.
10. Record all steps in the security audit trail.

No reusable bootstrap secret may be shipped across the product fleet.

## 7. Device replacement

A failed controller is replaced through an audited workflow:

1. mark the old device `REPLACED` or `REVOKED`;
2. revoke its certificate;
3. create a new device identity and certificate;
4. map the new controller to the existing Site/areas/channels through an approved configuration revision;
5. preserve the old device's telemetry and audit history;
6. accept data from the new device only after commissioning succeeds.

The old controller certificate must never be copied to the replacement controller.

## 8. Platform PC replacement independence

Controller identity is bound to Customer + Site + logical BIO-EMS installation, not permanently to one PC certificate.

When the customer replaces the platform computer:

- controller certificates remain unchanged;
- the device registry and historical data are restored from an authenticated backup;
- the new PC generates a new installation key and hardware fingerprint;
- Platform Owner performs an audited license transfer;
- the old host installation is retired/revoked;
- a new signed installation license and new TLS server certificate are issued;
- the same site endpoint name and CA trust chain should be preserved where practical;
- controllers reconnect after validating the new server certificate chain;
- the backend validates the restored registry against the newly transferred signed license.

The server private key should not be copied as an ordinary file. A controlled recovery may restore an encrypted Site identity only where policy explicitly permits; otherwise a new server certificate is issued.

## 9. Revocation and clone detection

The platform must support certificate revocation and a local signed revocation snapshot for offline sites.

Detection controls should include:

- simultaneous sessions using one device identity;
- impossible endpoint/network changes;
- certificate serial/fingerprint mismatch;
- wrong Site/topic usage;
- abnormal boot counters or duplicated device nonce sequences;
- firmware identity mismatch;
- repeated failed challenge/response attempts.

A network outage must not erase revocation state or silently enroll a new device.

## 10. Offline behavior

Loss of Internet to the central licensing service must not stop local monitoring merely because online validation is unavailable.

The customer installation may validate locally using:

- BIO-EMS CA public trust anchors;
- locally cached signed device registry;
- signed license entitlements;
- locally cached signed revocation data;
- defined grace rules.

Unknown or revoked devices remain rejected while offline. Offline mode must not provide an automatic bypass enrollment.

## 11. Certificate lifecycle

Document and automate:

- issue, renew, rotate, suspend, revoke and replace;
- expiry warnings;
- CA key backup and disaster recovery;
- separation between Root CA, Device CA and Server CA;
- offline Root CA where practical;
- audit records for every privileged certificate action;
- protection against sharing CA private keys with customer installations.

## 12. Acceptance criteria

Implementation is not complete until tests demonstrate:

- unknown controller rejected;
- copied MQTT password without private key rejected;
- certificate from the wrong Site rejected;
- changed `device_id` or topic rejected;
- revoked/replaced device rejected;
- cloned simultaneous device identity detected or blocked;
- platform-PC replacement succeeds without re-provisioning valid controllers;
- old platform host becomes invalid after transfer;
- restored history remains available;
- offline monitoring accepts authorized devices but rejects unknown/revoked ones;
- firmware/key extraction protections are verified on the selected ESP32 hardware.

## 13. Planned work packages

- `DEV-TRUST-01` — PKI hierarchy and key-management procedure
- `DEV-TRUST-02` — Device registry and lifecycle model
- `DEV-TRUST-03` — ESP32 key generation and protected storage
- `DEV-TRUST-04` — MQTT mTLS and topic authorization
- `DEV-TRUST-05` — Secure provisioning/commissioning
- `DEV-TRUST-06` — Revocation, rotation and replacement
- `DEV-TRUST-07` — Signed firmware, Secure Boot and Flash Encryption
- `DEV-TRUST-08` — Clone-detection telemetry and security audit
- `DEV-TRUST-09` — Offline trust/revocation cache
- `DEV-TRUST-10` — Platform-PC migration integration
- `DEV-TRUST-11` — Negative, recovery and field acceptance testing

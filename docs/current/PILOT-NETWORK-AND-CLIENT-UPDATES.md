# Pilot network selection and client updates

## Commissioning

New main controllers can be commissioned through Wi-Fi or W5500 Ethernet (DHCP).
The owner provisioning form sends only the credentials relevant to the selected mode.
Serial provisioning writes the mode to NVS and requires successful HTTPS pairing.
Ethernet support is in site-controller firmware `0.1.0-pilot.5`. Wiring is explicitly
listed in the firmware README; it is a new configurable bench pin assignment.
There is no automatic network failover or static-IP form in this change. Existing
binding recovery preserves the already configured device; it is not a network-edit flow.

## Customer update page

Customer ADMIN opens `/system-update`. Operator and Viewer cannot access update
APIs. The file path accepts the signed **BIO-EMS Client Setup EXE**, not arbitrary ZIPs,
firmware, manufacturer tools, or scripts. The administrator uploads, reviews the verified
version/hash, then explicitly installs or discards it. Same-version builds are allowed
because Pilot source revisions may share version 0.20.0; lower versions are refused.

The installed page also shows the source commit. Internet download is disabled in both
the UI and API; a later cloud download adapter must feed the same staging, publisher,
hash, compatibility and installation checks. It must not bypass those checks.

Uploads are streamed to the protected ProgramData update-jobs directory (512 MiB max).
Windows Authenticode must be Valid and the certificate must already be present in the
machine's TrustedPublisher store with the expected BIO-EMS Pilot publisher subject.
The package must identify itself as BIO-EMS Client Setup in its signed version resources.
No certificate bundled with a user upload is automatically trusted.

**Pilot certificate limitation:** CI currently creates a new self-signed code-signing
certificate per build. The company-supplied package's existing certificate installation
procedure must be run by a Windows administrator before a different build's EXE can be
accepted. This is independent of the customer update page. Production/cloud updates
need a stable signing identity and a controlled certificate rotation process.

BIOEMS-RestoreWorker dispatches one-shot SYSTEM scheduled tasks. The task rechecks
hash/publisher/version, invokes silent Repair, then verifies health, installed version,
and the original installation ID. The existing PreUpdate/PostUpdate lifecycle provides
a verified application/data/config/licensing safety snapshot and its rollback path.
Update status persists across Backend downtime; the page polls for its terminal result.
PC monitoring and notifications pause during update; schedule a maintenance window.

## Release validation

Local checks cover backend/frontend typing, lint, suites, update authorization, version
policy, network credential validation, and page states. Windows CI additionally uploads
its signed Setup through the real installed API, applies through the independent task,
checks health/identity/result, and rejects a tampered executable. ESP-IDF CI compiles
and packages firmware. Passing CI does not establish physical W5500 link, RS485
coexistence, power margin, or endurance; those require the user's actual bench hardware.

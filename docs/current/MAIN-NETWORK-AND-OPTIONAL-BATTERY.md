# Main network and optional central battery

1 November 2026 source candidate: Main **pilot.11**, Tester **0.7.1**, **HQT-4 / 21 steps**, client migration **37**. Product 0.20.0 and Nano bench.2 are unchanged. This document does not certify an installed PC or physical assembly.

## Access and operation

Customer **ADMIN** opens **Main connections & battery**, `/network-settings`. System Owner opens **Main connections & optional battery**, `/system-owner/network-settings`. OPERATOR/VIEWER have no navigation or API access. This Admin endpoint cannot modify owner-only storage, backup or other platform policies.

Choose an active bound Main. An empty state explains that initial owner provisioning is required; controls are not hidden inside Flash & Bind. No COM port, reflash, clearbinding or new pairing is used by this page.

Enable Ethernet, Wi-Fi and/or BLE; at least one must remain on. Priority remains Ethernet → Wi-Fi → BLE. Ethernet uses DHCP (reserve the address on the router if needed); static-IP editing is not implemented. BLE uses the existing encrypted binding and Windows relay, without a manual PIN. Actual USB adapter, service access and reception remain HW-01/HW-02 tests.

Select **Enter / replace Wi-Fi credentials** to change SSID (1–32 UTF-8 bytes, spaces allowed) and WPA2 password (8–63 printable ASCII characters). Leaving replacement off retains credentials. A blank password does not erase them. The page cannot read back credentials initially provisioned on Main; an empty saved SSID does not mean Wi-Fi is unconfigured.

Enter a reason and save. Check saved/device-confirmed revisions, last contact, current transport and rollback state. Saving is not application. Main pilot.11 must report capability through authenticated health before the page/API permits updates. Admin/Owner share one optimistic policy revision; concurrent edits require reload. Polling does not refresh an unsaved draft's revision.

Stored credentials use AES-256-GCM, the existing installation communication-config encryption key and binding-specific authenticated data. Passwords are absent from API responses and policy history. Network edits record qualified ADMIN/SYSTEM_OWNER actor identities. Credentials travel only inside the existing encrypted authenticated controller exchange; the BLE relay sees ciphertext. Device NVS/console production-security holds remain open.

A changed/enabled Wi-Fi candidate must authenticate through Wi-Fi before commit. Ethernet/BLE acknowledgement cannot validate it. Other paths are withheld during that Wi-Fi trial, until success or the existing 60-second rollback window. Failure restores committed policy/credentials; save a new revision to retry. Wi-Fi candidate configuration uses RAM; policy NVS is committed after confirmation. A device with no working path cannot receive changes and needs physical service. Test actual outage/rollback/reboot timing on hardware.

## Optional central backup

**Central backup battery installed** defaults to off when the setting is absent, including earlier saved policy JSON. Set it on only for a fitted, reviewed backup circuit. This configures supervision and does not electrically switch a charger.

When off, Main reports mains/battery supervision as unknown; the server does not create mains-loss or low-battery incidents for this optional circuit. Existing incident history is retained. The notification orchestrator cancels pending/retry jobs and pauses repeats without declaring measured recovery or user acknowledgement. An already executing provider request may finish. Re-enabling resumes eligible open incidents on the notification cycle; repeat windows remain five minutes. System Owner retains the separate power-alarm switch. SD and other alarms are unaffected.

HQT-4 records **NOT FITTED** plus saved/applied disabled-setting evidence when no battery is fitted. A PASS on that exclusion check is not a passed endurance test. Fitted backup still requires approved electrical limits and at least 30-minute full-load qualification. Historical Tester runs retain their frozen procedures.

## Upgrade and verification

1. Back up the test installation and retain coordinated rollback packages. Upgrade the matching Windows client first; migration 37 is additive. Preserve the installation encryption key with protected backups.
2. Install governed Main pilot.11 through the controlled firmware process and wait for authenticated health. Once upgraded/bound, network changes need no further flash.
3. Verify both authorized interfaces, Operator/Viewer denial, concurrent edits, correct/incorrect Wi-Fi credentials, fallback, rollback, reboot and real telemetry. Confirm battery-off behavior, then fitted battery behavior where applicable, using real provider receipts.
4. Keep HW-01–HW-10 and DEP-01 evidence open until actually reviewed. Source tests and CI do not close physical acceptance or deploy software to the owner PC.

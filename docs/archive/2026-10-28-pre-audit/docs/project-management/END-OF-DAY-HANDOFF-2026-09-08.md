# BIO-EMS End-of-Day Handoff — 8 September 2026

## Authority

GitHub `main` is the source authority. This record distinguishes repository/source evidence, Windows build evidence and still-open qualification gates.

## Source position at handoff

- Source version remains `0.20.0`; no new release or production-ready declaration was made.
- Expected authoritative `main` before this documentation PR: `92040dfeacefb426e2446abddebdc528c69c3c35`.
- Licensing source LIC-01 through LIC-13 remains present and CI verified. Commercial licensing activation/qualification is not closed or removed.
- The unsigned internal Setup executable is a local build artifact and is not committed or published as a GitHub Release asset.

## Windows Setup evidence obtained

The following was executed on Windows 10 Pro x64 build 19045:

- Node.js `v22.23.1`, Inno Setup `6.7.3` and x64 SignTool availability were confirmed.
- Locked vendor inputs for Node.js 22.22.0, Mosquitto 2.1.2, InfluxDB 2.9.1 and WinSW 2.12.0 downloaded and passed their recorded SHA-256 checks.
- Deterministic application staging passed.
- Windows installer source validation passed.
- The embedded single-EXE correction passed Inno Setup compilation and merged through PR #182 / CI #624 / `d0b4806197d90fb4fa3d2bd26ebb05afa65efa4a`.
- A later internal unsigned build was created at:
  `C:\bioems-build\staging-0.20.0\output\bio-ems-setup-0.20.0-internal-unsigned-x64.exe`
- Recorded size: `143,451,495` bytes.
- Recorded SHA-256: `1A43C7FDFA0468D31F9FC977D32D75073AD1B1D4D65F7E506A963ACF38C39EFF`.
- Authenticode status: `NotSigned`, expected for this internal qualification artifact.
- InfluxDB 2.9.1 was manually extracted from the locked archive and returned `status: pass` on `http://127.0.0.1:8086/health`. This proves the vendor runtime can execute on that Windows 10 machine; it is not post-install service evidence.
- A pre-existing unrelated Mosquitto Windows service was detected. The repository now fails closed before vendor installation instead of stopping/deleting that service, through PR #183 / CI #627 / `c4f19879338090f8887ba18371367ad3f19cf9e1`.

## UI and operational work merged after v0.20.0

- PR #184 / CI #631 / `7c30f03fa9d9d2081f4ee314cd10385a66a49569`: RTL content offset and timestamp isolation.
- PR #185 / CI #635 / `08d7b9cf0ef55ab04b09582217236c09e298c393`: dark monitoring default and five-second opening boundary.
- PR #186 / CI #641 / `b4d4941a67e9e50f776d1c7e2e8c4264df197e8d`: trusted Live Monitoring Wall controls and richer cards.
- PR #187 / CI #645 / `a277a4c910ced8721119b7b1eac51a18e131aa98`: configured range/unit/sensor-count evidence.
- PR #188 / CI #647 / `ab18615141211757c1842165593dc522b73105e1`: opening-screen visual completion and reduced-motion behavior.
- PR #189 / CI #652 / `7bd7a223b54a36d1d2e942e77922be6444d132ae`: trusted rolling 24-hour temperature min/max/trend evidence.
- PR #190 / CI #657 / `92040dfeacefb426e2446abddebdc528c69c3c35`: safe browser persistence for Live Board search, filters, density and Alarm Focus.

## Explicitly still open

- Clean-machine Setup execution is not yet passed.
- BIOEMS-MQTT, BIOEMS-InfluxDB and BIOEMS-Backend service installation/lifecycle evidence is not yet passed on a clean machine.
- Integrated HTTPS/front-end/API health, Firewall scope, reboot recovery, Repair/Upgrade rollback and retained-data Uninstall evidence remain open.
- Authenticode signing and production release publication remain open.
- Windows 10 compatibility has encouraging build/runtime evidence but is not yet a qualified supported target.
- Arabic/English visual review and screenshot evidence for the newly merged UI remain open.
- Telegram live/end-to-end, Meta WhatsApp, physical hardware, field Commissioning, UAT and customer acceptance remain separate open tracks.

## Morning start point

1. On the Windows workstation, save any intended local changes, switch to `main`, fetch and fast-forward from `origin/main`, then confirm a clean working tree and matching SHAs.
2. Read this handoff and `PROJECT_STATE.md`.
3. Do not execute the internal Setup over the current development machine while the unrelated Mosquitto service is installed.
4. Use a clean disposable Windows 10/11 x64 machine or VM. If virtualization is unavailable on the current Core 2 Quad host, use a separate clean test computer.
5. Copy the internal unsigned Setup and independently verify the recorded SHA-256.
6. Run Fresh Install as Administrator, capture install log, service states, ports, HTTPS/API health and licensing receipt without recording secrets.
7. Reboot and repeat health checks; then exercise Repair/Upgrade rollback and retained-data Uninstall.
8. Review customer and SYSTEM_OWNER screens in Arabic/English, light/dark, desktop and mobile widths; capture screenshots for any defects.
9. Only after evidence passes, decide signing, release version and publication. Do not label the artifact production-ready beforehand.

## Safety boundary

No existing customer/development Mosquitto service, database, application data or credentials may be removed merely to create installer evidence. Qualification must use an isolated clean target.

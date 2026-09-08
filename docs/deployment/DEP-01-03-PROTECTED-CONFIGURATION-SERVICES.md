# DEP-01-03 Protected Configuration and Windows Services

**Status:** Complete / merged / CI verified through PR #179 and CI #615
**Target:** Windows 11 Pro x64, fresh installation path

## Delivered source behavior

The Setup now invokes `Install-DEP0103Services.ps1` after laying down the controlled
payload. The script:

- requires Administrator privileges and refuses an existing BIO-EMS service set;
- installs the frozen Mosquitto runtime and removes any vendor-created default
  `mosquitto` service before creating the controlled service;
- creates `BIOEMS-MQTT`, `BIOEMS-InfluxDB` and `BIOEMS-Backend` with WinSW;
- changes each service to its own `NT SERVICE\<service-name>` virtual identity;
- binds authenticated MQTT to loopback `127.0.0.1:1883` only;
- creates Mosquitto credentials through redirected standard input, not command-line
  arguments;
- starts and locally health-checks InfluxDB, then performs one-time local onboarding;
- generates independent MQTT, InfluxDB, customer JWT and platform JWT secrets at
  installation time and writes no secret value to Setup output;
- writes the Backend environment file under `C:\ProgramData\BIO-EMS\config` and
  removes inherited ACLs; and
- configures service dependencies and controlled restart/log behavior.

The Backend service uses a dedicated bootstrap entrypoint that loads
`BIOEMS_ENV_FILE` before importing any server module, so secrets remain in the
ACL-protected persistent root instead of the immutable application directory or
WinSW XML.

## LIC-11 identity boundary

`BIOEMS-Backend` has a WinSW pre-start command. On first service start it invokes the
compiled LIC-11 provisioning command under `NT SERVICE\BIOEMS-Backend`, which is the
same identity that later reads the DPAPI `CurrentUser` protected key. It provisions
only when both identity and receipt are absent, refuses partial state, never deletes
or replaces either file, and fails service startup if provisioning is unsuccessful.

The licensing directory removes inherited permissions and grants access only to
SYSTEM, Administrators and the Backend virtual service identity. MQTT and InfluxDB
use separate data ACLs. A failed fresh service installation unregisters services it
created but does not delete persistent data or licensing evidence.

## Explicit boundary

Repository tests validate the source contracts on Linux; they do not execute Windows
SCM, WinSW, Mosquitto or InfluxDB. Therefore DEP-01-03 does not claim a compiled or
successfully installed Setup, reboot persistence, HTTPS exposure, controller-facing
MQTT TLS, firewall rules, complete post-install health, Repair, Upgrade, rollback,
retained-data Uninstall, code signing or clean-machine qualification.

DEP-01-04 must add the local HTTPS/front-door and firewall boundary plus complete
post-install component health evidence. Lifecycle recovery and qualification remain
later controlled packages.

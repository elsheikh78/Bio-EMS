# DEP-01-02 Exact Input Freeze and Deterministic Build Source

**Status:** Complete / merged / CI verified through PR #178 and CI #612
**Target:** Windows 11 Pro x64  
**Installer compiler:** Inno Setup 6.7.3

## Controlled inputs

`installer/windows/vendor-input-lock.json` is the machine-readable authority for the
four vendor inputs. It freezes the version, download file, HTTPS source, SHA-256 and
license evidence for:

- Node.js 22.22.0 Windows x64;
- Eclipse Mosquitto 2.1.2 Windows x64;
- InfluxDB OSS 2.9.1 Windows AMD64; and
- WinSW 2.12.0 x64.

The Node.js and InfluxDB hashes are tied to vendor-published checksum evidence. The
Mosquitto and WinSW hashes are controlled captures of the named official release
artifacts and must be independently re-captured and approved when either version is
changed. A successful hash check proves that the local file matches this lock; it
does not independently prove vendor authorship or replace release-signature review.

Inno Setup 6.7.3 is pinned as the build compiler. BIO-EMS is commercial software, so
`Build-Setup.ps1` requires a separate commercial-license evidence file and records
only its SHA-256. The evidence contents and any license key must remain outside Git.

## Controlled build flow

Run these commands from Windows PowerShell with explicit paths:

```powershell
.\installer\windows\Get-VendorInputs.ps1 `
  -DestinationDirectory C:\BIO-EMS-Build\vendor-cache

.\installer\windows\New-InstallerStaging.ps1 `
  -RepositoryRoot C:\src\Bio-EMS `
  -VendorCache C:\BIO-EMS-Build\vendor-cache `
  -StagingDirectory C:\BIO-EMS-Build\staging `
  -SourceCommit 0123456789abcdef0123456789abcdef01234567 `
  -BuildTimestamp 2026-09-08T12:00:00Z

.\installer\windows\Build-Setup.ps1 `
  -RepositoryRoot C:\src\Bio-EMS `
  -StagingDirectory C:\BIO-EMS-Build\staging `
  -InnoCompiler 'C:\Program Files (x86)\Inno Setup 6\ISCC.exe' `
  -CommercialLicenseEvidence C:\BIO-EMS-Controlled\inno-commercial-license.txt
```

The acquisition script downloads only missing frozen files and verifies every hash.
The staging script performs clean dependency installs and production builds, creates
sorted ZIP files with fixed entry timestamps, records the explicitly supplied build
timestamp, verifies vendor files again, writes a UTF-8 manifest without a byte-order
mark, removes build work files, and runs the existing fail-closed package validator.
The Setup build verifies the exact compiler
version and license-evidence presence, validates staging again, and emits the Setup
plus `build-evidence.json` with the Setup and manifest hashes.

Generated vendor cache, staging and output directories are ignored by Git. The
repository contains no vendor binary, commercial-license content, environment
secret, reusable installation identity, activation receipt, certificate or private
signing key.

## Boundary and next package

DEP-01-02 supplies the exact-input lock, deterministic staging source and initial
Inno Setup source. It does not claim that a customer Setup has been compiled, signed,
installed or qualified. The current Setup lays down validated files and shortcuts;
it does not yet register/configure/start Windows services, provision protected
configuration, run LIC-11 under the final service identity, manage firewall rules,
or implement health/Repair/Upgrade/rollback/retained-data Uninstall.

Those lifecycle capabilities begin in DEP-01-03. Clean-machine Windows qualification,
code signing, commissioning evidence, field UAT and customer acceptance remain
separate later gates.

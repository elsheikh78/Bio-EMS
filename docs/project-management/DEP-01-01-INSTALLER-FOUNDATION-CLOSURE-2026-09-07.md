# DEP-01-01 — Windows Installer Foundation Evidence

**Status:** Complete / merged / CI verified

## Delivered

- selected Windows 11 Pro x64 and Inno Setup 6 for the controlled initial baseline;
- fixed separate application and persistent-data roots;
- fixed the three Windows service identities and public/internal port boundary;
- defined the exact six-part application/runtime package inventory;
- added a strict `package-manifest.json` schema requiring source commit, versions,
  SHA-256 checksums and redistribution evidence;
- added `npm run validate:windows-installer` with secret-safe issue output; and
- reject incomplete/duplicate inventory, traversal/absolute paths, missing/non-file or
  modified artifacts, `.env`, private keys, license, activation receipt and reusable
  installation identity.

## Verification

- Targeted DEP-01-01: 1 file / 4 tests passed
- Backend typecheck/build/lint/format: passed
- Backend: 113 files / 785 tests passed
- Frontend typecheck/build/lint/format: passed
- Frontend: 51 files / 292 tests passed
- Automated total: 164 files / 1,077 tests passed

## Boundary and next package

No Setup executable has been produced. Exact vendor/runtime version and redistribution
evidence, deterministic staging, Inno Setup source, protected configuration, service
registration, health checks and lifecycle behavior remain open. DEP-01-02 is the
controlled next package: freeze exact inputs and implement deterministic staging/build
source. Windows clean-machine qualification remains later external evidence.

## Integration evidence

- PR: #177
- CI: #609 — passed
- Merge: `d1c5e4dfaee675573d3b7f76c7d279cc8b744f90`

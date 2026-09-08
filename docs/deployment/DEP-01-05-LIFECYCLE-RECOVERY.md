# DEP-01-05 Lifecycle Recovery

**Status:** Source implemented; PR/CI/merge evidence pending

Existing installations now take a pre-update snapshot before Setup overwrites files.
The snapshot covers the immutable application and the persistent `config`, `data` and
`licensing` trees, records a sorted SHA-256 inventory, and writes a controlled pending
operation pointer. Services are stopped before capture.

After Repair/Upgrade, all services restart and the DEP-01-04 health gate runs. Success
records lifecycle evidence and clears the pending marker. Failure stops services,
restores both application and persistent snapshot, restarts the previous service set,
and fails Setup. LIC-11 identity is never regenerated during this process.

Uninstall removes services, the BIO-EMS Firewall rule and installer-created
certificate-store entries, while deliberately retaining `C:\ProgramData\BIO-EMS`.
It writes `uninstall-retention.json` so retained customer data and licensing identity
are explicit rather than silently orphaned or deleted.

Repository tests are source-contract evidence only. Windows Repair/Upgrade/rollback
and Uninstall execution, backup capacity/performance, signed Setup and clean-machine
qualification remain open for DEP-01-06.

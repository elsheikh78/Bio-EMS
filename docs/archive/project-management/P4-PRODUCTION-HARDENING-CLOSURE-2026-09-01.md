# P4 — Production Hardening Closure

**Software status:** COMPLETE / CI VERIFICATION PENDING  
**Operational evidence:** EXTERNAL / OPEN

BIO-EMS now fails deployment readiness unless TLS, credentials, persistent absolute paths, a separate backup location, bounded log retention, an approved production log level and a bounded graceful-shutdown interval are configured. The production runbook controls backup/restore, upgrade/rollback, smoke verification and incident handover.

This closes the software and documented-control portion of P4. It does not claim that an off-host backup, isolated restore rehearsal, process supervisor, production endurance run or disaster-recovery drill has been executed at a customer Site.

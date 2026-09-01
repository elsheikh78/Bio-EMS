# P5 — SYSTEM_OWNER Commercial Operations Closure

P5 software provides an isolated SYSTEM_OWNER-only API for customer fleet identity, license lifecycle/update entitlement, and maintenance/calibration/support/update oversight. Every mutation derives the actor from the authenticated platform principal and writes an append-only commercial event snapshot. Customer ADMIN/OPERATOR/VIEWER authentication cannot reach these routes.

Payment processing, invoicing, live remote update execution and contractual entitlement approval remain external commercial integrations; they are not inferred from these records.

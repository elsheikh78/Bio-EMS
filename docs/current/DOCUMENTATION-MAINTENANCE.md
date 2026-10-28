# Documentation Lifecycle and Maintenance

Effective for the 28 October 2026 audit refresh. PROJECT_RULES remains the governing policy; this guide implements its documentation-placement and evidence rules.

`PROJECT_STATE.md` is the only current-state ledger. `IMPLEMENTATION_PLAN.md` is approved execution order, not completion evidence. `CHANGELOG.md` is a controlled change ledger; README/index files are stable navigation. Source-backed component guides describe observed behavior. ADRs preserve decisions and active domain specifications preserve requirements, including requirements that remain unimplemented.

For a code change, update its component guide and affected specification links, state/risk/changelog when warranted, and attach exact validation evidence. If code conflicts with an approved requirement, record the gap; a documentation rewrite cannot silently approve the code as the new architecture. Preserve the original record before a substantial replacement. A document's date is not a reason to revoke it.

The28 October snapshot manifest records 309 pre-existing text documents and SHA-256/source baseline. Seventy-three earlier archive records are retained byte-for-byte in place; other originals are copied under `docs/archive/2026-10-28-pre-audit/` using their old paths. Historical entrypoints link to those originals and current guides. Retained specifications/ADRs/policies contain an explicit interpretation boundary. All original bytes remain recoverable without relying only on git history.

Run `python tools/project-audit/check_docs.py` after edits. It verifies snapshot hashes/sizes, inventory accounting and resolvable local Markdown file targets in active docs. It does not verify remote URL availability, all anchor fragments, electrical correctness or implementation of every requirement. The link ledger records the pre-audit local-file check; it found zero missing targets in the supported Markdown syntax, so no target substitutions were made. An unresolved reference found later must be explicitly recorded rather than silently redirected to an unrelated file.

Do not edit snapshot originals or earlier immutable archive evidence to make the checker pass. Add a new dated correction/current guide instead. Keep runtime logs, secrets, generated native builds, customer databases and signing private keys outside git. Audit evidence JSON is sanitized and source-reproducible; raw logs are not a release artifact.

For later audits, select an exact commit, preserve the then-current documents, run relevant gates and dependency checks, record limitations and distinguish desired controls from observed implementation. Do not label a full repository inventory as a full penetration test or line-by-line code certification.

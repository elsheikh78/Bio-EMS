# Documentation Migration and Preservation

Date 28 October 2026. Baseline `d151b1f`. The inventory includes309 pre-existing human-readable text docs; two CMakeLists and requirements.txt are executable build/dependency inputs, not prose and were excluded. Binary documents, diagrams and assets were not rewritten.

| Classification | Count | Treatment |
| --- | ---: | --- |
| Existing immutable history | 73 | Original bytes retained in place; inventoried and hashed |
| Historical work/checkpoint entrypoints | 78 | Full original copied to dated archive; original path becomes a clear history/current-guide pointer |
| Architecture decisions | 23 | Decision text retained in domain; original snapshot and implementation/evidence boundary added |
| Governance | 13 | Policy retained; snapshot and authority/evidence boundary added; contributing conflict explanation reconciled |
| Domain specs/entrypoints | 122 | Original snapshot; reviewed boundary/current guide links; core state/indices/component guides replaced with fresh source-backed text |
| Total | 309 | No original text lost |

The [snapshot manifest](../../archive/2026-10-28-pre-audit/manifest.json) records original paths, snapshot paths, byte counts, SHA-256 and baseline. Existing archive records are referenced in place instead of recursively copied. A snapshot is historical evidence: its old relative links remain as originally written; use the manifest/current index for navigation.

The [document inventory](document-inventory.json) records each document's status and current implementation guide. Active specs and ADRs are not revoked merely because their contents predate the audit. Requirements remain requirements; current implementation guides and findings expose gaps. Historical work packages retain their proposed requirements, evidence and acceptance limits in the original copy.

A new compact PROJECT_STATE is the sole live state authority. README/current indices no longer maintain competing old test totals or main SHAs. Source-backed guides cover architecture, operations, hardware/firmware, cloud/mobile, identity/security, build/recovery, testing, acceptance and maintenance. Root plan/risk/changelog add the audit with no version or release claim. Component READMEs lead to the new guides and retain useful component-specific instructions.

Local-file references are checked across active Markdown. The [reference migration ledger](link-migration.json) found zero missing supported Markdown file targets in pre-audit non-archive text; no target repairs or substitutions were needed. Active docs and 309 original-document hashes pass with zero errors; three checker fixture tests pass, including deliberate corruption and missing-target failure cases. Backtick-only path mentions and external URLs/anchors are not certified. Archived original links are never rewritten. The typo functional-requirements entrypoint is retained as a compatibility pointer, with its unmodified original in history.

Run `python tools/project-audit/check_docs.py`. It verifies every archived original and original inventory accounting, then local-file targets in supported Markdown link syntax. Automated fixture checks verify both valid archives/links and deliberate corruption/missing-link failure. The checker does not certify web URLs, fragment IDs, diagram semantics or code implementation of a requirement.

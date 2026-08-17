# BIO-EMS Engineering Handbook

Engineering Handbook Version: 1.0

Status: Approved

Repository Status: Active

Engineering Governance: Established

## Overview

The BIO-EMS Engineering Handbook is the repository-oriented reference for current
engineering practice. It defines how the backend architecture, Domain rules, testing,
reviews, releases, ADRs, AI-assisted work, and terminology are documented and applied.

The handbook describes the current BIO-EMS repository. It distinguishes implemented
capabilities from proposed architecture and MUST NOT be used to imply that planned
features are already available.

## Quick Navigation

- [ENGINEERING_PLAYBOOK.md](ENGINEERING_PLAYBOOK.md) — primary engineering rules and Definition of Done.
- [ARCHITECTURE_PRINCIPLES.md](ARCHITECTURE_PRINCIPLES.md) — architecture boundaries and dependency direction.
- [DOMAIN_GUIDELINES.md](DOMAIN_GUIDELINES.md) — Domain Layer design and alarm-rule ownership.
- [AI_DEVELOPMENT_WORKFLOW.md](AI_DEVELOPMENT_WORKFLOW.md) — current AI-assisted engineering workflow.
- [CODE_REVIEW_CHECKLIST.md](CODE_REVIEW_CHECKLIST.md) — Pull Request review standard.
- [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md) — current backend testing standard.
- [GIT_WORKFLOW.md](GIT_WORKFLOW.md) — branches, commits, review, tags, and merge practices.
- [RELEASE_PROCESS.md](RELEASE_PROCESS.md) — manual evidence-based release process.
- [ADR_POLICY.md](ADR_POLICY.md) — Architecture Decision Record policy.
- [ENGINEERING_GLOSSARY.md](ENGINEERING_GLOSSARY.md) — official engineering terminology.

These documents collectively define the BIO-EMS Engineering Handbook.

## Handbook Scope

The handbook applies to the TypeScript backend and React frontend, SQLite
configuration data, InfluxDB telemetry, MQTT ingestion, REST APIs, Domain behavior,
deployment-readiness records, and repository workflow.

It complements the existing ADR collection under `docs/adr/`. ADRs explain individual
architectural decisions; handbook documents define the current rules and vocabulary
used to implement and review those decisions.

## Engineering Principles Summary

BIO-EMS engineering is organized around explicit layers, repository evidence, and
small, reviewable changes. The Domain Layer owns alarm-rule evaluation; repositories
own SQLite access; services orchestrate use cases; and the API boundary preserves
established contracts.

## Handbook Principles Summary

| Principle                          | Purpose                                                               |
| ---------------------------------- | --------------------------------------------------------------------- |
| Repository First                   | Repository evidence takes precedence over assumptions.                |
| Architecture Before Implementation | Validate architecture before modifying code.                          |
| Documentation Alongside Code       | Documentation evolves together with implementation.                   |
| Evidence-Based Engineering         | Engineering decisions must be supported by repository evidence.       |
| Consistency                        | Shared terminology and engineering standards improve maintainability. |

These principles apply across every engineering document.

## Engineering Handbook Maturity

The current handbook is:

- Repository-oriented
- Evidence-based
- Architecture-driven
- AI-assisted
- ADR-governed

It documents the current engineering process rather than future intentions. Current
implementation status is established from code, schema, tests, and verified repository
artifacts rather than roadmap language or proposed ADRs.

## Engineering Document Ownership

| Document area           | Primary purpose                                       | Owner responsibility                               |
| ----------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| Engineering Playbook    | Engineering rules and Definition of Done              | Maintain current process rules.                    |
| Architecture and Domain | Boundaries, dependencies, and business-rule ownership | Preserve architecture consistency.                 |
| Review and Testing      | Verification and Pull Request quality                 | Maintain actionable quality gates.                 |
| Git and Release         | Traceability and release readiness                    | Keep manual workflow evidence accurate.            |
| ADR and Glossary        | Decision rationale and terminology                    | Preserve historical context and shared language.   |
| AI Workflow             | Scoped AI-assisted process                            | Keep ownership and evidence requirements explicit. |

The Engineering Team owns handbook maintenance. The Product / Engineering Owner retains
final approval for scope, architecture, and release decisions.

## Handbook Reading Order

1. Start with `ENGINEERING_PLAYBOOK.md` for the overall engineering model.
2. Read `ARCHITECTURE_PRINCIPLES.md` before changing layers or dependencies.
3. Read `DOMAIN_GUIDELINES.md` before changing alarm behavior or domain vocabulary.
4. Use `CODE_REVIEW_CHECKLIST.md` and `TESTING_GUIDELINES.md` during implementation.
5. Use `GIT_WORKFLOW.md` and `RELEASE_PROCESS.md` when preparing reviewed releases.
6. Use `ADR_POLICY.md` and the ADR collection for structural decisions.
7. Use `ENGINEERING_GLOSSARY.md` when terminology is unclear.

## Lessons Learned

- Repository-first engineering reduced architectural inconsistencies.
- ADRs improved architectural traceability.
- Shared terminology improved communication and reviews.
- AI-assisted engineering is most effective when operating within defined engineering standards.
- Small scoped reviews consistently produced higher quality outcomes.
- Documentation synchronized with implementation significantly reduced documentation drift.

These observations represent the current BIO-EMS engineering experience and MAY evolve
as the project grows.

## Future Evolution

Future handbook versions MAY include additional engineering documents such as:

- Architecture Review
- Security Guidelines
- Performance Guidelines
- Expanded operational governance beyond the current Pilot runbook

The existing Pilot deployment and recovery runbook is maintained under
`docs/deployment/`; broader operational governance remains outside Handbook Version
1.0.

## Cross References

| Location             | Purpose                                                   |
| -------------------- | --------------------------------------------------------- |
| `docs/adr/`          | Existing Architecture Decision Record collection.         |
| `docs/architecture/` | Architecture reference material and design documentation. |
| `docs/api/`          | API specifications and endpoint documentation.            |
| `docs/security/`     | Current security-related documentation.                   |
| `CHANGELOG.md`       | Implemented release history.                              |
| `VERSION`            | Current repository version.                               |

## Engineering Handbook Metrics

| Metric                    | Purpose                                            |
| ------------------------- | -------------------------------------------------- |
| Documentation Coverage    | Measure completeness of engineering documentation. |
| ADR Coverage              | Measure architectural documentation completeness.  |
| Cross Reference Integrity | Ensure documents remain connected.                 |
| Terminology Consistency   | Maintain a unified engineering vocabulary.         |
| Review Completion Rate    | Measure handbook review discipline.                |

These metrics improve documentation quality.

They MUST NOT be used to evaluate individual contributors.

## Revision History

| Version | Date       | Status   | Change                              |
| ------- | ---------- | -------- | ----------------------------------- |
| 1.0     | 2026-08-05 | Approved | Initial Engineering Handbook index. |

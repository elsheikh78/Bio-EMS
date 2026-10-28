# BIO-EMS AI Development Workflow

| Item | Value |
|------|-------|
| Document | AI Development Workflow |
| Version | 1.0 |
| Status | Approved |
| Applies To | BIO-EMS Engineering |
| Owner | Engineering Team |
| Classification | Internal |
| Last Updated | 2026-08-05 |

## 1. Purpose

This document defines the AI-assisted software development workflow currently used
by the BIO-EMS project.

It records how the Product / Engineering Owner, ChatGPT, and Codex collaborate to
plan, implement, review, verify, and document changes to the backend and its
engineering records.

The workflow is a practical operating model for this repository. It does not describe
generic AI usage or tools that are not part of the current BIO-EMS workflow.

## 2. Scope

This workflow applies to BIO-EMS backend source changes, SQLite migrations, Domain
rules, dashboard work, ADR maintenance, engineering documents, build checks, tests,
and Pull Request preparation.

It applies to the existing layered backend: Express API, application services, the
alarm Domain layer, SQLite repositories, InfluxDB telemetry modules, and MQTT
telemetry processing.

AI assistance MAY be used for analysis and execution within the approved scope. It
MUST NOT expand authority beyond the owner's instruction or repository evidence.

## 3. AI Development Philosophy

AI assists engineering decisions but does not replace engineering ownership.

- The Product / Engineering Owner retains final accountability for scope and approval.
- AI MUST use repository evidence before asserting implementation status.
- AI MUST distinguish implemented, partially implemented, and proposed capabilities.
- AI SHOULD make the smallest coherent change that satisfies an approved objective.
- AI MUST NOT present generated output as verified until build, tests, or inspection
  provide the required evidence.

BIO-EMS uses AI to accelerate disciplined engineering, not to bypass architecture,
review, documentation, or verification.

## AI Workflow Principles

| Principle | Purpose |
|-----------|---------|
| Repository First | Engineering decisions are based on repository evidence rather than assumptions. |
| Architecture Before Implementation | Validate architecture before modifying implementation. |
| Small Scoped Changes | Reduce unintended side effects and simplify reviews. |
| Documentation Alongside Code | Keep documentation synchronized with implementation. |
| Evidence-Based Reviews | Review conclusions MUST be supported by repository evidence. |

These principles guide every AI-assisted engineering task in BIO-EMS, from scoped
documentation updates to source changes that require build and test verification.

## 4. Engineering Roles

| Role | Current responsibility | Does not own |
| --- | --- | --- |
| Product / Engineering Owner | Requirements, scope, priorities, acceptance, final approval | Delegated accountability for final decisions |
| ChatGPT | Architecture discussion, engineering review, ADR support, sprint planning, documentation guidance | Direct repository implementation approval |
| Codex | Repository inspection, implementation, refactoring, build/tests, compilation fixes, document edits | Product direction or final approval |

The owner MUST define whether a task is review-only, documentation-only, or an
authorized implementation change. ChatGPT and Codex MUST respect that boundary.

Example: the owner may request a SQLite bootstrap correction. Codex inspects the
current migration order, makes the minimal change, validates fresh and upgrade paths,
and reports results for owner review.

## 5. Development Workflow

The following flow describes the current BIO-EMS AI-assisted development sequence.

```text
Requirement
    |
    v
Architecture Discussion
    |
    v
Implementation Plan
    |
    v
Codex Implementation
    |
    v
ChatGPT Review
    |
    v
Codex Corrections
    |
    v
Final Review
    |
    v
Commit
```

1. The owner provides a bounded requirement and constraints.
2. ChatGPT MAY help clarify architecture, risks, acceptance criteria, and ADR impact.
3. Codex inspects the affected repository code and documentation before editing.
4. Codex implements only authorized changes and keeps unrelated work untouched.
5. Codex runs applicable build, tests, and focused verification.
6. ChatGPT MAY review architecture, consistency, and documentation against evidence.
7. Codex addresses approved corrections and repeats verification when code changes.
8. The owner performs final review and decides whether to commit or merge.

The diagram represents the normal workflow. The owner MAY omit a step only when its
scope is not applicable, such as a documentation-only correction with no code change.

### Repository Inspection

Before modifying code or engineering records, Codex performs a scoped inspection of
the relevant implementation, related tests, and working-tree state.

- The inspection MUST identify current behavior before proposing a correction.
- Existing uncommitted changes MUST be treated as unrelated unless they are within the
  approved task scope.
- A code change SHOULD identify its affected layer: Domain, service, repository, API,
  database, MQTT, or InfluxDB query/writer module.
- An ADR update MUST inspect referenced implementation files before changing an
  implementation-status claim.
- A documentation task MUST check whether its target file is empty or already contains
  material that must be preserved.

Example: before changing the SQLite bootstrap sequence, Codex inspects `app.ts`, the
schema bootstrap, migration runner, and Sensor repository insert fields.

### Correction Loop

Review findings are treated as bounded follow-up work rather than an invitation to
rewrite unrelated code.

1. ChatGPT or the owner identifies a concrete finding, objection, or missing proof.
2. Codex verifies the finding against the current repository.
3. Codex changes only the files needed to resolve the approved finding.
4. Codex repeats build, tests, or focused verification when the change affects code.
5. Codex reports the outcome and any remaining limitation for final review.

The correction loop MUST preserve previously accepted constraints unless the owner
authorizes a new architectural decision.

## 6. Responsibilities

Clear ownership prevents AI output from becoming an unreviewed source of truth.

| Concern | Owner | ChatGPT | Codex |
| --- | --- | --- | --- |
| Architecture | Final decision | Discusses and reviews | Inspects and implements approved design |
| Business Rules | Final acceptance | Reviews domain ownership | Implements approved domain changes |
| Source Code | Approves scope | Reviews design impact | Edits and verifies authorized files |
| Documentation | Approves published intent | Drafts/reviews architecture and ADR text | Creates or updates repository documents |
| Final Approval | Sole owner | May advise | Reports evidence and limitations |

Codex MUST NOT decide product scope. ChatGPT MUST NOT substitute architectural advice
for owner approval. The owner MUST NOT treat unverified AI output as build or test
evidence.

## 7. Prompt Categories

BIO-EMS uses focused prompts that state scope, constraints, and expected verification.

| Prompt category | Current use |
| --- | --- |
| Planning | Break a bounded objective into implementation and verification work. |
| Architecture | Review layers, dependencies, data ownership, and ADR impact. |
| Code Generation | Implement an approved focused change in existing repository structure. |
| Code Review | Identify defects, contract changes, and architecture violations. |
| Documentation | Create or update engineering, ADR, API, or architecture records. |
| ADR Review | Compare a decision record with current code and implementation status. |
| Testing | Select and run relevant build, Vitest, migration, or focused verification. |

Prompts SHOULD name files when scope is constrained. For example, “update only
`ADR-005-monitoring-points.md`” prevents unrelated documentation rewrites.

## 8. Documentation Workflow

Engineering documents are maintained alongside the code and ADRs they describe.

1. The owner identifies the document objective and allowed files.
2. ChatGPT MAY draft structure, terminology, or consistency guidance.
3. Codex inspects current code and related documents before writing.
4. Codex MUST distinguish current behavior from intended or proposed architecture.
5. Codex validates file scope, Markdown structure, references, and requested length.
6. The owner reviews the completed document before treating it as approved.

Documentation MUST NOT claim that Assets, Monitoring Points, onboarding, notifications,
or other future capability is implemented without repository evidence.

Example: ADR-005 documents Monitoring Points as proposed because the current backend
has no Monitoring Point table, repository, or API.

## 9. ADR Workflow

ADRs capture significant architectural decisions and their rationale. AI assistance
supports, but does not replace, the owner’s architectural decision.

```text
Architectural question -> repository evidence -> ADR draft -> review
             -> owner decision -> implementation/documentation alignment
```

- ChatGPT MAY analyze alternatives and dependency implications.
- Codex MUST inspect the current schema, code, and existing ADRs before editing an ADR.
- An ADR MUST state whether its decision is implemented, partially implemented, or proposed.
- References MUST point to existing repository files or engineering documents.
- Accepted ADRs MUST NOT be silently rewritten to conceal a later decision.
- A later architectural decision SHOULD supersede rather than erase earlier rationale.

Example: an ADR about generic telemetry queries must record that Room Status is
measurement-agnostic while Latest Telemetry currently filters to temperature.

## 10. Engineering Rules

- AI MUST NOT invent implemented features, endpoints, tables, or integrations.
- AI MUST distinguish implemented, partially implemented, and proposed states.
- AI MUST preserve repository consistency and avoid unrelated edits.
- AI SHOULD reference existing engineering documents and ADRs when relevant.
- AI MUST inspect the working tree before modifying files in a potentially dirty repository.
- AI MUST preserve historical rationale when updating ADRs unless it is factually incorrect.
- AI MUST use the Domain engine for new alarm-rule changes rather than duplicate logic.
- AI MUST NOT change DTOs, routes, or API contracts unless the owner explicitly authorizes it.

These rules apply equally to code changes, review conclusions, and engineering
documentation.

## 11. AI Anti-Patterns

| Anti-pattern | Risk | Required response |
| --- | --- | --- |
| Blind acceptance of generated code | Defects or boundary violations reach the repository. | Inspect, build, test, and review it. |
| Manual documentation drift | Documents contradict current implementation. | Verify claims against code before editing. |
| Rewriting architecture without an ADR | Historical rationale and ownership are lost. | Create or update the appropriate ADR. |
| Mixing implemented and planned features | Stakeholders receive incorrect capability claims. | Label implementation status explicitly. |
| Broad unrelated edits | Review scope and regression risk increase. | Limit changes to authorized files. |
| Skipping build or tests | Compilation and behavior regressions remain unknown. | Run required verification before handoff. |

AI MUST NOT use a plausible explanation as a substitute for repository evidence.

## 12. Quality Gates

AI-assisted work passes the same quality gates as manually authored work.

| Gate | Required current evidence |
| --- | --- |
| Build | `npm.cmd run build` succeeds for backend code changes. |
| Tests | `npm.cmd run test:run` succeeds for backend code changes. |
| Review | Scope, architecture, business rules, and contracts are reviewed. |
| Documentation | Relevant documentation and ADRs are accurate and updated. |

For a documentation-only task, Codex MUST validate the requested file scope and
internal consistency. For a migration change, verification MUST include fresh and
existing database behavior. For a dashboard change, verification SHOULD cover the
affected aggregation and domain-status mapping.

Quality gates are not optional because an AI produced the change.

### Handoff Record

The final AI handoff SHOULD make verification and scope easy to review. For an
implementation task, Codex reports modified files, behavior changed, commands run,
and test/build outcomes. For a documentation task, Codex reports the created or
updated file, factual evidence used, and any known discrepancy.

The handoff MUST state when a required verification could not be run. It MUST NOT
describe a check as passed when it was skipped, blocked, or unrelated to the task.

Example: a DashboardService change reports that DTOs and routes were unchanged, the
Domain engine was used for status evaluation, and the backend build and Vitest suite
passed.

This record supports the owner's final decision without replacing that decision.

It also preserves a traceable basis for later review.

The record SHOULD remain concise and evidence-based.

It MAY link to relevant repository files.

## Lessons Learned

The following observations were derived from the practical development of BIO-EMS.

- Repository inspection before implementation significantly reduces incorrect assumptions.
- Architecture review before coding improves long-term consistency.
- Small, well-scoped prompts produce higher-quality implementations.
- Updating ADRs together with implementation prevents documentation drift.
- Evidence-based documentation is more maintainable than assumption-based documentation.
- Independent engineering review before commit improves overall software quality.

These lessons represent current BIO-EMS engineering experience and may evolve over
time.

## 13. Cross References

| Document | Relationship |
| --- | --- |
| `docs/engineering/ENGINEERING_PLAYBOOK.md` | General engineering rules and AI workflow responsibilities. |
| `docs/engineering/CODE_REVIEW_CHECKLIST.md` | Review criteria and merge blockers. |
| `docs/engineering/TESTING_GUIDELINES.md` | Build, test, migration, and regression verification. |
| `docs/engineering/GIT_WORKFLOW.md` | Branch, commit, Pull Request, and merge workflow. |
| `docs/engineering/ADR_POLICY.md` | ADR evidence, structure, and lifecycle rules. |

## Workflow Metrics

BIO-EMS encourages monitoring the health of the engineering workflow.

| Metric | Purpose |
|---------|---------|
| Review Completion Rate | Measure review discipline. |
| Prompt Success Rate | Evaluate implementation efficiency. |
| Build Success Rate | Measure code stability. |
| Test Success Rate | Measure verification quality. |
| Documentation Completeness | Ensure documentation evolves with implementation. |
| ADR Consistency | Measure alignment between architecture decisions and implementation. |

These metrics are intended to improve engineering processes and project quality.

They MUST NOT be used to evaluate individual developer performance.

## 14. Revision History

| Version | Date | Status | Change |
| --- | --- | --- | --- |
| 1.0 | 2026-08-05 | Approved | Initial workflow based on current BIO-EMS AI-assisted engineering practice. |

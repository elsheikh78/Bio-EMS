# BIO-EMS Git Workflow

| Item | Value |
|------|-------|
| Document | Git Workflow |
| Version | 1.0 |
| Status | Approved |
| Applies To | BIO-EMS Backend |
| Owner | Engineering Team |
| Classification | Internal |
| Last Updated | 2026-08-05 |

## 1. Purpose

This document defines the Git workflow used to make controlled changes to the
BIO-EMS backend.

The workflow protects a regulated monitoring codebase by keeping work reviewable,
verifiable, and traceable from an identified change through merge.

It describes repository workflow only. It does not define automated deployment,
CI/CD pipelines, or GitHub Actions because those are not implemented in the current
repository.

## 2. Scope

This workflow applies to source code, SQLite migrations, tests, documentation,
diagrams, and configuration examples maintained in this repository.

It applies to the current backend work for sites, devices, rooms, sensors, alarms,
MQTT telemetry, InfluxDB telemetry queries, and dashboard APIs.

The workflow MUST be used for changes intended to reach `main`. Local exploratory
work MAY remain uncommitted until it is ready to be organized into a focused change.

## 3. Git Workflow Philosophy

BIO-EMS uses Git to make engineering intent and verification visible.

- Changes SHOULD be small and incremental.
- A change MUST be reviewed before merge.
- Build and tests MUST pass before merge.
- Documentation is part of development and MUST accompany relevant changes.
- Commits SHOULD describe an observable unit of engineering work.
- History MUST remain understandable without relying on chat or local context.

Example: a warning-threshold schema change includes its migration, repository support,
verification, and any necessary engineering documentation in a coherent review scope.

## 4. Branch Strategy

`main` is the current shared branch in the repository. The following naming model is
the adopted convention for temporary change branches; it does not claim that every
example branch already exists.

| Branch pattern | Purpose | BIO-EMS example |
| --- | --- | --- |
| `main` | Shared integrated branch for reviewed work. | `main` |
| `feature/*` | New, approved capability or bounded enhancement. | `feature/dashboard-room-status` |
| `bugfix/*` | Defect correction outside urgent production handling. | `bugfix/alarm-threshold-boundary` |
| `hotfix/*` | Urgent production correction with minimal scope. | `hotfix/sqlite-bootstrap-order` |
| `release/*` | Release stabilization and release-only corrections. | `release/v0.10.0` |

- Work intended for merge SHOULD start from current `main`.
- A branch name MUST identify its purpose and avoid personal or ambiguous labels.
- A branch MUST NOT combine unrelated feature, bug-fix, and documentation objectives.
- Shared branches MUST NOT be force-pushed.

## Git Lifecycle

```text
                main
                  │
     ┌────────────┼────────────┐
     │            │            │
 feature/*    bugfix/*    hotfix/*
     │            │            │
     └────────────┴────────────┘
                  │
                  ▼
          Pull Request
                  │
                  ▼
           Code Review
                  │
                  ▼
             Approval
                  │
                  ▼
               Merge
                  │
                  ▼
                main
```

All production changes follow this lifecycle: they begin from `main` on an
appropriately named branch, receive review and approval, then return to `main` by
merge after required verification.

## 5. Commit Message Guidelines

Commit messages SHOULD use a concise conventional format:

```text
type(scope): imperative summary
```

| Type | Use |
| --- | --- |
| `feat` | Add an implemented capability. |
| `fix` | Correct a defect. |
| `docs` | Change documentation only. |
| `refactor` | Improve structure without intended behavior change. |
| `test` | Add or adjust tests. |
| `chore` | Maintenance that does not fit another type. |

Examples:

- `feat(domain): add alarm evaluation result`
- `fix(migration): correct bootstrap order`
- `docs(engineering): update testing guidelines`
- `refactor(service): simplify dashboard aggregation`

Commit messages MUST describe what changed, not only an internal task number. A commit
SHOULD be buildable and coherent when practical. Temporary commits MAY be consolidated
before review if doing so improves the history without obscuring reviewable changes.

## Commit Granularity

Commit granularity improves review quality and repository history by making each
change understandable, reversible, and attributable on its own.

- Each commit SHOULD represent one logical engineering change.
- Commits MUST remain understandable when viewed independently.
- Large unrelated modifications SHOULD be split into multiple commits.
- Documentation MAY be committed together with the implementation it describes.
- Temporary or experimental commits SHOULD be squashed before review when appropriate.

For example, a sensor-threshold migration and its repository support may form one
coherent commit, while an unrelated dashboard refactor SHOULD remain separate.

## 6. Pull Request Workflow

The current BIO-EMS workflow is a reviewed, manual verification flow.

```text
Issue or bounded work item
          |
          v
       Branch
          |
          v
   Implementation
          |
          v
        Build
          |
          v
        Tests
          |
          v
   Documentation
          |
          v
        Review
          |
          v
       Approval
          |
          v
        Merge
```

1. Identify the objective, affected layers, and existing contracts.
2. Create a correctly named branch from current `main`.
3. Implement the smallest coherent change.
4. Run `npm.cmd run build` from `backend/`.
5. Run `npm.cmd run test:run` from `backend/`.
6. Update documentation when behavior, architecture, migration, or operation changes.
7. Open a Pull Request with scope, modified files, validation, and known limitations.
8. Address review findings before approval and merge.

This sequence has no implied automated pipeline; build and test evidence is currently
provided by the change author and verified during review.

## 7. Merge Policy

A Pull Request MAY be merged only when its scope is understood, required review has
an approved outcome, and mandatory verification is complete.

Before merge, the Pull Request MUST have:

- A focused objective and intelligible commit history.
- Successful backend build and test results.
- Required documentation updates.
- No unresolved blocking review finding.
- No known violation of Domain, repository, service, API, or migration boundaries.

A Pull Request MUST NOT merge when it fails build or tests, exposes secrets, breaks
an approved API contract, omits a required migration, or contains unapproved scope.

## 8. Hotfix Workflow

A hotfix is reserved for an urgent correction to an already released or operational
behavior, such as a migration bootstrap defect that prevents a fresh database from
creating sensors.

1. Create `hotfix/<concise-description>` from the relevant stable branch.
2. Keep the change minimal and limited to the demonstrated defect.
3. Add or perform focused regression verification.
4. Run build and tests.
5. Document impact, verification, and follow-up work in the Pull Request.
6. Review and approve the hotfix before merge.

Urgency MUST NOT waive review, test, migration safety, or documentation requirements.

## 9. Release Branches

Release branches provide an optional controlled space for release stabilization.

- A `release/*` branch MAY be created when release-only changes need isolation.
- Release branches SHOULD contain version, release-note, verification, or narrowly
  scoped stabilization changes only.
- New features MUST NOT be added to a release branch.
- Any defect correction made on a release branch MUST be reconciled with `main`.
- Release branches do not imply automated deployment.

The current repository has historical versioned commits; this workflow does not claim
that a release-branch automation or deployment process exists.

## 10. Tagging Strategy

BIO-EMS version tags SHOULD use semantic version format:

```text
vMAJOR.MINOR.PATCH
```

| Component | Meaning |
| --- | --- |
| MAJOR | Incompatible approved contract or release change. |
| MINOR | Backward-compatible capability release. |
| PATCH | Backward-compatible correction or maintenance release. |

Tags SHOULD identify reviewed release points. A tag MUST NOT be used to imply that an
automated deployment happened. Version metadata and release documentation SHOULD agree
with any created tag.

## 11. Common Git Anti-Patterns

| Anti-pattern | Risk | Required alternative |
| --- | --- | --- |
| Large commits | Review cannot isolate behavior or risk. | Split into coherent, focused commits. |
| Direct commits to `main` | Shared history bypasses review. | Use a reviewed change branch. |
| Mixing refactoring with features | Functional review becomes ambiguous. | Separate when practical. |
| Skipping review | Defects and boundary violations reach shared code. | Open a Pull Request. |
| Force-pushing shared branches | Collaborator history can be lost. | Use ordinary reviewed updates. |
| Unrelated generated files | Review scope becomes noisy. | Exclude unrelated artifacts. |
| Migration without verification | Existing databases may become unusable. | Test fresh and upgrade paths. |

## 12. Git Review Checklist

Reviewers and authors MUST confirm:

- [ ] The branch name reflects the change purpose.
- [ ] The Pull Request has one coherent objective.
- [ ] Commit messages communicate meaningful changes.
- [ ] Unrelated worktree changes are not included.
- [ ] Build completed successfully.
- [ ] Tests completed successfully.
- [ ] SQLite schema changes include migrations and upgrade checks.
- [ ] Domain and API boundaries remain intact.
- [ ] Documentation changes are included where required.
- [ ] No secrets, database files, or local-only artifacts are committed.
- [ ] Blocking review comments are resolved.
- [ ] Merge target and release impact are understood.

## 13. Cross References

| Document | Relationship |
| --- | --- |
| `docs/engineering/ENGINEERING_PLAYBOOK.md` | Engineering rules and Definition of Done. |
| `docs/engineering/CODE_REVIEW_CHECKLIST.md` | Pull Request review outcomes and blockers. |
| `docs/engineering/TESTING_GUIDELINES.md` | Required build, tests, and verification practices. |

## Git Workflow Metrics

BIO-EMS encourages monitoring the health of the development workflow.

| Metric | Purpose |
|---------|---------|
| Average Pull Request Size | Encourage focused reviews |
| Average Review Turnaround Time | Improve engineering responsiveness |
| Build Success Rate Before Merge | Measure code stability |
| Test Success Rate Before Merge | Measure verification quality |
| Documentation Compliance | Ensure documentation evolves with code |
| Number of Hotfixes | Identify process or quality issues |

These metrics are intended to improve engineering processes and project quality.
They MUST NOT be used to evaluate individual developer performance.

## 14. Revision History

| Version | Date | Status | Change |
| --- | --- | --- | --- |
| 1.0 | 2026-08-05 | Approved | Initial Git workflow for the current BIO-EMS backend. |

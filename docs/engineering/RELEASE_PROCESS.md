# BIO-EMS Release Process

| Item           | Value               |
| -------------- | ------------------- |
| Document       | Release Process     |
| Version        | 1.0                 |
| Status         | Approved            |
| Applies To     | BIO-EMS Engineering |
| Owner          | Engineering Team    |
| Classification | Internal            |
| Last Updated   | 2026-08-05          |

## 1. Purpose

This document defines the current release process for the BIO-EMS repository.

The process makes a release a traceable engineering milestone: a reviewed repository
state with verified build and tests, accurate documentation, an identified version,
and a corresponding Git tag.

This document does not describe CI/CD pipelines, GitHub Actions, automated deployment,
or release automation because none is implemented in the current repository.

## 2. Scope

The process applies to releases of the current BIO-EMS backend and its supporting
engineering documents, SQLite migrations, tests, API documentation, and release notes.

It applies to the implemented site, device, room, sensor, alarm, MQTT telemetry,
InfluxDB telemetry, and dashboard capabilities.

Release approval remains with the Engineering Owner. Tools and AI assistants MAY
prepare evidence, but MUST NOT declare a release approved without owner approval.

## 3. Release Philosophy

BIO-EMS releases follow these principles:

- Quality before release.
- Documentation accompanies implementation.
- Every release reflects repository evidence.
- Releases are engineering milestones rather than calendar events.

A release MUST represent code and documentation that can be explained from the
repository. A planned feature MUST NOT be listed as released solely because it appears
in a roadmap, ADR, or future architecture document.

Example: the Sprint 10 release notes identify implemented Dashboard APIs, aggregation,
and telemetry queries; they do not claim that Monitoring Points or device onboarding
are released capabilities.

## Release Principles Summary

| Principle                              | Purpose                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------- |
| Quality Before Release                 | Prevent unstable releases from being published.                           |
| Evidence-Based Releases                | Ensure every release reflects verified repository evidence.               |
| Documentation Alongside Implementation | Keep engineering documentation synchronized with delivered functionality. |
| Owner Approval                         | Preserve engineering accountability for every release.                    |
| Repository Traceability                | Every release MUST be traceable to a reviewed repository state.           |

These principles guide every BIO-EMS release regardless of release type.

## 4. Release Types

| Release type   | Purpose                                                             | BIO-EMS example                                           |
| -------------- | ------------------------------------------------------------------- | --------------------------------------------------------- |
| Sprint Release | Records completion of a reviewed increment of implemented work.     | `v0.10.0` for Sprint 10 dashboard backend work.           |
| Patch Release  | Records a backward-compatible correction or maintenance update.     | A corrected SQLite migration bootstrap sequence.          |
| Hotfix Release | Records an urgent, narrowly scoped correction to released behavior. | A production-impacting telemetry or database startup fix. |

Release type MUST match the scope and risk of the change. A hotfix MUST NOT become a
vehicle for unrelated features or broad refactoring.

## 5. Release Workflow

The current release workflow is manual and evidence-based.

```text
Implementation Complete
        |
        v
Build
        |
        v
Tests
        |
        v
Documentation Review
        |
        v
ADR Review (if applicable)
        |
        v
Engineering Review
        |
        v
Owner Approval
        |
        v
Version Update
        |
        v
Git Tag
        |
        v
Release
```

1. Confirm that intended implementation work is complete and scoped.
2. Run the backend build from `backend/`.
3. Run the backend Vitest suite from `backend/`.
4. Review changed documentation, API contracts, migrations, and ADRs.
5. Evaluate open issues and known limitations for release impact.
6. Obtain Engineering Owner approval based on the evidence.
7. Update version and release notes as appropriate.
8. Create a semantic version Git tag for the approved repository state.
9. Record the release outcome and any known limitations.

No step in this workflow implies automatic deployment or publication.

## 6. Release Readiness Checklist

Before release, the owner and reviewers MUST confirm:

- [ ] Backend build succeeds with `npm.cmd run build`.
- [ ] Backend tests pass with `npm.cmd run test:run`.
- [ ] Documentation is updated for implemented behavior.
- [ ] ADRs are updated when the release includes an architectural decision.
- [ ] The repository diff and intended release scope were reviewed.
- [ ] Outstanding issues and known limitations were evaluated.
- [ ] The version is identified and consistent with release scope.
- [ ] `CHANGELOG.md` accurately summarizes the release.
- [ ] `VERSION` is updated when the repository version changes.
- [ ] Required migration verification has been completed for schema changes.
- [ ] No secrets, local databases, or unrelated artifacts are included.

An unchecked mandatory item MUST block the release unless the owner explicitly records
the exception and its risk.

### Release Decision

The Engineering Owner makes the final release decision after reviewing the readiness
evidence. Approval SHOULD identify the candidate version and confirm that known
limitations have been considered.

The owner MAY defer a release when evidence is incomplete, even if implementation work
appears complete. Deferral is preferable to publishing an ambiguous or unverifiable
repository state.

Release approval MUST NOT be inferred from a completed sprint note, a Git commit, or a
successful build alone.

The decision SHOULD also consider compatibility with the current REST contracts,
SQLite configuration data, and InfluxDB telemetry query behavior. Any unresolved
compatibility risk MUST be documented before a release is approved.

This check is manual and based on the reviewed repository state.

It does not require or imply release automation.

Evidence remains attached to the release record.

This preserves release traceability.

## 7. Versioning

BIO-EMS currently records its published version in the root `VERSION` file and
documents published and unreleased repository development in `CHANGELOG.md`. The
current published release is `v0.15.0`; earlier release tags remain immutable.

Completed Sprint work does not itself update `VERSION`, create a tag, or publish a
GitHub Release. Those actions require a separate release-readiness review and explicit
Engineering Owner approval.

Version tags SHOULD use semantic version format:

```text
vMAJOR.MINOR.PATCH
```

| Version component | Release interpretation                                         |
| ----------------- | -------------------------------------------------------------- |
| MAJOR             | An approved incompatible release change.                       |
| MINOR             | A backward-compatible engineering increment or sprint release. |
| PATCH             | A backward-compatible correction or hotfix.                    |

Version updates are manual. A tag MUST identify the reviewed release commit and MUST
NOT imply that deployment occurred automatically.

### Release Artifact Consistency

The release identifier appears in several repository artifacts and MUST remain
internally consistent.

| Artifact       | Current release role                                     |
| -------------- | -------------------------------------------------------- |
| `VERSION`      | Primary repository version value.                        |
| `CHANGELOG.md` | Human-readable release history and verification summary. |
| Git tag        | Immutable reference to the approved release commit.      |
| `package.json` | Backend package version metadata.                        |

Before tagging, reviewers SHOULD compare these artifacts and record any intentional
difference. A package metadata change MUST NOT be assumed to update the root version,
changelog, or Git tag automatically.

## 8. Release Notes

Release notes communicate what repository state was approved and what users or
engineers need to know about it.

`CHANGELOG.md` SHOULD include, where applicable:

- Features implemented in the release.
- Bug fixes.
- Architectural changes and relevant ADRs.
- Documentation updates.
- Test/build verification summary.
- Known limitations and deferred work.

Release notes MUST distinguish delivered behavior from proposed design. They SHOULD
name affected API areas, such as Dashboard Summary or Room Status, when that improves
operational clarity.

### Pre-Release Review

The release review confirms that the candidate contains only release-ready work.

- Reviewers MUST inspect the intended commit range and working-tree state.
- Reviewers MUST identify incomplete, experimental, or unrelated changes.
- Schema changes MUST be assessed for fresh-database and upgrade impact.
- Engineering documents MUST be checked for claims that exceed repository evidence.
- Known limitations SHOULD be carried into release notes when they affect users or
  maintainers.

Example: an accepted ADR for device onboarding does not make the onboarding workflow a
release feature while the current backend lacks QR, activation-code, and approval flows.

## 9. Hotfix Releases

Hotfix releases address urgent defects in released or operational behavior. They use
the same evidence standards as normal releases, with a narrower change scope.

- A hotfix MUST identify the specific defect and affected release behavior.
- A hotfix MUST include focused regression verification.
- A hotfix MUST pass build and tests before release.
- A hotfix SHOULD include only the correction, necessary tests, and essential docs.
- A hotfix MUST document its version and release-note impact.

Example: a startup defect that prevents migrations from adding required sensor columns
to a fresh SQLite database is suitable for a patch or hotfix release, not a dashboard
feature release.

## 10. Release Anti-Patterns

| Anti-pattern                              | Risk                                                      | Required response                             |
| ----------------------------------------- | --------------------------------------------------------- | --------------------------------------------- |
| Releasing without build verification      | TypeScript compilation failure reaches the release state. | Run and record the build.                     |
| Releasing without documentation updates   | Release behavior cannot be accurately understood.         | Update relevant documents and notes.          |
| Mixing incomplete features into a release | Scope and operational behavior become unclear.            | Exclude or label the work as not implemented. |
| Skipping engineering review               | Boundary and regression defects remain unexamined.        | Complete review before approval.              |
| Declaring features without evidence       | Roadmap items are mistaken for delivered capability.      | Verify claims against repository code.        |
| Tagging an unreviewed commit              | The version tag loses its traceability value.             | Tag only the approved release state.          |

## 11. Release Quality Gates

Release quality gates require evidence, not confidence alone.

| Gate           | Current required evidence                                          |
| -------------- | ------------------------------------------------------------------ |
| Implementation | Changed files match the approved release scope.                    |
| Build          | `npm.cmd run build` succeeds.                                      |
| Tests          | `npm.cmd run test:run` succeeds.                                   |
| Database       | Fresh and upgrade migration behavior verified when schema changes. |
| Architecture   | ADRs and engineering documents reflect the implemented decision.   |
| Documentation  | Version, changelog, and relevant technical documents are accurate. |
| Approval       | Engineering Owner approves release readiness.                      |

For a documentation-only release update, the build and test gate MAY be recorded as
not applicable if no backend source or package configuration changed. For a source
release, build and tests MUST be completed.

### Release Record

After owner approval, the release record SHOULD identify the final version, Git tag,
release notes entry, build/test evidence, and any known limitation accepted for the
release. The record MAY be contained in the Pull Request, release notes, or both.

The release record MUST remain repository-based. It MUST NOT rely only on an external
conversation or an assumed deployment outcome.

## Lessons Learned

The following observations were derived from practical BIO-EMS release experience.

- Repository evidence is more reliable than assumptions during release preparation.
- Documentation should evolve together with implementation.
- Small, well-reviewed releases reduce regression risk.
- Updating ADRs together with implementation improves release traceability.
- Engineering Owner approval remains essential even when technical verification succeeds.

These observations reflect the current BIO-EMS engineering process and MAY evolve as
the project grows.

## 12. Cross References

| Document                                      | Relationship                                         |
| --------------------------------------------- | ---------------------------------------------------- |
| `docs/engineering/ENGINEERING_PLAYBOOK.md`    | Definition of Done and release checklist.            |
| `docs/engineering/GIT_WORKFLOW.md`            | Branch, review, tag, and merge practices.            |
| `docs/engineering/CODE_REVIEW_CHECKLIST.md`   | Merge blockers and review outcomes.                  |
| `docs/engineering/TESTING_GUIDELINES.md`      | Build, test, migration, and regression verification. |
| `docs/engineering/ADR_POLICY.md`              | Architectural decision documentation.                |
| `docs/engineering/AI_DEVELOPMENT_WORKFLOW.md` | Evidence-based AI-assisted engineering handoff.      |

## Release Metrics

BIO-EMS encourages monitoring release quality over time.

| Metric                       | Purpose                                                        |
| ---------------------------- | -------------------------------------------------------------- |
| Build Success Rate           | Measure release stability.                                     |
| Test Success Rate            | Measure release quality.                                       |
| Documentation Completeness   | Ensure documentation remains synchronized with implementation. |
| ADR Coverage                 | Verify architectural changes are documented.                   |
| Hotfix Frequency             | Identify recurring engineering quality issues.                 |
| Release Readiness Completion | Measure adherence to the release checklist.                    |

These metrics are intended to improve engineering processes and release quality.

They MUST NOT be used to evaluate individual developer performance.

## 13. Revision History

| Version | Date       | Status   | Change                                                           |
| ------- | ---------- | -------- | ---------------------------------------------------------------- |
| 1.0     | 2026-08-05 | Approved | Initial manual release process for the current BIO-EMS workflow. |

# BIO-EMS Development Rules

## Documentation and release authorities

- `PROJECT_STATE.md` is the **single authoritative current-state document**.
- `IMPLEMENTATION_PLAN.md` is the approved execution-plan document; it does not replace current state.
- `README.md` is the stable project entry/map; it must not become a second project-status ledger.
- `docs/SPRINT_PROGRESS.md` is a historical execution ledger only.
- Dedicated Sprint/BF/PVR/audit/closure/hardware documents are evidence for their specific work; they do not override `PROJECT_STATE.md`.
- `VERSION` is the source-software version authority.
- `CHANGELOG.md` is the controlled source/release ledger.
- The backend package version must match `VERSION`. The frontend private scaffold package version is not an independent BIO-EMS product version.
- Published Git tags/releases are immutable release artifacts. A source version can be prepared before its tag is published, but documentation must distinguish those states explicitly.

## Engineering rules

### 1.
No direct database access outside repositories/persistence boundaries.

### 2.
Every feature must be documented.

### 3.
Every API must have appropriate REST/contract tests.

### 4.
Every completed release/sprint milestone updates, where applicable:

- `VERSION`
- `CHANGELOG.md`
- `PROJECT_STATE.md`

Do not recreate `docs/project-status.md` or any competing current-state file.

### 5.
All code is written in English.

### 6.
No business logic inside Controllers.

### 7.
Telemetry always goes through the approved Telemetry service/domain path.

### 8.
No hard-coded business/configuration values.

### 9.
Every new feature includes, when applicable:

- database change + migration;
- API/contract change;
- tests;
- documentation;
- architecture update/ADR if architecture is affected.

### 10.
No avoidable code duplication.

### 11.
Every public function has one clear responsibility.

### 12.
Never mix configuration data with telemetry data.

### 13.
Every controlled exception/error path must be logged or represented through the approved error/evidence boundary without exposing secrets.

### 14.
Folder/module naming must remain consistent across the project.

### 15.
No breaking architecture change without an ADR.

### 16.
Every database schema change requires a versioned migration.

### 17.
Repositories contain persistence access only; business policy belongs in services/domain modules.

### 18.
Services/domain modules contain business logic; Controllers remain transport/request-response boundaries.

### 19.
Controllers validate/route requests and return responses; they do not own domain policy.

### 20.
Every feature remains backward compatible unless the incompatibility is deliberately approved and documented in `CHANGELOG.md` and, when architectural, an ADR.

### 21.
Every substantive module has supporting documentation under `/docs` where needed for operation, architecture, validation, or evidence.

### 22.
No magic numbers. Use named constants or configuration values.

### 23.
Every API response follows the approved API contract/standard for that endpoint family. Existing public contracts are not casually reshaped for cosmetic uniformity.

### 24.
Every new module/capability that changes the current product position must be reflected in `PROJECT_STATE.md`; detailed evidence belongs in its dedicated document.

### 25.
No unresolved TODOs in production code unless explicitly tracked as approved deferred scope outside the production path.

### 26.
Every commit must keep the project in a runnable/reviewable state.

### 27.
No feature is considered source-software complete until required code, tests, documentation, version/changelog impact, and current-state impact are reconciled.

### 28.
Never remove existing product functionality without explicit approval or an approved replacement/migration path.

### 29.
Architecture decisions affecting multiple modules must be documented before implementation.

### 30.
Document any approved deviation from established architecture.

### 31.
Before implementing a feature:

- review existing architecture and contracts;
- review current-state and relevant documentation;
- avoid duplicate implementations;
- reuse existing modules where appropriate.

### 32.
Documentation changes follow the same review/CI discipline as code. When the user has granted standing autonomous repository authority for the active work package, routine documentation reconciliation may proceed without repeated confirmation. High-impact scope/architecture/business-policy changes still require the approval process defined below.

### 33.
Every completed controlled milestone must be committed/pushed through the approved GitHub workflow before the next dependent milestone is treated as based on it.

### 34.
Never commit runtime/secrets/build artifacts. Examples include:

- `.env`
- `*.db`, `*.db-shm`, `*.db-wal`
- `node_modules`
- logs
- generated build artifacts not explicitly controlled as release assets.

### 35.
Feature/architecture proposals follow the controlled lifecycle when applicable:

Idea → Discussion → Business/Domain Review → Design Review → Documentation/ADR → Implementation → Testing → Documentation/State Update → Git Commit/Push/PR/CI.

### 36.
Ideas and approved architecture decisions are different:

- ideas belong in `docs/project-ideas.md` when a persistent idea register is needed;
- accepted architecture decisions belong in ADRs;
- only approved ADRs may deliberately change system architecture.

### 37.
Business requirements drive implementation. Each material feature should establish the business requirement, use case/domain impact, and acceptance criteria before implementation.

### 38.
Security, authorization, audit, Site isolation, credentials, and regulated evidence boundaries must be reviewed whenever a feature touches those domains.

### 39.
Requirements must be documented before implementation when the work changes functional/non-functional behavior, public contracts, operational evidence, or acceptance criteria.

### 40.
Product scope is controlled. New features outside the approved release/work-package scope must be documented and reviewed before implementation.

## Versioning policy

BIO-EMS follows Semantic Versioning for source/product milestones:

- **MAJOR** — incompatible/breaking product or contract change.
- **MINOR** — backward-compatible substantive new functionality.
- **PATCH** — backward-compatible fixes/hardening without substantive new product functionality.

A version bump is not a field-acceptance claim. Software/CI completion, physical hardware validation, live provider evidence, commissioning, UAT, and customer acceptance remain separately stated evidence states.

## Release procedure

For a controlled published release:

1. reconcile `VERSION`, backend package metadata, README source-version display, `CHANGELOG.md`, and `PROJECT_STATE.md`;
2. run the normal backend/frontend GitHub CI gates on the exact release-preparation head;
3. merge the release-preparation PR;
4. create the annotated Git tag against the exact merged release commit;
5. push/publish the GitHub Release for that tag;
6. verify the tag target, release metadata, and source-version documentation;
7. only then describe that version as the latest **published tagged release**.

Historical release tags and their claims are immutable and must not be rewritten to include later development.
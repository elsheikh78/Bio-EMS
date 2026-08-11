# Sprint 13 Closure Evidence

**Status:** Pending independent review

**Sprint 13:** Not closed by this document

**Sprint 14:** Not started

## Purpose

This is an evidence file and closure recommendation, not a unilateral closure
decision. Sprint 13 closure may be considered after S13-08 independent review and
controlled merge verification.

## Baseline and release boundary

- Audited `main`: `857834f194afb4bb750c2247ebea5e56fab061f2`.
- Version metadata: `0.13.0` in `VERSION` and backend package metadata.
- Published GitHub Release `v0.13.0`: unchanged, non-draft, non-prerelease.
- Immutable tag target: `ee2cb45832888ff500e02afcbe1418b6144276c6`.
- S13-06 and S13-07 were merged after the tag. They exist on current `main` but
  are not retroactively part of the tagged artifact.
- Current-main CI run 31504321547 succeeded with 30 test files and 359 passing
  tests, and zero failed, skipped, or todo tests.

## Story evidence matrix

| Story  | Goal and status                                                                            | PR and commit evidence                                                                                                                                                                      | Components and acceptance evidence                                                                   | CI and residual notes                                                        | Verdict             |
| ------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------- |
| S13-01 | User/authentication foundation; merged                                                     | PR #3; `4160fd4df050eb30170aeb1c902e6b3a7fb6d8c6`                                                                                                                                           | User persistence, password service, bootstrap; unit/migration coverage                               | PR #3 CI evidence; no blocker found                                          | Completed           |
| S13-02 | Login and token behavior; merged                                                           | PR #3; `acfb76010f85c171389dd346b72c1e46382420bd`                                                                                                                                           | Auth route/service and JWT configuration; login/token tests                                          | PR #3 CI evidence; no blocker found                                          | Completed           |
| S13-03 | Protected-request authentication; merged                                                   | PR #3; `44388acb28581c2ccf0240edccc78d2d7965f239`                                                                                                                                           | Authentication middleware; denial/acceptance tests                                                   | PR #3 CI evidence; no blocker found                                          | Completed           |
| S13-04 | Persisted active-User enforcement and test isolation; merged                               | PR #3; `37e0af9eb551cf8184271b7a45928cda882f4cb8`, `b4ba6db4b5fbdb810a0462c001c47f4e5707a2b6`                                                                                               | Application, repository, token, and middleware regressions                                           | Run 31400103719 succeeded                                                    | Completed           |
| S13-05 | Central RBAC and Alarm acknowledgment actor audit; merged                                  | PR #4; `4c226dbc9e895494a7c8ffe65ebe368d95857a33`, `901ba4d8f296306a9ff85bc3726f0407a5d966ad`, `12495b906c69ef0bfb19af5fcebb5df911ef4f05`                                                   | Authorization policy/middleware/routes and Alarm persistence tests                                   | Run 31468333502 succeeded; data ownership remains separate from RBAC         | Completed           |
| S13-06 | ADMIN User Management and last-active-ADMIN protection; merged                             | PR #7; `5bb1e89fd0ca3f81fc0e4e391745b546984b6f7f`, `ba361537de79f01c30f059568ea92d690f5a8851`, `296fa695490a9da9136d3c4c302c41d74fa5f315`                                                   | User route/service/repository, application, transaction, and production-repository concurrency tests | Run 31483398328 succeeded                                                    | Completed           |
| S13-07 | Logging hardening, regressions, and direct-dependency cleanup; merged                      | PR #8; `504262d4178a84177231eae04bea14ecc511711b`, `04639d6973a24a98f12a1a668f67a8041e7a419f`, `3cabfbb288485d55a4692816369d4bad6d395585`; merge `857834f194afb4bb750c2247ebea5e56fab061f2` | MQTT security and User Management regressions; package cleanup; no API/MQTT contract change          | PR run 31486443019 and main run 31504321547 succeeded; transitive risk below | Completed           |
| S13-08 | Correct documentation and prepare closure evidence; implementation complete on this branch | This documentation branch and its Draft PR                                                                                                                                                  | Six documentation artifacts; full local gates below                                                  | Independent review and controlled merge required                             | Partially completed |

## S13-07 verification detail

- Current-main suite: 30 files and 359 passing tests; 0 failures, 0 skipped, 0 todo.
- Rejected MQTT topic/payload values are sanitized before logging.
- User Management authorization, last-active-ADMIN, and concurrency regressions are covered.
- The unused direct `yamljs` dependency was removed without a public contract change.
- The transitive `mqtt -> socks -> ip-address` chain remains without an available
  fix. Proxy/CIDR input is not user-controlled in the current product boundary, so
  available evidence records it as residual dependency risk rather than a blocker.

## S13-08 documentation audit

| Artifact                       | Finding                                          | Action in S13-08                                 |
| ------------------------------ | ------------------------------------------------ | ------------------------------------------------ |
| `README.md`                    | Stale v0.12.0/Sprint 12 status                   | Align with v0.13.0 and current-main capabilities |
| `CHANGELOG.md`                 | Conflated tagged release with later work         | Preserve release facts; add post-release history |
| `VERSION`, package metadata    | Accurate at 0.13.0                               | No change                                        |
| `PROJECT_STATE.md`             | Stale Sprint 12 state                            | Update implementation and closure status         |
| `docs/project-status.md`       | Authentication/User Management shown as deferred | Correct from merged evidence                     |
| `docs/architecture/roadmap.md` | Stale phases and Sprint 12 claims                | Align without claiming future work started       |
| Sprint 13 plan                 | Accurate planning source                         | No change                                        |
| Sprint 13 closure evidence     | Missing                                          | Create this review artifact                      |

Local S13-08 verification completed with 30 test files and 359 passing tests, zero
failures, skips, or todos. Typecheck, build, ESLint, backend Prettier, Markdown
Prettier, and `git diff --check` succeeded. No repository-native documentation/link
checker is configured; local relative links and referenced GitHub evidence were
reviewed directly.

The Draft PR metadata is authoritative for the final S13-08 head SHA, changed-file
list, PR URL, and CI result; a commit cannot embed its own SHA. These values must be
verified at the independent review gate before merge.

## Protected-state declaration

At the implementation baseline, PR #6 remained OPEN, Draft, and unmerged at
`798739e040399159c817856d1e63bd466d6c39c2`; PR #8 remained MERGED. These states
must be rechecked at final handoff.

S13-08 changes documentation only. It does not alter application code, tests,
dependencies, lockfiles, workflows, schemas, API contracts, VERSION, the published
`v0.13.0` tag or GitHub Release, or PR #6/PR #8. It creates no tag, Release, or
deployment. It does not start Sprint 14 and does not itself close Sprint 13.

## Closure recommendation

Sprint 13 closure may be considered after S13-08 independent review and controlled merge verification.

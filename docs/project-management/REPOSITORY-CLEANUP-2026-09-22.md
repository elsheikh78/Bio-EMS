# Repository Cleanup Record — 22 September 2026

## Scope

This record documents the repository hygiene review performed after PR #240 was merged into `main`.

Authoritative `main` at audit start:

`992e26df5252bc533e8e4c10ddcbb1eb628047bd`

The source version remains `0.20.0`. Repository cleanup does not create a new product release or change field-acceptance status.

## Branch audit

At audit start the repository contained 257 branches total: `main` plus 256 non-main branches.

The review found:

- 224 non-main branches whose current head exactly matched the head of a previously merged pull request.
- 29 additional non-main branches with `ahead_by = 0` relative to current `main`.
- 3 historical documentation branches with commits not present on `main`; none contains runtime/product code requiring recovery.

The three historical branches with unique documentation were reviewed individually:

1. `agent/p2-02-config-receipt-integrity`
   - PR #116 is merged.
   - PR #116 CI run #339 succeeded.
   - Current repository history and later handoff documentation already preserve P2-02 completion evidence.
   - No unique branch content needs to be carried forward.

2. `agent/update-readme-v0.13.0`
   - Historical README-only work.
   - PR #6 was closed without merge.
   - Content describes obsolete v0.13.0 state and must not replace current documentation.

3. `agent/v0-18-current-docs-reconciliation`
   - Historical documentation-only work.
   - PR #138 was closed without merge and is explicitly treated as stale/non-authoritative by later project state.
   - No content needs to be carried forward.

Conclusion: after this cleanup change is merged, all historical non-main branches from the audit set are eligible for remote deletion without loss of current product code or authoritative project state.

## Workflow cleanup

The following one-off repair/autofix workflows were removed because their target feature branches are complete and merged:

- `.github/workflows/auth-recovery-autofix.yml`
- `.github/workflows/auth-recovery-ci-repair.yml`
- `.github/workflows/auth-recovery-migration-fix.yml`
- `.github/workflows/auth-recovery-test-fix.yml`
- `.github/workflows/dep-br-prettier-fix.yml`

These workflows had write access and were branch-specific repair mechanisms. Keeping them after branch closure would add unnecessary repository mutation paths.

The permanent quality workflows retained are:

- `.github/workflows/ci.yml`
- `.github/workflows/windows-internal-setup.yml`

The stale `feat/com-01-06-communication-channels` pull-request trigger was also removed from `ci.yml`; normal pull-request CI now targets `main`.

## Repository policy follow-up

After this cleanup PR is merged:

1. delete the audited historical remote branches;
2. enable automatic deletion of merged head branches;
3. protect `main` against deletion and force-push;
4. require the normal CI quality gate before merge;
5. create short-lived task branches only when active work begins.

Historical pull requests, merge commits, Actions runs and tags remain the audit trail after branch deletion.

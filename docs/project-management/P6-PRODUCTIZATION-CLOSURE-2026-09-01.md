# P6 Productization / Deployment / Acceptance Closure

## Software gate

The `0.18.0` source package reconciles `VERSION`, backend metadata, and the controlled release manifest. Run `npm run validate:release` from `backend/` before release preparation. The normal backend/frontend CI gates remain mandatory.

## Deployment procedure

1. Follow `docs/engineering/RELEASE_PROCESS.md` and build from an immutable Git commit.
2. Run the release-package validator and production deployment validator.
3. Follow `docs/deployment/production-runbook.md`, record operator/time/environment, and retain backup/restore evidence outside the source repository.
4. Execute the controlled commissioning checklist and attach genuine physical/live evidence.
5. Obtain BIO EGYPT UAT, Quality approval, customer sign-off, and production acceptance through the authorized evidence process.

## Acceptance boundary

P6 source-software productization is complete when the release manifest and automated gates pass. Production deployment, physical commissioning, endurance, live-provider delivery, UAT, customer sign-off, and release acceptance remain **EXTERNAL EVIDENCE OPEN** until actually performed. CI must never be treated as evidence for those gates.

# BIO-EMS Development Rules

## 1.
No direct database access.

## 2.
Every feature must be documented.

## 3.
Every API must have REST tests.

## 4.
Every Sprint updates:

- VERSION
- CHANGELOG
- project-status

## 5.
All code in English.

## 6.
No business logic inside Controllers.

## 7.
Telemetry always goes through TelemetryService.

## 8.
No hard-coded values.
## 9.
Every new feature must include:

- Database changes (if needed)
- REST API
- Tests (.http)
- Documentation
- Architecture update (if affected)

## 10.
No code duplication.

## 11.
Every public function must have a clear responsibility.

## 12.
Never mix configuration data with telemetry data.

## 13.
Every exception must be logged.

## 14.
Folder names are singular only when representing one module, otherwise use consistent naming across the project.

## 15.
No breaking architecture changes without ADR.
## 16.
Every database schema change must have a migration.

## 17.
Repositories contain database access only.

## 18.
Services contain business logic only.

## 19.
Controllers only validate requests and return responses.

## 20.
Every feature must be backward compatible unless documented in CHANGELOG.

## 21.
Every module must have its own documentation under /docs.

## 22.
No magic numbers.
Use constants or configuration values.

## 23.
Every API response must follow the standard response format.

## 24.
Every new module must be added to project-status.

## 25.
No TODOs in production code.

## 26.
Every commit must keep the project in a runnable state.

## 27.
No feature is considered complete until:
- Code
- Tests
- Documentation
- Version
- Changelog
- Project Status
are all updated.

## 28.
Never delete existing functionality without explicit approval.

## 29.
Architecture decisions must be documented before implementation when they affect multiple modules.

## 30.
Always document any deviation from the original architecture.
## 31.
Before implementing any feature:

- Review existing architecture.
- Review documentation.
- Avoid duplicate implementations.
- Reuse existing modules whenever possible.
## 32.
Before updating any documentation, the assistant must:

- Tell the user which file will be updated.
- Tell the user where the file is located.
- Provide the complete text ready for copy/paste.
- Wait for confirmation before continuing.

## 33.

Every completed Sprint must be committed and pushed to GitHub before starting the next Sprint.

Required steps:

- git status
- git add
- git commit
- git push
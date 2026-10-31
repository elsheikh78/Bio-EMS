# Developer Setup and Verification

Updated 31 October 2026 after PR #316; [project state](../../PROJECT_STATE.md) records exact reviewed/merged heads and remaining field tests. Install dependencies from committed lockfiles with `npm ci`; avoid unreviewed `npm audit fix --force`. Open advisories are listed in the [dependency report](../audit/2026-10-28/DEPENDENCIES.md).

## Local platform development

Use the Node version in the component's CI workflow (backend/frontend Node 22; cloud Node 24). The audit host used Node 24.22.1 and npm 11.9.0, so those results supplement rather than replace Node 22 CI. Native SQLite/bcrypt modules must be built for the actual Node ABI and operating system.

For backend, use `.env.example` as the non-secret template, configure a ≥32-byte JWT secret, SQLite persistence, MQTT and Influx for the intended mode. Never place actual passwords, tokens or production configuration in git. Development CORS defaults to exactly `http://localhost:5173`; production requires the approved exact allowlist. `npm run validate:deployment` validates production prerequisites; it must not be bypassed to force a pilot onto a production environment.

From `backend/`:

```sh
npm ci
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run build
npm run dev
```

Run `frontend/` in a separate development process, after the same install/typecheck/lint/format/test/build sequence; `npm run dev` starts Vite. These dev servers are not customer deployment instructions.

## Component gates

| Working directory | Verification |
| --- | --- |
| `backend` | `npm run typecheck`, `lint`, `format:check`, `test:run`, `build` |
| `frontend` | Same named scripts as backend |
| `company-cloud` | `npm test`, `npm run build`, `npx wrangler deploy --dry-run` after frontend build prerequisites |
| `mobile`, `company-mobile` | `npm run typecheck`, `npm test`, `npm run export` |
| `tools/bluetooth-bridge` | `python -m unittest -v` from that directory; Windows `pip install -r requirements.txt` then `python -m PyInstaller --clean --noconfirm --onedir --console --collect-all bleak --name BIOEMS-Bluetooth-Bridge bridge.py` |
| `tools/hardware-tester` | `python -m unittest discover -s tests -v`; `python smoke.py <scratch-directory>` |
| Repository | `python tools/project-audit/check_docs.py` |

Tester Python dependencies are pinned in `requirements.txt`; install them in an isolated environment. Windows executable packaging and bundled firmware/tool manifests are handled by the controlled workflow. Running from source does not conjure precompiled images or flash tools.

For firmware host verification, run the exact C compiler commands in `.github/workflows/firmware-esp32s3.yml`. ESP32-S3 native compilation uses ESP-IDF 5.5.5 in that workflow; Nano compilation/toolchain comes from its controlled workflow. A host C test does not substitute for either MCU build or hardware execution.

## Test interpretation

The [verification matrix](../audit/2026-10-28/VERIFICATION.md) records exact results and commands. Tests use isolated/mocked services where appropriate; passing them does not show a live MQTT broker, Influx server, GSM provider, Cloudflare deployment, Windows lifecycle or real sensors passed. No fresh numerical coverage percentage was measured by this audit. The isolated security probes document current defects and are not a replacement for desired regression tests after fixes.

## Review and release

Follow PROJECT_RULES and approved ADR/work-package requirements. Re-run only the relevant gates after a change, then release gates on the final merge candidate. Update the source-backed guide, project state when status changes, controlled changelog, and risk/finding evidence. Version/release metadata is not changed for this documentation audit.

## Security candidate test-tool prerequisites

The phase-two candidate uses Vitest 5 with Node>=22.12 and Vite>=6.4. Keep the pinned CI/Windows Node22.23 line or a compatible newer supported runtime. Use npm ci on the matched lockfiles. Source/database tests are discovered explicitly; compiled dist files must not be executed as duplicate CommonJS tests. Preserve assertions when adapting constructor mocks/types; do not suppress runner errors or mark tests skipped to make a migration green.

## Integrated Main resilience verification

PR #316 local results: backend 1116, frontend 359, Tester 78, BLE bridge 3 (1556 tests); type/lint/format/production builds and documentation checks passed. Seven exact-head workflows passed, including both Main firmware layouts and Windows packages/lifecycle. See [the integration receipt](../hardware/evidence/MAIN-RESILIENCE-INTEGRATION-2026-10-31.json), not older audit counts, for this change. These counts are dated evidence, not a substitute for rerunning checks after source changes.

The BLE bridge's unit tests cover framing bounds/local HTTPS origin; they do not simulate an attached Windows USB radio. Firmware compile/host tests do not prove RF range, GPIO polarity, supply continuity, card power-loss durability or full-population timing. Preserve the open HW/DEP acceptance list and reminder rule in project state.

# SD replay validation — 18 October 2026

Local implementation based on main `2c484a76255acdbf46371609fc37f790675c0b16`, branch `feat/sd-offline-replay-battery-design`.

| Check | Result |
| --- | --- |
| Backend full Vitest suite | 160 files, 1086 tests passed |
| Final targeted device ingress / telemetry checks | 2 files, 29 tests passed |
| Backend TypeScript typecheck | Passed |
| Backend ESLint / touched TypeScript formatting | Passed |
| Native C queue test with `-Wall -Wextra -Werror` | Passed: FIFO, capacity refusal, retry without acknowledgement, reopen/reboot, corrupt-record preservation and maximum record size |
| ESP-IDF 5.5.5 target ESP32-S3 cross-build | Passed; application size `0x109f30`, 29% free in 1500 KiB factory partition |
| Diff whitespace check | Passed |
| Windows installer build / GitHub CI | Local checks completed; remote CI to run after authorized publication |
| Real SD card, RS485, power interruption, battery/charger runtime | Not run; physical components required |

The local build environment needed `IDF_COMPONENT_MANAGER=0` because process ancestry inspection in the installed component-manager package failed in this sandbox. All dependencies used here are built-in ESP-IDF components; no external managed component was skipped. An initial wrong-target/stale bootloader build was discarded; the passing build explicitly targets `esp32s3` and produces ESP32-S3 bootloader, partition table and application images.

Hardware design is a requirement and acceptance plan, not a tested bill of materials. Exactly one central battery assembly/charger in Main backs Main plus four SIM-D4 and up to sixteen probes. The user confirmed a 30-minute full-load backup target. Measured full load, exact local module/pack and price remain open. No hardware power continuity, battery health telemetry or calibration results are claimed.

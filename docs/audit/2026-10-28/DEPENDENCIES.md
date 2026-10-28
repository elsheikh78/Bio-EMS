# Dependency Advisory Snapshot

Registry query28 October 2026 against baseline lockfiles. Commands: `npm audit --json` and `npm audit --omit=dev --json` in each component. Counts are affected package entries per dependency tree, including transitive/overlapping entries; they are not unique CVEs or demonstrated exploitable paths. Production classification is npm metadata, not proof that every module ships in the final bundle.

| Component | All: Critical / High / Moderate / Low | Production: Critical / High / Moderate / Low |
| --- | --- | --- |
| backend | 3 / 9 / 3 / 0 | 1 / 6 / 2 / 0 |
| frontend | 2 / 5 / 2 / 0 | 0 / 1 / 0 / 0 |
| company-cloud | 0 / 1 / 2 / 0 | 0 / 0 / 0 / 0 |
| mobile | 0 / 4 / 0 / 5 | 0 / 4 / 0 / 5 |
| company-mobile | 0 / 4 / 0 / 5 | 0 / 4 / 0 / 5 |

## Interpretation and action

The backend production Critical entry is transitive proxy-addr. [Upstream GHSA-jqcg-44mw-7w3h](https://github.com/advisories/GHSA-jqcg-44mw-7w3h) identifies unsafe IPv4-mapped/zero-prefix trust subnet configurations and patch 2.0.8. No `trust proxy` setting was found in reviewed app.ts; exploitability of that precondition was not established. Do not describe this audit as proof of an exploited host. Backend runtime High entries still require path-specific analysis. Development Critical entries include Vitest/Tinypool and affect tooling, not automatically the deployed Express runtime.

No dependency versions were changed. Review each installed chain/advisory, choose supported patched versions (some suggestions require major upgrades), update locks, rerun contracts/build/native packaging and repeat both audit scopes. Do not use force upgrades to erase the report without compatibility validation. No Python/ESP-IDF/AVR/Windows vendor binary vulnerability scan was performed.

## Production affected entries

### backend

| Package | Severity | Direct | Affected range | Advisory sources |
| --- | --- | --- | --- | --- |
| axios | high | True | `1.0.0 - 1.19.0` | [GHSA-vh66-26gq-q6x8](https://github.com/advisories/GHSA-vh66-26gq-q6x8), [GHSA-9fr6-4gfg-395g](https://github.com/advisories/GHSA-9fr6-4gfg-395g), [GHSA-c29m-xwm3-cm6r](https://github.com/advisories/GHSA-c29m-xwm3-cm6r), [GHSA-mghh-pgcx-3jjj](https://github.com/advisories/GHSA-mghh-pgcx-3jjj), [GHSA-x97p-jq2g-jp4f](https://github.com/advisories/GHSA-x97p-jq2g-jp4f), [GHSA-3pq3-5fj3-cg6v](https://github.com/advisories/GHSA-3pq3-5fj3-cg6v), [GHSA-542g-h47m-68v8](https://github.com/advisories/GHSA-542g-h47m-68v8), [GHSA-j8rh-479h-cp32](https://github.com/advisories/GHSA-j8rh-479h-cp32), [GHSA-4hqw-qxg8-jxx2](https://github.com/advisories/GHSA-4hqw-qxg8-jxx2), [GHSA-m8m8-qj5v-23w3](https://github.com/advisories/GHSA-m8m8-qj5v-23w3), [GHSA-44g4-m2mj-wpvx](https://github.com/advisories/GHSA-44g4-m2mj-wpvx), [GHSA-r4gj-5m52-g5wh](https://github.com/advisories/GHSA-r4gj-5m52-g5wh) |
| body-parser | high | False | `2.0.0 - 2.3.0` | [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828) |
| compression | high | True | `<1.8.2` | [GHSA-vc2v-76pw-4v95](https://github.com/advisories/GHSA-vc2v-76pw-4v95) |
| follow-redirects | high | False | `1.16.0` | [GHSA-q3jh-wrc6-jgq8](https://github.com/advisories/GHSA-q3jh-wrc6-jgq8), [GHSA-8r9p-f939-6h3c](https://github.com/advisories/GHSA-8r9p-f939-6h3c) |
| ip-address | moderate | False | `<=10.7.3` | [GHSA-rpw4-54j3-4h4q](https://github.com/advisories/GHSA-rpw4-54j3-4h4q), [GHSA-2vr4-cq9g-pvrc](https://github.com/advisories/GHSA-2vr4-cq9g-pvrc), [GHSA-j6r3-76f7-8jcv](https://github.com/advisories/GHSA-j6r3-76f7-8jcv), [GHSA-h3mg-xc3c-68pw](https://github.com/advisories/GHSA-h3mg-xc3c-68pw), [GHSA-rxp7-6hxx-x8q5](https://github.com/advisories/GHSA-rxp7-6hxx-x8q5) |
| nodemailer | high | True | `<=10.1.3` | [GHSA-6vj9-mwq6-2f5v](https://github.com/advisories/GHSA-6vj9-mwq6-2f5v), [GHSA-8vvx-rff5-p5rq](https://github.com/advisories/GHSA-8vvx-rff5-p5rq), [GHSA-g57g-f23g-4646](https://github.com/advisories/GHSA-g57g-f23g-4646), [GHSA-v53p-9fqp-m79j](https://github.com/advisories/GHSA-v53p-9fqp-m79j), [GHSA-prgh-xp8r-p3m5](https://github.com/advisories/GHSA-prgh-xp8r-p3m5), [GHSA-39m8-27wv-hr27](https://github.com/advisories/GHSA-39m8-27wv-hr27), [GHSA-8c8m-p3m8-cjg8](https://github.com/advisories/GHSA-8c8m-p3m8-cjg8), [GHSA-m943-m63m-w62w](https://github.com/advisories/GHSA-m943-m63m-w62w), [GHSA-85x2-q946-cp5h](https://github.com/advisories/GHSA-85x2-q946-cp5h), [GHSA-4ffr-jq9g-5ffx](https://github.com/advisories/GHSA-4ffr-jq9g-5ffx), [GHSA-g73g-hqqh-jr95](https://github.com/advisories/GHSA-g73g-hqqh-jr95), [GHSA-4g23-2xm8-66gc](https://github.com/advisories/GHSA-4g23-2xm8-66gc) |
| proxy-addr | critical | False | `1.1.0 - 2.0.7` | [GHSA-jqcg-44mw-7w3h](https://github.com/advisories/GHSA-jqcg-44mw-7w3h) |
| qs | moderate | False | `2.2.5 - 6.16.0` | [GHSA-x5fp-wj9c-mxmx](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx), [GHSA-4mjr-xmp4-gh2g](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g), [GHSA-6pq8-jhm2-2vcw](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw) |
| zod | high | True | `<4.6.6` | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) |

### frontend

| Package | Severity | Direct | Affected range | Advisory sources |
| --- | --- | --- | --- | --- |
| zod | high | True | `<4.6.6` | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) |

### company-cloud

No affected production package entries reported by this registry scan. This is not whole-product security certification.

### mobile

| Package | Severity | Direct | Affected range | Advisory sources |
| --- | --- | --- | --- | --- |
| @expo/cli | high | False | `>=0.19.0-canary-20240625-2333e70` | Transitive; see full evidence |
| @expo/config | low | False | `>=9.1.0-canary-20240628-1ba8152` | Transitive; see full evidence |
| @expo/local-build-cache-provider | low | False | `*` | Transitive; see full evidence |
| @expo/metro-config | low | False | `>=0.19.0-canary-20240625-2333e70` | Transitive; see full evidence |
| @expo/prebuild-config | low | False | `>=7.1.0-canary-20240904-69100c1` | Transitive; see full evidence |
| deepmerge | low | False | `>=4.2.0` | [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) |
| expo | high | True | `>=52.0.0-canary-20240625-2333e70` | Transitive; see full evidence |
| node-forge | high | False | `<=1.4.0` | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) |
| zod | high | False | `<4.6.6` | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) |

### company-mobile

| Package | Severity | Direct | Affected range | Advisory sources |
| --- | --- | --- | --- | --- |
| @expo/cli | high | False | `>=0.19.0-canary-20240625-2333e70` | Transitive; see full evidence |
| @expo/config | low | False | `>=9.1.0-canary-20240628-1ba8152` | Transitive; see full evidence |
| @expo/local-build-cache-provider | low | False | `*` | Transitive; see full evidence |
| @expo/metro-config | low | False | `>=0.19.0-canary-20240625-2333e70` | Transitive; see full evidence |
| @expo/prebuild-config | low | False | `>=7.1.0-canary-20240904-69100c1` | Transitive; see full evidence |
| deepmerge | low | False | `>=4.2.0` | [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) |
| expo | high | True | `>=52.0.0-canary-20240625-2333e70` | Transitive; see full evidence |
| node-forge | high | False | `<=1.4.0` | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) |
| zod | high | False | `<4.6.6` | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) |

Full all/production ranges, effects, fix suggestions and advisory metadata are retained in [dependencies.json](evidence/dependencies.json). Registry data can change after the audit; repeat at release.

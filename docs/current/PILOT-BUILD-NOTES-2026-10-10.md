# Pilot build notes — 10 October 2026

Product: BIO-EMS `0.20.0`. Integration: PR #288, merged source
`98cea574baaecb5b648aa92133982c412856c681`. These are post-release Pilot notes;
the historical v0.20.0 release remains unchanged. Current acceptance status is
controlled by [PROJECT_STATE.md](../../PROJECT_STATE.md).

## Components and compatibility

| Component | Effect of PR #288 |
| --- | --- |
| Client Setup | ADMIN signed file updates, new commissioning network choice, Repair compatibility and diagnostics |
| ESP32-S3 | `0.1.0-pilot.5`, Wi-Fi or W5500 DHCP; protocol `1.3`, binding schema `1` |
| SIM-D4 Nano | `0.1.0-bench.2`; unchanged behavior |
| Manufacturer Tools | Unchanged behavior; successful main build |

Updating the Windows platform does not automatically flash existing controllers.
Existing bound-device recovery preserves network configuration. Physical W5500,
RS485 coexistence, power/endurance and live cellular failover remain unqualified.

## Main verification

| Workflow | Run | Result |
| --- | --- | --- |
| CI | [38078138741](https://github.com/elsheikh78/Bio-EMS/actions/runs/38078138741) | Success |
| ESP32-S3 Firmware | [38078138665](https://github.com/elsheikh78/Bio-EMS/actions/runs/38078138665) | Success |
| Windows Manufacturer Tools | [38078138567](https://github.com/elsheikh78/Bio-EMS/actions/runs/38078138567) | Success |
| Internal Windows Setup | [38078138666](https://github.com/elsheikh78/Bio-EMS/actions/runs/38078138666) | Success |

Windows job `114289869713` passed PowerShell parsing, Base64/legacy-hex token
regression, install/health, update-jobs ACL migration, Influx backup/history restore,
real API upload and independent update worker/Repair, unchanged installation identity
and Provisioner secret, tampered-package rejection, and controlled New Install over
an existing installation. This is runner evidence, not a customer-PC acceptance record.

## Artifact provenance

Artifacts below are from the Internal Windows Setup run, using the same merged SHA.
GitHub Actions artifacts have limited retention; expiry does not change their provenance.

| Artifact | ID | ZIP SHA-256 |
| --- | --- | --- |
| BIO-EMS Client Setup, Pilot signed | `11678574314` | `1fa70806ec81ceb63563bb67b076c61adea3ae6e851e1495e5806325ddae25f7` |
| ESP32-S3 Pilot package | `11679508682` | `851d8b6af2794420b3ca2ee5928ad73a330d474a02c0fb562fb15db423f67464` |
| SIM-D4 bench package | `11679523408` | `52aa3ae22dc5d96054d040e9cecfa81b67192139b646c51dc472a625f36b2085` |

Distributed signed `BIO-EMS-Setup-0.20.0-x64.exe` SHA-256:
`3262237483042a9778b14ddd6330fa0cf230d22a493994d527c5a2a437f434d5`.
This matches the bundle's `SHA256SUMS.txt`. The existing `build-evidence.json`
setupSha256 records the executable before signing and therefore differs.

## Arabic installation/update instructions

1. فك ضغط حزمة العميل من المصدر المعتمد للشركة.
2. شغّل `Install-BIOEMS-Pilot.cmd` بصلاحيات مسؤول Windows؛ يجهز شهادة توقيع
   Pilot العامة ثم يشغّل التثبيت. لا توجد مفاتيح توقيع خاصة في حزمة العميل.
3. على جهاز مثبت عليه النظام اختر **Reinstall / Repair**، وعلى الجهاز الجديد
   استخدم **New Install**. تحقق من الصحة والخدمات والبيانات بعد الانتهاء.
4. لتحديث لاحق عبر البلاتفورم، ادخل بحساب ADMIN إلى `/system-update` وارفع
   ملف Client Setup EXE المستخرج، وراجع الإصدار والبصمة ثم اضغط التثبيت.
   ملف ZIP أو Setup المصنع أو Firmware ليس مدخلاً صالحاً لهذه الصفحة.
5. الشهادة تختلف بين بناءات Pilot؛ يجب لمسؤول Windows تثبيت شهادة البناء
   المعتمدة من الشركة مسبقاً. صفحة التحديث لا تثق تلقائياً بشهادة الملف المرفوع.
6. اختر نافذة صيانة؛ المراقبة والإشعارات على الكمبيوتر تتوقف أثناء التحديث.
   انتظر إعادة الاتصال ثم تحقق من النتيجة النهائية وصحة النظام.
7. تحديث الإنترنت معطل افتراضياً. تفعيله لاحقاً يحتاج خادم HTTPS للشركة
   وإعداداً محمياً صريحاً وهوية توقيع ثابتة للإنتاج.

See [network and update operations](PILOT-NETWORK-AND-CLIENT-UPDATES.md) for
configuration, safeguards and bench boundaries. No new version/tag or Production
signing, hardware qualification, commissioning or customer UAT is claimed.

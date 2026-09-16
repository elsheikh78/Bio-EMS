# BIO-EMS — المطلوب من مالك المنصة في المرحلة التالية

**التاريخ:** 16 سبتمبر 2026  
**الغرض:** تعليمات تشغيلية عربية للخطوات التي تتطلب تدخل مالك BIO-EMS شخصيًا.  
**مهم:** لا تضع أي مفتاح خاص أو كلمة مرور أو Token أو MFA secret في GitHub أو المحادثات أو ملفات المشروع.

## 1. الوضع الذي تبدأ منه

لا تبدأ COM-01 من جديد. الحالة الحالية هي:

- Customer ADMIN provisioning مدمج في main عبر PR #231، وتم اختبار تسجيل الدخول فعليًا بعد Clean Pilot Setup.
- SEC-OWNER-01 منفذ برمجيًا على PR #233، لكنه غير معتمد Production وغير مدمج حتى إتمام مراسم المفتاح الحقيقي والـoffline commissioning.
- COM-01 إلى COM-06 منفذة على PR #235، واختبارات CI وInternal Windows Setup نجحت.
- COM-07 ما زالت تحتاج اختبارات حية لمزودي الاتصال والهاردوير.
- إصدار المنتج يظل 0.20.0.
- BIO EGYPT ما زال NOT COMMISSIONED / NOT ACCEPTED.

## 2. أول شيء مطلوب منك — مراسم مفتاح System Owner الحقيقي

نفذ هذه الخطوة على جهاز موثوق ومفصول عن GitHub/CI وعن جهاز العميل.

1. افتح الدليل:
   `docs/security/SYSTEM-OWNER-MANUFACTURER-KEY-GUIDE-AR.md`.
2. أنشئ زوج Ed25519 الحقيقي طبقًا للدليل.
3. احتفظ بالـprivate key خارج الريبو وخارج Setup وخارج أجهزة العملاء.
4. جهز نسخة Backup مشفرة/محمية في وسيط منفصل وآمن.
5. سجل فقط Key ID / fingerprint والمفتاح العام حسب الدليل.
6. لا ترسل الـprivate key لي ولا تضع محتواه في Screenshot أو Chat أو Issue.

**نتيجة هذه المرحلة:** لديك private key محفوظ Offline، ومادة public key/keyring مسموح إدخالها إلى Production build طبقًا للدليل.

## 3. اختبار SEC-OWNER end-to-end

بعد تجهيز المفتاح:

1. ابنِ/استخدم Setup بالقناة المخصصة التي تحتوي الـProduction public keyring فقط.
2. على جهاز الاختبار أنشئ commissioning request الخاص بالinstallation.
3. انقل الطلب إلى جهاز التوقيع Offline.
4. وقّع commissioning package بالـprivate key الحقيقي.
5. أعد الحزمة الموقعة فقط إلى جهاز BIO-EMS.
6. استورد الحزمة.
7. أكمل إنشاء singleton SYSTEM_OWNER.
8. أكمل TOTP/MFA enrollment.
9. اختبر login/logout/session expiry/revocation.
10. اختبر حالات الرفض: replay، expired package، tampered package، wrong installation، unknown/revoked key.
11. لا تعتبر SEC-OWNER Production accepted قبل تسجيل نجاح هذه الأدلة.

## 4. COM-07 — الاختبارات الحية المطلوبة

بعد استقرار مسار SEC-OWNER:

- Email: إرسال رسالة اختبار حقيقية واستلامها.
- Telegram: إرسال Alert/Test حقيقي إلى Chat ID المعتمد.
- WhatsApp: الاختبار فقط عند اكتمال Meta onboarding ووجود credentials/template صالحين.
- SMS/GSM: اختبار النقل المختار فعليًا؛ وإذا كان Local Modem مستخدمًا فسجل المودم/COM/SIM ونجاح الرسالة.
- اختبر تغيير إعدادات القناة من واجهة ADMIN/SYSTEM_OWNER بدون PowerShell أو إعادة تثبيت.
- اختبر إخفاء secrets وعدم ظهورها في logs/audit/UI responses.
- اختبر failover بالترتيب المعتمد.

لا تضع credentials أو tokens الفعلية في أدلة GitHub.

## 5. استكمال اختبار Windows Installer

المتبقي بعد نجاح Clean Install الحالي:

1. Reboot والتأكد أن الخدمات الثلاثة تعود تلقائيًا.
2. Repair بدون فقد البيانات.
3. Upgrade من نسخة مدعومة مع Backup/Migrations.
4. Failure + Rollback.
5. Uninstall والتأكد أن retained customer data لا تُحذف بصمت.
6. إعادة الاختبار على كمبيوتر Windows نظيف ثانٍ.
7. حفظ أرقام builds وSHA-256 والنتائج بدون أسرار.

## 6. بعد ذلك — Hardware Bench

- تثبيت BOM النهائي للـPilot.
- اختبار ESP32/Site Controller والحساسات.
- اختبار MQTT والـoffline behavior.
- اختبار انقطاع/عودة الشبكة والطاقة.
- اختبار SMS fallback المطلوب.
- Calibration/evidence.
- Endurance/72-hour gate عندما يكون مطلوبًا.

## 7. آخر مرحلة — BIO EGYPT

لا تنتقل إلى Accepted قبل:

- Physical installation.
- Site/Area/Sensor mapping.
- Calibration.
- Alarm challenge.
- Notification/escalation verification.
- Power/network/reboot tests.
- Technical commissioning.
- Customer ADMIN UAT.
- Defect closure.
- Acceptance evidence.

## 8. ما الذي لا تفعله الآن

- لا تعيد تنفيذ COM-01..COM-06.
- لا تنشئ SYSTEM_OWNER من Customer Setup أو Customer ADMIN.
- لا تضع manufacturer private key في GitHub/CI/Setup/customer PC.
- لا ترفع version من 0.20.0 لمجرد تحديث التوثيق.
- لا تصف Pilot build بأنه Production-secure.
- لا تعتبر BIO EGYPT commissioned أو accepted قبل الأدلة الميدانية.

## 9. نقطة الانطلاق عند العودة للعمل

ابدأ بقراءة:

1. `PROJECT_STATE.md`
2. `IMPLEMENTATION_PLAN.md`
3. `docs/project-management/COMPLETE-AUDIT-MASTER-EXECUTION-PLAN-2026-09-11.md` — قسم 16 سبتمبر
4. `docs/security/SEC-OWNER-01-STATUS-AND-MERGE-CHECKLIST-AR.md`
5. `docs/security/SYSTEM-OWNER-MANUFACTURER-KEY-GUIDE-AR.md`
6. هذا الملف.

ثم ابدأ **بمراسم المفتاح الحقيقي SEC-OWNER**، وليس بكتابة Feature جديدة.

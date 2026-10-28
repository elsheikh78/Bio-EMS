# دليل إنشاء وحفظ مفتاح الشركة الخاص بـ SYSTEM_OWNER

الحالة: إجراء إلزامي قبل اعتماد ودمج `SEC-OWNER-01` للإنتاج  
الجمهور: مسؤولو أمن وإصدارات BIO-EMS فقط

## 1. الغرض وحدود الأمان

هذا المفتاح هو مفتاح الشركة المصنّعة الذي يوقّع حزم إنشاء `SYSTEM_OWNER`. وهو مستقل
تمامًا عن شهادة توقيع ملف Setup، ومفتاح الترخيص، وشهادة HTTPS، ومفاتيح أجهزة القياس.

- المفتاح الخاص لا يدخل GitHub أو CI أو ملف Setup أو جهاز العميل أو جهاز الدعم.
- لا يُرسل المفتاح الخاص عبر البريد أو المحادثات أو التذاكر.
- الذي يغادر جهاز التوقيع Offline هو المفتاح العام وملف الـKeyring والحزمة الموقعة فقط.
- يجب إنشاء المفتاح على جهاز مشفر تملكه الشركة ومفصول عن الإنترنت، أو داخل HSM مناسب.
- يجب الاحتفاظ بالمفتاح الخاص مشفرًا، مع نسختين احتياطيتين مشفرتين في موقعين منفصلين.

## 2. المتطلبات

1. جهاز Windows تابع للشركة ومفصول عن الإنترنت.
2. BitLocker مفعّل على القرص، ويفضل USB مشفر منفصل لحفظ المفتاح.
3. OpenSSL متاح على الجهاز. يمكن استخدام النسخة الموجودة مع Git for Windows.
4. وجود مسؤولين اثنين أثناء الإنشاء والتسجيل والنسخ الاحتياطي.

افتح PowerShell وتحقق من OpenSSL:

```powershell
openssl version
```

إذا لم يكن الأمر موجودًا:

```powershell
$OpenSsl = "C:\Program Files\Git\usr\bin\openssl.exe"
& $OpenSsl version
```

وإذا كان `openssl` يعمل مباشرة:

```powershell
$OpenSsl = (Get-Command openssl).Source
```

## 3. تحديد Key ID ومكان الحفظ

لا يجوز تغيير أو إعادة استخدام `Key ID` بعد اعتماده. المثال الأول:

```powershell
$KeyId  = "owner-primary-2026"
$KeyDir = "D:\BIOEMS-Owner-Key"

New-Item -ItemType Directory -Path $KeyDir -Force
Set-Location $KeyDir
```

استبدل `D:` بحرف القرص المشفر الفعلي.

## 4. إنشاء المفتاح الخاص Ed25519 مشفرًا

```powershell
& $OpenSsl genpkey `
  -algorithm ED25519 `
  -aes-256-cbc `
  -out "$KeyId.private.encrypted.pem"
```

سيطلب OpenSSL عبارة مرور مرتين. استخدم عبارة طويلة وفريدة، ولا تضعها في الأمر أو ملف
نصي أو مدير كلمات مرور سحابي. يجب حفظها وفق سياسة الشركة وبفصل مناسب عن وسيط المفتاح.

الملف الناتج سري للغاية:

```text
owner-primary-2026.private.encrypted.pem
```

## 5. استخراج المفتاح العام

```powershell
& $OpenSsl pkey `
  -in "$KeyId.private.encrypted.pem" `
  -pubout `
  -out "$KeyId.public.pem"
```

سيطلب OpenSSL عبارة مرور المفتاح الخاص. الملف التالي عام وآمن للنقل عبر القناة المعتمدة:

```text
owner-primary-2026.public.pem
```

## 6. التحقق من النوع وتسجيل البصمة

تحقق أن المفتاح `ED25519`:

```powershell
& $OpenSsl pkey `
  -pubin `
  -in "$KeyId.public.pem" `
  -text `
  -noout
```

احسب بصمة SHA-256 للمفتاح العام:

```powershell
& $OpenSsl pkey `
  -pubin `
  -in "$KeyId.public.pem" `
  -outform DER |
& $OpenSsl dgst -sha256
```

سجّل خارج GitHub: `Key ID`، والبصمة، وتاريخ الإنشاء، وأسماء المسؤولين، وموقعي النسختين
الاحتياطيتين، وتاريخ آخر اختبار استعادة.

## 7. إنشاء Production Trust Keyring

```powershell
$PublicKey = (Get-Content "$KeyId.public.pem" -Raw).Replace("`r`n", "`n")

$Keyring = [ordered]@{
    schemaVersion = 1
    keys = @(
        [ordered]@{
            keyId       = $KeyId
            publicKeyPem = $PublicKey
            status      = "active"
        }
    )
}

$Json = $Keyring | ConvertTo-Json -Depth 5
$Utf8 = New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText(
    "$KeyDir\manufacturer-owner-trust.json",
    $Json,
    $Utf8
)
```

## 8. الملفات التي يجوز نقلها

يجوز نقل الملفين التاليين فقط إلى بيئة البناء المعتمدة:

```text
owner-primary-2026.public.pem
manufacturer-owner-trust.json
```

لا يجوز مطلقًا نقل:

```text
owner-primary-2026.private.encrypted.pem
```

## 9. النسخ الاحتياطي والاختبار

1. أنشئ نسختين مشفرتين من ملف المفتاح الخاص في موقعين منفصلين تحت سيطرة الشركة.
2. تحقق من SHA-256 لكل نسخة وقارنه بالأصل دون نشر البصمة الخاصة في GitHub.
3. نفّذ اختبار استعادة على جهاز Offline معزول مرتين سنويًا على الأقل.
4. استخرج المفتاح العام من النسخة المستعادة وقارن بصمته بالبصمة المسجلة.
5. دمّر أي نسخة عمل غير مطلوبة وفق الإجراء المعتمد.

## 10. الاستخدام التشغيلي

عند إنشاء `SYSTEM_OWNER` لعميل:

1. جهاز العميل يصدر طلب Commissioning لا يحتوي أسرار الشركة.
2. يُنقل الطلب إلى جهاز التوقيع Offline بعد التحقق من العميل والموقع وInstallation ID.
3. أداة الشركة تقرأ المفتاح الخاص المشفر وتوقّع حزمة قصيرة العمر.
4. الحزمة الموقعة وحدها تعود إلى جهاز العميل.
5. جهاز العميل يتحقق من التوقيع والمفتاح العام المدمج، ثم يرفض العبث أو الانتهاء أو
   إعادة الاستخدام أو اختلاف التثبيت.

عند الاشتباه في تسريب المفتاح، أوقف Commissioning فورًا واتبع إجراءات التدوير والإلغاء
في `SYSTEM-OWNER-COMMISSIONING-OPERATIONS.md`.

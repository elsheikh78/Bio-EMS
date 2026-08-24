# BIO-EMS — الشرح التفصيلي للمشروع

> **نوع الوثيقة:** Living Project Document — وثيقة حية يتم تحديثها مع كل إنجاز معماري أو وظيفي مهم.
>
> **قاعدة التحديث:** عند إغلاق Sprint أو دمج Feature مؤثر أو تغيير Architecture/Domain/Release boundary، يجب تحديث هذه الوثيقة بما يعكس الحالة المنفذة فعليًا في الـRepository، مع الفصل بوضوح بين **Implemented** و **In Progress** و **Planned/Deferred**.

## 1. ما هو BIO-EMS؟

BIO-EMS هو **Enterprise Environmental Monitoring System**: منصة احترافية لمراقبة الظروف البيئية والتشغيلية في المواقع المنظمة والصناعية. الهدف ليس بناء برنامج لدرجة الحرارة فقط، بل Core Platform قابلة للتوسع لتخدم شركات الأدوية، المخازن، المستشفيات، المعامل، الغرف النظيفة، سلاسل التبريد، المصانع، ثم قطاعات أخرى مثل Oil & Gas.

## 2. المشكلة التي يحلها النظام

النظام لا يكتفي باستقبال قراءة مثل `Temperature = 4.6°C`. يجب أن يعرف مصدر القراءة، الموقع والمنطقة والحساس، حدود التشغيل والإنذار، حالة القراءة، المستخدم الذي يتعامل مع الإنذار، وصلاحياته، مع الاحتفاظ بالبيانات التشغيلية والتاريخية اللازمة.

الفرق الأساسي هو أن BIO-EMS ليس Data Logger بسيطًا، بل Monitoring Platform لها Domain Model وSecurity وAlarm Engine وDevice Lifecycle وواجهات تشغيلية.

## 3. الصورة العامة للمنصة

```text
Sensors / Devices
        |
        | MQTT
        v
BIO-EMS Backend
        |
        +--> Domain / Alarm Engine
        +--> SQLite Configuration & Operational Data
        +--> InfluxDB Time-Series Telemetry
        |
        v
REST API
        |
        v
React Frontend
        |
        v
Users
```

## 4. Device وSensor

**Device** هو الجهاز الإلكتروني أو الـGateway الذي يتصل بالمنصة، بينما **Sensor** هو نقطة القياس الفيزيائية المتصلة بالجهاز.

مثال: جهاز واحد قد يتصل بحساسَي Temperature وحساس Humidity وDoor Contact. الفصل بين Device وSensor يسمح بإدارة دورة حياة الأجهزة دون خلطها مع نقاط القياس.

## 5. الهيكل المكاني الحالي

الهيكل المنفذ حاليًا هو:

```text
Site -> Monitored Area (Room) -> Sensor
```

في الـBackend ما زال الـDomain يسمى `Room`، بينما تستخدم الواجهة مصطلح **Monitored Area** لأنه أوسع وأكثر ملاءمة لتوسع المنصة مستقبلًا.

لا توجد حاليًا طبقة Backend منفذة باسم Monitoring Point؛ وهي ما زالت Future Architecture منفصلة.

## 6. Telemetries والقطاعات

المنصة لا تُبنى حول نوع Sensor واحد. يمكن أن تشمل Telemetries مثل:

- Temperature
- Relative Humidity
- Differential Pressure
- Particle Count
- CO2
- Air Velocity
- Door Status
- Power Status
- Pressure
- Flow
- Tank Level
- Vibration
- LEL / CH4 / H2S

والتوجه المنتجّي هو التقسيم حسب **Industry Vertical** مثل Pharmaceutical & Life Sciences، Healthcare، Cold Chain، Food، Manufacturing، وOil & Gas، مع مشاركة نفس Core Platform.

## 7. مسار القراءة داخل النظام

```text
Sensor -> Device -> MQTT -> Backend -> Domain Alarm Evaluation -> Storage -> API -> Dashboard
```

القراءة لا تُخزن كرقم فقط؛ تمر عبر قواعد الـDomain لتحديد حالتها التشغيلية.

## 8. Alarm Engine

Alarm Domain Engine منفذ حاليًا ويعتمد ست حالات:

1. Critical Low
2. Warning Low
3. Normal
4. Warning High
5. Critical High
6. Unknown

قواعد الإنذار مملوكة للـDomain Layer وليست للـFrontend، وبالتالي الواجهة تعرض النتيجة ولا تعيد تنفيذ منطق القرار.

## 9. SQLite وInfluxDB

يستخدم BIO-EMS قاعدتين لأغراض مختلفة:

- **SQLite:** Configuration والبيانات التشغيلية مثل Sites وRooms وSensors وDevices وUsers وإعدادات الإنذار والـAcknowledgments.
- **InfluxDB:** بيانات Telemetry الزمنية Time-Series Data.

هذا الفصل يمنع خلط البيانات العلائقية مع تدفقات القياسات الزمنية الكبيرة.

## 10. MQTT

MQTT هو Transport أساسي لاتصال أجهزة IoT بالمنصة. تقوم الأجهزة بنشر Telemetry، ويقوم النظام باستهلاكها ومعالجتها بدل الاعتماد على Polling مستمر لكل جهاز.

## 11. Device Lifecycle

دورة حياة الأجهزة منفذة وتشمل حاليًا عمليات مثل Create وList وRead وMetadata Update وActivate وDisable.

أما QR provisioning وActivation Codes وHardware identity وعمليات Provisioning الأوسع فما زالت Planned/Deferred.

## 12. Authentication وRBAC

النظام يحتوي على Authentication حقيقي وSession lifecycle في المتصفح، مع Login وLogout وSession restoration وProtected Requests.

كما يوجد Role-Based Access Control. الـFrontend قد يخفي Route أو Action غير مسموح به، لكن الـBackend يظل هو السلطة النهائية في Authorization.

## 13. User Management

يوجد ADMIN User Management منفذ، مع حماية **Last Active ADMIN** لمنع تعطيل آخر Administrator فعال وإغلاق باب الإدارة على النظام.

## 14. Alarm Acknowledgement

يمكن للمستخدم المخول تنفيذ Acknowledge للإنذار، ويتم حفظ Audit Persistence يحدد من قام بالـAcknowledgement ومتى وعلى أي Alarm.

## 15. Backend Technology

الـBackend يعتمد حاليًا على:

- Node.js 22+
- TypeScript
- Express
- REST API
- SQLite
- InfluxDB
- MQTT

والـAPI prefix المعتاد هو `/api/v1`، مع مناطق API للـSites وRooms وSensors وDevices وAlarms وDashboard وAuthentication وUsers.

## 16. Frontend Technology

الـFrontend يعتمد على:

- React
- TypeScript
- Vite
- Material UI
- TanStack Query
- Zod
- React Router
- Typed localization architecture

وقد تم تنفيذ AppShell احترافي Responsive، Authentication، Authorization-aware routing، وOperational Dashboard.

## 17. Operational Dashboard

الـDashboard الحالي يستهلك Backend APIs للـSummary وLatest Telemetry وRoom/Monitored Area Status وAlarm Statistics، مع حالات Loading وEmpty وError وSuccess وExplicit Refresh.

## 18. Monitored Areas

الواجهة التشغيلية الحالية تعرض:

```text
Site
  -> Monitored Area
      -> Sensor Inventory
```

مع ربط Rooms بالـSites عن طريق `site_id` وربط Sensors بالـRooms عن طريق `room_id`.

## 19. حالة Sprint 14 الحالية

- **S14-01 Frontend Foundation:** COMPLETE / MERGED.
- **S14-02 AppShell & Navigation:** COMPLETE / MERGED / VERIFIED.
- **S14-03 Authentication / Session / Routing:** COMPLETE / MERGED / VERIFIED.
- **S14-04 Operational Dashboard:** COMPLETE / MERGED / VERIFIED.
- **S14-05 Monitored Areas:** COMPLETE / MERGED / VERIFIED.
  - S14-05A Contracts/Data Access: COMPLETE.
  - S14-05B Site/Monitored Area Hierarchy: COMPLETE.
  - S14-05C Sensor Inventory/Threshold Metadata: COMPLETE.
  - S14-05D Refresh/Retry/Integration/Hardening: COMPLETE.

Sprint 14 بالكامل **COMPLETE / MERGED / VERIFIED / CLOSED**. كما أن Sprint 15 الخاص
بأساس جاهزية الـPilot مكتمل ومغلق، مع بقاء التنفيذ والقبول الميدانيين مفتوحين.

> يجب تحديث هذا القسم مباشرة بعد تغير حالة أي Slice أو Sprint.

## 20. Sensor Configuration Metadata

الواجهة تعرض بيانات مثل Sensor Type وUnit وChannel وEnabled state، إضافة إلى Threshold metadata المتاحة مثل:

- `min_value`
- `warning_low`
- `alarm_low`
- `warning_high`
- `alarm_high`
- `max_value`

ويجب الفصل بوضوح بين **Configuration** وبين **Live Telemetry / Online Health / Alarm State**.

في BF-04 أصبحت القيم الأربع `warning_low` و`alarm_low` و`warning_high` و`alarm_high`
قابلة للتعديل أو المسح بعد إنشاء Sensor من خلال Backend API مصرح به. يتم دمج التعديل
الجزئي مع القيم الحالية والتحقق من الترتيب والمدى، ثم حفظ التغيير وAudit prior/new في
Transaction واحدة مرتبطة بالـSite. هذا لا يعني وجود Threshold history effective-dated
لإعادة بناء التقارير القديمة.

في BF-05 أصبح لكل Sensor إعدادان مستقلان `warning_delay_seconds` و
`critical_delay_seconds` من صفر إلى 86400 ثانية. الصفر يحافظ على التشغيل الفوري، أما
القيمة الموجبة فتحفظ Pending candidate في SQLite حتى قراءة LIVE لاحقة تحقق المدة. الرجوع
للطبيعي أو تغيير الاتجاه أو Severity يبدأ التقييم من جديد، وREPLAY لا يغير هذه الحالة.
تعديل التأخير يمسح الـcandidate القديم داخل نفس Transaction مع Audit event. قيم BIO
EGYPT الفعلية ما زالت مرتبطة باعتماد BE-006 وليست ثوابت داخل المنتج.

## 21. Monitoring Point — Future Architecture

التصور المستقبلي الأقوى هو:

```text
Site -> Area -> Asset -> Monitoring Point -> Sensor
```

Monitoring Point يمثل **ما الذي يتم قياسه**، بينما Sensor يمثل الجهاز الفيزيائي المستخدم للقياس. هذا الفصل مهم جدًا للمعايرة واستبدال الحساسات والحفاظ على التاريخ المستمر لنقطة القياس.

هذه الطبقة غير منفذة حاليًا ويجب ألا تُعرض كCapability موجودة.

## 22. Notification Engine — Planned

سيكون مسؤولًا مستقبلًا عن تحويل Alarm إلى Notification workflow مثل Email أوSMS أوWhatsApp أوPush، مع Escalation rules حسب الزمن وعدم الـAcknowledgement.

تم في BF-06 تنفيذ أساس Backend مستقل لدليل المستلمين حسب الـSite. يدعم ملفات مستلمين
نشطة أو غير نشطة، ونقاط اتصال Email وSMS وWhatsApp، وتحديد أهلية WARNING وCRITICAL لكل
قناة. القراءة والتعديل محميان بصلاحيات ADMIN مخصصة، ولا تدخل عناوين الاتصال في Audit
prior/new أو Logs أو URLs أو deduplication keys. هذا الأساس لا يرسل رسائل ولا يستهلك
الـOutbox ولا يحدد Provider أو Escalation، ولا يحتوي على بيانات اتصال BIO EGYPT.

وفي BF-07 تم تنفيذ سياسة Escalation قابلة للتهيئة حسب الـSite: Owner role، أهلية
WARNING/CRITICAL، وحالة active/inactive، وخطوات متتابعة بزمن متزايد وRecipient role
وقنوات محددة. الـresolver يعيد الخطوات المستحقة فقط ولا يرسل رسالة ولا يعتبر أي خطوة
Delivered أو Acknowledged، ولا يثبت توقيتًا خاصًا بعميل داخل الكود.

BF-08 يعرّف Contract إصدار 1 لمزامنة الحد الأدنى من إعدادات التشغيل Critical offline
مع Site Controller. الـBundle يحمل Version وSHA-256 checksum، ولا يصبح Effective إلا
بعد APPLIED acknowledgement مطابق للـSite والـVersion والـchecksum. عند Reconnect يتم
تحديد CURRENT أو Redelivery أو Block، وعند الفشل يبقى آخر Bundle معتمد فقط؛ وإذا لم
يوجد تُعطّل Offline external notification ويظهر Not-ready. هذا لا يعني أن Firmware أو
Transport أو التشغيل الميداني تم تنفيذه.

أغلق BF-09 واجهة Commercial Configuration للـADMIN. تشمل الواجهة تعديل Thresholds
وAlarm delays، وإدارة Notification recipients وسياسات Escalation، وإدارة المستخدمين
وعرض Audit Log المقيد بالـSite. اختيار الـSite صريح قبل تحميل بيانات المستلمين أو
السياسات أو الـAudit، والـBackend يظل السلطة النهائية في Authorization والتحقق والحفظ.
هذا الإغلاق لا يعني وجود Provider للإرسال أو Controller runtime أو تشغيل ميداني أو
Customer acceptance؛ هذه أدلة وقدرات مستقلة.

## 23. Reports وAudit Trail

من الأهداف المستقبلية:

- Temperature/Telemetry Reports
- Alarm Reports
- Deviation Reports
- Calibration Reports
- Sensor Status Reports
- تم تنفيذ أساس Audit Trail مركزي append-only في BF-02، ويشمل Actor وAction وTarget
  وSite والنتيجة والقيم القديمة والجديدة وسياق الطلب والسبب، مع Redaction قبل الحفظ.
- قراءة العميل مقيدة بدور ADMIN وSite محدد، بينما القراءة عبر المنصة تستخدم
  SYSTEM_OWNER authentication boundary المنفصل.
- ربط كل عمليات Configuration الحالية كمنتجين للأحداث يتم تدريجيًا في Work Packages
  مستقلة؛ وجود الأساس لا يعني أن كل Mutation مغطاة بالفعل.
- تم ربط User Management في BF-03: إنشاء المستخدم وتغيير Profile/Role وStatus وإدارة
  كلمة المرور تنتج Audit evidence. نجاح التغيير وحفظ الحدث يتمان في Transaction واحدة.
- أحداث كلمة المرور لا تحتوي على Password أوHash أو قيم قديمة/جديدة للCredential، كما
  لا يتم نسخ body الخاص بطلبات Validation المرفوضة إلى Audit Trail.

## 24. Customer Management وLicensing — Planned

التصور التجاري يفصل بين Customer Installation وبين BIO-EMS Management Platform الخاصة بنا لمتابعة العملاء، Sites، Licenses، Versions، Devices، Maintenance، Calibration، Warranty، Updates وSubscriptions.

## 25. OTA وProduction Operations — Planned

من الأعمال المؤجلة: OTA Firmware Updates، Deployment، Backup/Restore، Production Operations، Installation Packaging، والهاردوير النهائي للمنتج.

## 26. Architecture المختصرة

```text
                    BIO-EMS

Sensors / Devices
       |
       | MQTT
       v
+---------------------+
| MQTT / Ingestion    |
+----------+----------+
           |
           v
+---------------------+
| Application Services|
+----------+----------+
           |
           v
+---------------------+
| Domain / Alarm      |
| Engine              |
+------+---------+----+
       |         |
       v         v
    SQLite    InfluxDB
       |         |
       +----+----+
            |
            v
         REST API
            |
            v
      React Frontend
            |
            v
          Users
```

## 27. لماذا المنصة قابلة للتوسع؟

لأن BIO-EMS لا يُبنى كتطبيق `ColdRoomTemperatureApp`، بل كـEnvironmental Monitoring Platform. لذلك يمكن استخدام نفس الـCore في حلول Pharmaceutical وCold Chain وFood وIndustrial وOil & Gas مع اختلاف الـDomain configuration والـTelemetries والModules.

## 28. الحالة الحالية للمنتج

الحالة الحالية تشمل Backend API وDomain Layer وSQLite وInfluxDB وMQTT وDevice Lifecycle وAuthentication/RBAC وADMIN User Management مع Audit integration وSYSTEM_OWNER boundary وAlarm Acknowledgement وAudit persistence foundation وFrontend Foundation وProfessional AppShell وOperational Dashboard وMonitored Areas، بالإضافة إلى Sensor calibration history وDevice health وNotification events وSMS failover contract وأساس جاهزية النشر والاستعادة.

الـPublished Release الموثق حاليًا هو `v0.15.0`، ويشمل أعمال Sprint 14 وSprint 15 المعتمدة داخل المستودع، لكنه لا يعني تنفيذ أو قبول الـPilot ميدانيًا.

## 29. ما المتبقي للوصول إلى Commercial Production-Ready EMS؟

من أهم المسارات المتبقية: التنفيذ والتوثيق الميداني لـBIO EGYPT، استكمال الواجهات التشغيلية، Monitoring Point architecture، Channel provider implementations، Reports، ربط Audit Trail بباقي عمليات التغيير، Advanced Device Provisioning، Customer/Licensing Management، OTA، وعمليات الإنتاج التجارية الأوسع.

## 30. الصورة النهائية المستهدفة

```text
BIO-EMS Core Platform
|
+-- Monitoring
+-- Alarms
+-- Notifications
+-- Reports
+-- Audit Trail
+-- Calibration
+-- Device Management
+-- User & Access Management
+-- Customer / Licensing
+-- System Administration

Industry Solutions
|
+-- Pharmaceutical
+-- Healthcare
+-- Cold Chain
+-- Food
+-- Manufacturing
+-- Oil & Gas
```

## 31. سياسة تحديث هذه الوثيقة

هذه الوثيقة **ليست Snapshot ثابتة**. يجب تحديثها عند كل إنجاز يؤثر على فهم المنتج أو حالته، خصوصًا عند:

- إغلاق أو دمج Sprint/Slice.
- إضافة Capability جديدة.
- تغيير Domain terminology أو hierarchy.
- قبول ADR يغير Architecture.
- إضافة أو إزالة API/domain boundary مهمة.
- إصدار Release جديد.
- انتقال Feature من Planned إلى Implemented.

**المصدر النهائي للحقيقة هو الـRepository الفعلي: code + schema + tests + merged PRs + accepted ADRs.** لا يجوز تحديث الوثيقة اعتمادًا على Roadmap وحدها أو وصف Feature غير منفذة على أنها موجودة.

---

**Project:** BIO-EMS  
**Document:** Arabic Project Guide / Living Project Document  
**Owner:** Ahmed A. Elsheikh  
**Status:** Active — update with material project progress

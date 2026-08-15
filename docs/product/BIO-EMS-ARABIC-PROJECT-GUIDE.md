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

الواجهة التشغيلية الحالية تتجه إلى عرض:

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
- **S14-05 Monitored Areas:** IN PROGRESS.
  - S14-05A Contracts/Data Access: COMPLETE / PUSHED.
  - S14-05B Site/Monitored Area Hierarchy: COMPLETE / PUSHED.
  - S14-05C Sensor Inventory/Threshold Metadata: NEXT.
  - S14-05D Refresh/Integration/Hardening: PENDING.

> يجب تحديث هذا القسم مباشرة بعد تغير حالة أي Slice أو Sprint.

## 20. Sensor Configuration Metadata

المرحلة التالية تعرض بيانات مثل Sensor Type وUnit وChannel وEnabled state، إضافة إلى Threshold metadata المتاحة مثل:

- `min_value`
- `warning_low`
- `alarm_low`
- `warning_high`
- `alarm_high`
- `max_value`

ويجب الفصل بوضوح بين **Configuration** وبين **Live Telemetry / Online Health / Alarm State**.

## 21. Monitoring Point — Future Architecture

التصور المستقبلي الأقوى هو:

```text
Site -> Area -> Asset -> Monitoring Point -> Sensor
```

Monitoring Point يمثل **ما الذي يتم قياسه**، بينما Sensor يمثل الجهاز الفيزيائي المستخدم للقياس. هذا الفصل مهم جدًا للمعايرة واستبدال الحساسات والحفاظ على التاريخ المستمر لنقطة القياس.

هذه الطبقة غير منفذة حاليًا ويجب ألا تُعرض كCapability موجودة.

## 22. Notification Engine — Planned

سيكون مسؤولًا مستقبلًا عن تحويل Alarm إلى Notification workflow مثل Email أوSMS أوWhatsApp أوPush، مع Escalation rules حسب الزمن وعدم الـAcknowledgement.

## 23. Reports وAudit Trail — Planned

من الأهداف المستقبلية:

- Temperature/Telemetry Reports
- Alarm Reports
- Deviation Reports
- Calibration Reports
- Sensor Status Reports
- Audit Trail أوسع لتغييرات Configuration والقيم القديمة والجديدة والمستخدم والتوقيت والسبب.

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

الحالة الحالية تشمل Backend API وDomain Layer وSQLite وInfluxDB وMQTT وDevice Lifecycle وAuthentication/RBAC وADMIN User Management وAlarm Acknowledgement وFrontend Foundation وProfessional AppShell وOperational Dashboard، بينما Monitored Areas ما زالت قيد التنفيذ.

الـPublished Release الموثق حاليًا هو `v0.13.0`، بينما أعمال Sprint 14 أحدث من هذا الـRelease ولا يجب اعتبارها جزءًا من Artifact الإصدار القديم.

## 29. ما المتبقي للوصول إلى Commercial Production-Ready EMS؟

من أهم المسارات المتبقية: استكمال الواجهات التشغيلية، Monitoring Point architecture، Notification Engine، Reports، Audit Trail الأوسع، Calibration Management، Advanced Device Provisioning، Customer/Licensing Management، OTA، Backup/Restore، Deployment وProduction Operations.

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

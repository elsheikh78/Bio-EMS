import type { Language } from "./model";
export const messages = {
  TEMPERATURE: ["درجة الحرارة", "Temperature"],
  HUMIDITY: ["الرطوبة", "Humidity"],
  workspace: ["بوابة العميل", "Customer workspace"],
  hero: [
    "كل غرفة. كل قراءة. أمام عينيك.",
    "Every room. Every reading. In view.",
  ],
  intro: [
    "مراقبة مواقعك وغرفك بصلاحية مشاهدة فقط",
    "Read-only monitoring for your sites and rooms",
  ],
  username: ["اسم المستخدم", "Username"],
  password: ["كلمة المرور", "Password"],
  login: ["دخول آمن", "Sign in"],
  loginHelp: [
    "استخدم حساب المشاهد الذي أنشأته الشركة للعميل.",
    "Use the customer viewer account created by the company.",
  ],
  logout: ["تسجيل الخروج", "Sign out"],
  overview: ["المتابعة", "Monitor"],
  alarms: ["الإنذارات", "Alarms"],
  settings: ["الإعدادات", "Settings"],
  sites: ["المواقع", "Sites"],
  rooms: ["الغرف", "Rooms"],
  sensors: ["الحساسات", "Sensors"],
  all: ["كل المواقع", "All sites"],
  normal: ["طبيعي", "Normal"],
  critical: ["إنذار حرج", "Critical alarm"],
  warning: ["تحذير", "Warning"],
  offline: ["بيانات متأخرة / انقطاع", "Stale / offline"],
  readOnly: ["مشاهدة فقط", "Read only"],
  refresh: ["تحديث", "Refresh"],
  sync: ["آخر تحديث", "Last refreshed"],
  readingTime: ["وقت القراءة", "Reading time"],
  noReading: ["لا توجد قراءة", "No reading"],
  noData: [
    "في انتظار بيانات الموقع. يجب تفعيل تصدير بيانات العميل وربط الأجهزة.",
    "Waiting for site data. Enable customer export and complete device onboarding.",
  ],
  emptyRooms: ["لا توجد غرف لهذا الاختيار.", "No rooms for this selection."],
  emptyAlarms: ["لا توجد إنذارات مسجلة.", "No recorded alarms."],
  failed: [
    "تعذر الاتصال. القراءات الظاهرة قديمة وليست تأكيدًا للحالة الحالية.",
    "Connection failed. Displayed readings are stale and do not confirm the current state.",
  ],
  loginFailed: [
    "تحقق من اسم المستخدم وكلمة المرور واتصال الإنترنت.",
    "Check your username, password and internet connection.",
  ],
  expired: [
    "انتهت جلسة الدخول. سجّل الدخول مجددًا.",
    "Your session expired. Please sign in again.",
  ],
  rateLimit: [
    "محاولات كثيرة. حاول بعد قليل.",
    "Too many attempts. Try again later.",
  ],
  notifications: [
    "تنبيه الإنذارات أثناء فتح التطبيق",
    "Alarm alerts while the app is open",
  ],
  enableAlerts: ["تفعيل الصوت والإشعارات", "Enable sound & notifications"],
  disableAlerts: ["إيقاف التنبيه", "Disable alerts"],
  alertsHelp: [
    "تعمل هذه النسخة أثناء فتح التطبيق. إشعارات الخلفية لم تُفعّل بعد؛ استخدم قنوات الإنذار الأساسية للموقع.",
    "This version alerts while the app is open. Background push is not enabled yet; keep using the site’s primary alarm channels.",
  ],
  alertsDenied: [
    "لم تُمنح صلاحية الإشعارات. يمكنك تفعيلها من إعدادات الهاتف.",
    "Notification permission was not granted. Enable it in your phone settings.",
  ],
  newAlarm: [
    "إنذار مراقبة جديد — افتح التطبيق للتفاصيل",
    "New monitoring alarm — open the app for details",
  ],
  TRIGGERED: ["قائم", "Triggered"],
  ACKNOWLEDGED: ["تم الإقرار محليًا", "Acknowledged locally"],
  RECOVERED: ["تعافى", "Recovered"],
  HIGH_TEMPERATURE: ["ارتفاع الحرارة", "High temperature"],
  LOW_TEMPERATURE: ["انخفاض الحرارة", "Low temperature"],
  HIGH_HUMIDITY: ["ارتفاع الرطوبة", "High humidity"],
  LOW_HUMIDITY: ["انخفاض الرطوبة", "Low humidity"],
  DEVICE_OFFLINE: ["انقطاع الجهاز", "Device offline"],
  logoutHelp: [
    "عند انقطاع الشبكة سيُحذف الدخول من الهاتف، وتظل الجلسة على الخادم حتى انتهاء صلاحيتها.",
    "When offline, sign-out clears this phone; the server session expires automatically.",
  ],
  loading: ["جارٍ التحميل…", "Loading…"],
  noSites: [
    "لم تُربط مواقع بهذا الحساب بعد.",
    "No sites linked to this account yet.",
  ],
  localOnly: [
    "عرض المراقبة فقط؛ لا تعديل أو إقرار إنذارات من التطبيق.",
    "Monitoring only; configuration and alarm acknowledgement are unavailable.",
  ],
  language: ["اللغة", "Language"],
} as const;
export function t(language: Language, key: string) {
  const entry = messages[key as keyof typeof messages];
  return entry ? entry[language === "ar" ? 0 : 1] : key;
}

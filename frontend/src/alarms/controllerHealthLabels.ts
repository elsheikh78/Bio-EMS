export function controllerHealthLabel(code: string, ar: boolean) {
  const labels: Record<string, [string, string]> = {
    MAINS_LOST: [
      "Main supply lost — backup power in use",
      "انقطاع التغذية الرئيسية — التشغيل على المصدر الاحتياطي",
    ],
    BATTERY_LOW: ["Backup battery low", "انخفاض شحن البطارية الاحتياطية"],
    SD_UNAVAILABLE: [
      "Storage unavailable or read/write fault",
      "الذاكرة غير متاحة أو تعذرت القراءة والكتابة",
    ],
    SD_NEAR_FULL: ["Storage nearly full", "اقتراب امتلاء ذاكرة التخزين"],
  };
  return labels[code]?.[ar ? 1 : 0] ?? code;
}

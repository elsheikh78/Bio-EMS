const qa = process.env.BIOEMS_MOBILE_QA === "1";
const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
module.exports = {
  expo: {
    name: qa ? "BIO-EMS Monitor Pilot" : "BIO-EMS Monitor",
    slug: "bioems-customer-monitor",
    platforms: ["ios", "android"],
    version: "0.1.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/logo.png",
      resizeMode: "contain",
      backgroundColor: "#f0f5f8",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.bioemsegypt.monitor",
      config: { usesNonExemptEncryption: false },
    },
    android: {
      package: qa ? "com.bioemsegypt.monitor.pilot" : "com.bioemsegypt.monitor",
      permissions: ["VIBRATE", "POST_NOTIFICATIONS"],
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#ffffff",
      },
      allowBackup: false,
    },
    plugins: ["expo-secure-store", "expo-notifications"],
    extra: { ...(projectId ? { eas: { projectId } } : {}) },
  },
};

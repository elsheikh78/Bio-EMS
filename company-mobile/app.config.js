const qa = process.env.BIOEMS_MOBILE_QA === "1";
const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
module.exports = {
  expo: {
    name: qa ? "BIO-EMS Company Pilot" : "BIO-EMS Company",
    slug: "bioems-company",
    version: "0.1.0",
    platforms: ["ios", "android"],
    userInterfaceStyle: "light",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/logo.png",
      resizeMode: "contain",
      backgroundColor: "#f0f5f8",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.bioemsegypt.company",
      config: { usesNonExemptEncryption: false },
    },
    android: {
      package: qa ? "com.bioemsegypt.company.pilot" : "com.bioemsegypt.company",
      allowBackup: false,
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#ffffff",
      },
    },
    plugins: ["./withSecureTransport"],
    extra: { ...(projectId ? { eas: { projectId } } : {}) },
  },
};

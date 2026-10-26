import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Linking,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import {
  COMPANY_HOME,
  HOME_SCRIPT,
  isCompanyUrl,
  isDocumentFailure,
} from "./src/navigation";

export default function App() {
  const web = useRef<WebView>(null);
  const documentUrl = useRef(COMPANY_HOME);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [instance, setInstance] = useState(0);

  const confirmNavigation = (action: () => void) =>
    Alert.alert(
      "متابعة؟ / Continue?",
      "قد تُفقد التعديلات غير المحفوظة.\nUnsaved changes may be lost.",
      [
        { text: "إلغاء / Cancel", style: "cancel" },
        { text: "متابعة / Continue", onPress: action },
      ],
    );
  const back = () => {
    if (canGoBack) confirmNavigation(() => web.current?.goBack());
    return true;
  };
  useEffect(() => {
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!canGoBack) return false;
      return back();
    });
    return () => listener.remove();
  }, [canGoBack]);

  const retry = () => {
    setFailed(false);
    setLoading(true);
    web.current?.reload();
  };
  const blocked = () =>
    Alert.alert(
      "رابط غير متاح / Link unavailable",
      "التطبيق يفتح روابط منصة الشركة فقط.\nThis app only opens company platform links.",
    );

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={styles.container}
        edges={["top", "bottom", "left", "right"]}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.header}>
          <Image
            source={require("./assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="BIO-EMS"
          />
          <View style={styles.titleBox}>
            <Text style={styles.title}>منصة الشركة</Text>
            <Text style={styles.subtitle}>COMPANY PLATFORM</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="معلومات التطبيق / App information"
            onPress={() =>
              Alert.alert(
                "BIO-EMS Company",
                "إدارة الشركة وSystem Owner عبر المنصة الحالية. استخدم زر اللغة داخل الصفحة للتبديل بين العربية والإنجليزية.\n\nCompany administration and System Owner through the existing platform. Use the page language control for Arabic or English.\n\nلا يتم تضمين مفتاح دخول الشركة في التطبيق. سجّل الخروج من القائمة داخل المنصة عند الانتهاء.\nNo company access key is bundled in the app. Sign out using the platform menu when finished.",
              )
            }
            style={styles.button}
          >
            <Text style={styles.glyph}>ⓘ</Text>
          </Pressable>
        </View>
        <View style={styles.body}>
          <WebView
            key={instance}
            ref={web}
            source={{ uri: COMPANY_HOME }}
            style={styles.web}
            // A non-whitelisted URL is otherwise delegated to the OS automatically.
            // Match all here, then explicitly reject everything outside the exact origin.
            originWhitelist={["*"]}
            onShouldStartLoadWithRequest={(request) =>
              isCompanyUrl(request.url)
            }
            onOpenWindow={({ nativeEvent }) => {
              if (!isCompanyUrl(nativeEvent.targetUrl)) return blocked();
              confirmNavigation(() =>
                web.current?.injectJavaScript(
                  `window.location.assign(${JSON.stringify(nativeEvent.targetUrl)});true;`,
                ),
              );
            }}
            setSupportMultipleWindows
            javaScriptCanOpenWindowsAutomatically={false}
            mixedContentMode="never"
            allowFileAccess={false}
            allowFileAccessFromFileURLs={false}
            allowUniversalAccessFromFileURLs={false}
            thirdPartyCookiesEnabled={false}
            sharedCookiesEnabled={false}
            incognito
            cacheEnabled={false}
            cacheMode="LOAD_NO_CACHE"
            webviewDebuggingEnabled={false}
            allowsLinkPreview={false}
            mediaCapturePermissionGrantType="deny"
            mediaPlaybackRequiresUserAction
            onNavigationStateChange={(state) => setCanGoBack(state.canGoBack)}
            onLoadStart={({ nativeEvent }) => {
              documentUrl.current = nativeEvent.url;
              setLoading(true);
            }}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setFailed(true);
              setLoading(false);
            }}
            onHttpError={({ nativeEvent }) => {
              if (
                isDocumentFailure(
                  documentUrl.current,
                  nativeEvent.url,
                  nativeEvent.statusCode,
                )
              ) {
                setFailed(true);
                setLoading(false);
              }
            }}
            onContentProcessDidTerminate={() => {
              setFailed(true);
              setLoading(false);
            }}
            onRenderProcessGone={() => {
              setFailed(true);
              setLoading(false);
            }}
            renderError={() => <View />}
          />
          {loading && !failed && (
            <View pointerEvents="none" style={styles.loading}>
              <ActivityIndicator color="#087d8b" />
              <Text style={styles.loadingText}>جارٍ الاتصال / Connecting</Text>
            </View>
          )}
          {failed && (
            <View style={styles.error}>
              <Text style={styles.errorTitle}>تعذّر فتح منصة الشركة</Text>
              <Text style={styles.errorTitle}>
                Unable to open the company platform
              </Text>
              <Text style={styles.errorText}>
                تحقّق من الإنترنت ثم أعد المحاولة.
              </Text>
              <Text style={styles.errorText}>
                Check your connection and try again.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={retry}
                style={styles.retry}
              >
                <Text style={styles.retryText}>إعادة المحاولة / Retry</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  confirmNavigation(() => {
                    setFailed(false);
                    setLoading(true);
                    setCanGoBack(false);
                    setInstance((v) => v + 1);
                  })
                }
                style={styles.reset}
              >
                <Text style={styles.errorText}>
                  جلسة جديدة / Start a new session
                </Text>
              </Pressable>
            </View>
          )}
        </View>
        <View style={styles.toolbar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="رجوع / Back"
            disabled={!canGoBack || failed}
            onPress={back}
            style={[styles.button, (!canGoBack || failed) && styles.disabled]}
          >
            <Text style={styles.glyph}>‹</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="الصفحة الرئيسية / Home"
            disabled={failed}
            onPress={() =>
              confirmNavigation(() =>
                web.current?.injectJavaScript(HOME_SCRIPT),
              )
            }
            style={[styles.button, failed && styles.disabled]}
          >
            <Text style={styles.glyph}>⌂</Text>
          </Pressable>
          <Text style={styles.secure}>BIO-EMS · HTTPS</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="تحديث / Refresh"
            onPress={() => confirmNavigation(retry)}
            style={styles.button}
          >
            <Text style={styles.glyph}>↻</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="فتح المنصة في المتصفح / Open platform in browser"
            onPress={() =>
              Alert.alert(
                "فتح المتصفح / Open browser",
                "قد تحتاج لتسجيل الدخول مرة أخرى.\nYou may need to sign in again.",
                [
                  { text: "إلغاء / Cancel", style: "cancel" },
                  {
                    text: "فتح / Open",
                    onPress: () => {
                      void Linking.openURL(COMPANY_HOME).catch(() =>
                        Alert.alert(
                          "تعذّر فتح المتصفح / Could not open browser",
                        ),
                      );
                    },
                  },
                ],
              )
            }
            style={styles.button}
          >
            <Text style={styles.glyph}>↗</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    minHeight: 68,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#dce9ef",
  },
  logo: { width: 108, height: 38 },
  titleBox: { flex: 1, alignItems: "flex-end" },
  title: { fontSize: 17, fontWeight: "700", color: "#153c51" },
  subtitle: { fontSize: 9, letterSpacing: 1.2, color: "#517184", marginTop: 3 },
  body: { flex: 1, backgroundColor: "#f0f5f8" },
  web: { flex: 1, backgroundColor: "#f0f5f8" },
  loading: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 24,
  },
  loadingText: { color: "#153c51", fontSize: 12 },
  error: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#f0f5f8",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 10,
  },
  errorTitle: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#153c51",
  },
  errorText: { textAlign: "center", color: "#517184", fontSize: 14 },
  retry: {
    marginTop: 16,
    backgroundColor: "#087d8b",
    borderRadius: 14,
    padding: 16,
  },
  retryText: { color: "white", fontWeight: "700" },
  reset: { padding: 12 },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#dce9ef",
    padding: 6,
  },
  button: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  glyph: { fontSize: 28, color: "#087d8b" },
  secure: { color: "#517184", fontSize: 10, flex: 1, textAlign: "center" },
  disabled: { opacity: 0.3 },
});

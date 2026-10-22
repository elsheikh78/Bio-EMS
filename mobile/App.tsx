import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Vibration,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import { ApiError, login, logout, overview } from "./src/api";
import {
  activeAlarmKeys,
  alarmLevel,
  isActive,
  roomState,
  type Language,
  type Overview,
} from "./src/model";
import { t as translate } from "./src/locale";

type Session = { token: string; expiresAt: number };
const SESSION_KEY = "bioems.mobile.session";
const colors = {
  normal: "#08785b",
  critical: "#b52f3c",
  warning: "#9b6500",
  offline: "#657789",
};
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
function Workspace() {
  const [language, setLanguage] = useState<Language>("ar");
  const [session, setSession] = useState<Session | null>(null),
    [booting, setBooting] = useState(true);
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState("");
  const [data, setData] = useState<Overview | null>(null),
    [connected, setConnected] = useState(false),
    [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [alerts, setAlerts] = useState(false);
  const [tab, setTab] = useState<"overview" | "alarms" | "settings">(
      "overview",
    ),
    [siteId, setSiteId] = useState("");
  const [clock, setClock] = useState(Date.now()),
    [offset, setOffset] = useState(0);
  const refreshRef = useRef<() => void>(() => {}),
    alertsRef = useRef(false),
    languageRef = useRef<Language>("ar");
  const rtl = language === "ar",
    t = (key: string) => translate(language, key);
  const line = { flexDirection: rtl ? "row-reverse" : "row" } as const;
  const align = {
    textAlign: rtl ? "right" : "left",
    writingDirection: rtl ? "rtl" : "ltr",
  } as const;
  useEffect(() => {
    languageRef.current = language;
  }, [language]);
  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [stored, lang, sound] = await Promise.all([
          SecureStore.getItemAsync(SESSION_KEY),
          SecureStore.getItemAsync("bioems.mobile.language"),
          SecureStore.getItemAsync("bioems.mobile.alerts"),
        ]);
        if (!mounted) return;
        setLanguage(lang === "en" ? "en" : "ar");
        setAlerts(sound === "true");
        if (stored) {
          const value = JSON.parse(stored);
          if (
            typeof value.token === "string" &&
            /^mobile\.[A-Za-z0-9+/=]{44}$/.test(value.token) &&
            value.expiresAt > Date.now()
          )
            setSession(value);
          else await SecureStore.deleteItemAsync(SESSION_KEY);
        }
      } catch {
        if (mounted) setNotice("expired");
      } finally {
        if (mounted) setBooting(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    setData(null);
    setConnected(false);
    setSiteId("");
    if (!session) return;
    let cancelled = false,
      inFlight = false,
      initialized = false;
    let known = new Set<string>();
    let controller: AbortController | undefined;
    const load = async () => {
      if (
        cancelled ||
        inFlight ||
        (AppState.currentState && AppState.currentState !== "active")
      )
        return;
      inFlight = true;
      setRefreshing(true);
      controller = new AbortController();
      try {
        const next = await overview(session.token, controller.signal);
        if (cancelled) return;
        setOffset(next.serverTime - Date.now());
        setClock(Date.now());
        setData(next);
        setConnected(true);
        setNotice("");
        const keys = activeAlarmKeys(next.sites),
          arrivals = keys.filter((k) => !known.has(k));
        if (initialized && arrivals.length && alertsRef.current) {
          Vibration.vibrate([0, 250, 120, 250]);
          void Notifications.scheduleNotificationAsync({
            content: {
              title: "BIO-EMS",
              body: translate(languageRef.current, "newAlarm"),
              sound: "default",
            },
            trigger: null,
          }).catch(() => {
            if (!cancelled) setNotice("alertsDenied");
          });
        }
        known = new Set(keys);
        initialized = true;
      } catch (error) {
        if (cancelled) return;
        setConnected(false);
        if (error instanceof ApiError && error.status === 401) {
          setData(null);
          setNotice("expired");
          await SecureStore.deleteItemAsync(SESSION_KEY);
          if (!cancelled) setSession(null);
        } else setNotice("failed");
      } finally {
        inFlight = false;
        if (!cancelled) setRefreshing(false);
      }
    };
    refreshRef.current = () => void load();
    void load();
    const timer = setInterval(() => void load(), 30000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void load();
      else setConnected(false);
    });
    return () => {
      cancelled = true;
      controller?.abort();
      clearInterval(timer);
      subscription.remove();
      refreshRef.current = () => {};
    };
  }, [session?.token]);
  const changeLanguage = () => {
    const next = language === "ar" ? "en" : "ar";
    setLanguage(next);
    void SecureStore.setItemAsync("bioems.mobile.language", next).catch(
      () => {},
    );
  };
  const signIn = async () => {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      const next = await login(username.trim(), password);
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(next));
      setPassword("");
      setSession(next);
      setTab("overview");
    } catch (error) {
      setNotice(
        error instanceof ApiError && error.status === 429
          ? "rateLimit"
          : "loginFailed",
      );
    } finally {
      setBusy(false);
    }
  };
  const signOut = async () => {
    if (!session || busy) return;
    const token = session.token;
    setBusy(true);
    setSession(null);
    setData(null);
    setPassword("");
    setNotice("");
    setTab("overview");
    try {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      await Notifications.cancelAllScheduledNotificationsAsync();
      await logout(token);
    } catch {
      setNotice("logoutHelp");
    } finally {
      setBusy(false);
    }
  };
  const toggleAlerts = async () => {
    try {
      if (alerts) {
        setAlerts(false);
        await SecureStore.setItemAsync("bioems.mobile.alerts", "false");
        return;
      }
      if (Platform.OS === "android")
        await Notifications.setNotificationChannelAsync("default", {
          name: "BIO-EMS",
          importance: Notifications.AndroidImportance.HIGH,
          sound: "default",
        });
      const permission = await Notifications.requestPermissionsAsync();
      if (permission.status !== "granted") {
        setNotice("alertsDenied");
        return;
      }
      setAlerts(true);
      await SecureStore.setItemAsync("bioems.mobile.alerts", "true");
      setNotice("");
    } catch {
      setNotice("alertsDenied");
    }
  };
  const date = (value: string | number | null) =>
    value
      ? new Date(value).toLocaleString(language === "ar" ? "ar-EG" : "en-GB")
      : "—";
  const Badge = ({
    level,
    label = level,
  }: {
    level: keyof typeof colors;
    label?: string;
  }) => (
    <View style={[styles.badge, { backgroundColor: colors[level] + "16" }]}>
      <Text style={[styles.badgeText, { color: colors[level] }]}>
        {t(label)}
      </Text>
    </View>
  );
  const Button = ({
    label,
    onPress,
    secondary = false,
    disabled = false,
  }: {
    label: string;
    onPress: () => void;
    secondary?: boolean;
    disabled?: boolean;
  }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        (pressed || disabled) && { opacity: 0.55 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && { color: "#16455c" }]}>
        {label}
      </Text>
    </Pressable>
  );
  const sites = data?.sites.filter((s) => !siteId || s.id === siteId) || [];
  const entries = sites.flatMap((site) =>
    (site.snapshot?.rooms || []).map((room) => ({
      site,
      room,
      ...roomState(site, room, clock + offset, data!, connected),
    })),
  );
  const alarms = sites
    .flatMap((site) =>
      (site.snapshot?.alarms || []).map((alarm) => ({ site, alarm })),
    )
    .sort(
      (a, b) =>
        Date.parse(b.alarm.triggeredAt) - Date.parse(a.alarm.triggeredAt),
    );
  const active = alarms.filter(({ alarm }) => isActive(alarm)).length;
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, line]}>
        <Image
          source={require("./assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Button
          label={language === "ar" ? "English" : "العربية"}
          onPress={changeLanguage}
          secondary
        />
      </View>
      {booting ? (
        <View style={styles.center}>
          <ActivityIndicator color="#008a8c" />
          <Text>{t("loading")}</Text>
        </View>
      ) : !session ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <View style={styles.hero}>
              <Text style={[styles.eyebrow, align]}>BIO-EMS MONITOR</Text>
              <Text style={[styles.heroTitle, align]}>{t("hero")}</Text>
              <Text style={[styles.heroText, align]}>{t("intro")}</Text>
            </View>
            <View style={styles.card}>
              <Text style={[styles.title, align]}>{t("workspace")}</Text>
              <Text style={[styles.help, align]}>{t("loginHelp")}</Text>
              <Text style={[styles.label, align]}>{t("username")}</Text>
              <TextInput
                accessibilityLabel={t("username")}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                style={styles.input}
              />
              <Text style={[styles.label, align]}>{t("password")}</Text>
              <TextInput
                accessibilityLabel={t("password")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                style={styles.input}
                onSubmitEditing={() => void signIn()}
              />
              <Button
                label={busy ? t("loading") : t("login")}
                onPress={() => void signIn()}
                disabled={busy || !username.trim() || !password}
              />
            </View>
            {!!notice && (
              <Text accessibilityRole="alert" style={[styles.notice, align]}>
                {t(notice)}
              </Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => refreshRef.current()}
              />
            }
          >
            <View style={styles.hero}>
              <Text style={[styles.eyebrow, align]}>{t("readOnly")}</Text>
              <Text style={[styles.heroTitle, align]}>
                {data?.customerName || t("workspace")}
              </Text>
              <Text style={[styles.heroText, align]}>
                {data?.name || t("loading")}
              </Text>
              <Text style={[styles.heroText, align]}>
                {t("sync")}: {date(data?.serverTime || null)}
              </Text>
            </View>
            {!!notice && (
              <Text accessibilityRole="alert" style={[styles.notice, align]}>
                {t(notice)}
              </Text>
            )}
            {tab === "settings" ? (
              <View style={styles.card}>
                <Text style={[styles.title, align]}>{t("settings")}</Text>
                <Text style={[styles.help, align]}>{t("localOnly")}</Text>
                <Text style={[styles.label, align]}>{t("notifications")}</Text>
                <Text style={[styles.help, align]}>{t("alertsHelp")}</Text>
                <Button
                  label={t(alerts ? "disableAlerts" : "enableAlerts")}
                  onPress={() => void toggleAlerts()}
                />
                <Button
                  label={t("logout")}
                  onPress={() => void signOut()}
                  secondary
                  disabled={busy}
                />
              </View>
            ) : (
              <>
                <View style={[styles.stats, line]}>
                  {[
                    [t("sites"), sites.length],
                    [t("rooms"), entries.length],
                    [t("alarms"), active],
                  ].map(([label, value]) => (
                    <View style={styles.stat} key={label}>
                      <Text style={styles.statValue}>{value}</Text>
                      <Text style={styles.statLabel}>{label}</Text>
                    </View>
                  ))}
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.filters, line]}
                >
                  <Button
                    label={t("all")}
                    onPress={() => setSiteId("")}
                    secondary={!!siteId}
                  />
                  {data?.sites.map((site) => (
                    <Button
                      key={site.id}
                      label={site.name}
                      onPress={() => setSiteId(site.id)}
                      secondary={siteId !== site.id}
                    />
                  ))}
                </ScrollView>
                {tab === "overview" ? (
                  <>
                    <View style={[styles.section, line]}>
                      <Text style={styles.title}>{t("rooms")}</Text>
                      <Button
                        label={t("refresh")}
                        onPress={() => refreshRef.current()}
                        secondary
                        disabled={refreshing}
                      />
                    </View>
                    {!data?.sites.length && (
                      <Text style={[styles.help, align]}>{t("noSites")}</Text>
                    )}
                    {sites
                      .filter((s) => !s.snapshot)
                      .map((site) => (
                        <View style={styles.card} key={site.id}>
                          <Text style={[styles.title, align]}>{site.name}</Text>
                          <Badge level="offline" />
                          <Text style={[styles.help, align]}>
                            {t("noData")}
                          </Text>
                        </View>
                      ))}
                    {entries.map((e) => (
                      <View
                        key={`${e.site.id}:${e.room.id}`}
                        style={[
                          styles.card,
                          {
                            borderTopWidth: 3,
                            borderTopColor: colors[e.level],
                          },
                        ]}
                      >
                        <Text style={[styles.help, align]}>{e.site.name}</Text>
                        <View style={[styles.section, line]}>
                          <Text style={styles.title}>{e.room.name}</Text>
                          <Badge level={e.level} />
                        </View>
                        {e.stale && (
                          <Text style={[styles.stale, align]}>
                            {t("offline")}
                          </Text>
                        )}
                        {e.sensors.map((sensor) => (
                          <View key={sensor.id} style={styles.reading}>
                            <View style={[styles.section, line]}>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.sensorName, align]}>
                                  {sensor.name}
                                </Text>
                                <Text style={[styles.code, align]}>
                                  {sensor.code} · {t(sensor.type)}
                                </Text>
                              </View>
                              <Text
                                style={[
                                  styles.value,
                                  {
                                    color: e.staleReading(sensor)
                                      ? colors.offline
                                      : colors[e.level],
                                  },
                                ]}
                              >
                                {sensor.value === null
                                  ? "—"
                                  : new Intl.NumberFormat(
                                      language === "ar" ? "ar-EG" : "en-GB",
                                      { maximumFractionDigits: 2 },
                                    ).format(sensor.value)}{" "}
                                <Text style={styles.unit}>{sensor.unit}</Text>
                              </Text>
                            </View>
                            <Text style={[styles.time, align]}>
                              {t("readingTime")}: {date(sensor.recordedAt)}
                            </Text>
                          </View>
                        ))}
                        {!e.sensors.length && (
                          <Text style={[styles.help, align]}>
                            {t("noReading")}
                          </Text>
                        )}
                      </View>
                    ))}
                    {!!data &&
                      !!sites.length &&
                      !entries.length &&
                      sites.every((s) => !!s.snapshot) && (
                        <Text style={[styles.help, align]}>
                          {t("emptyRooms")}
                        </Text>
                      )}
                  </>
                ) : (
                  <>
                    <Text style={[styles.title, align]}>{t("alarms")}</Text>
                    {!alarms.length && (
                      <Text style={[styles.help, align]}>
                        {t("emptyAlarms")}
                      </Text>
                    )}
                    {alarms.map(({ site, alarm }) => {
                      const room = site.snapshot?.rooms.find(
                          (r) => r.id === alarm.roomId,
                        ),
                        sensor = site.snapshot?.sensors.find(
                          (s) => s.id === alarm.sensorId,
                        );
                      return (
                        <View
                          style={styles.card}
                          key={`${site.id}:${alarm.id}`}
                        >
                          <View style={[styles.section, line]}>
                            <Text
                              style={[styles.sensorName, { flex: 1 }, align]}
                            >
                              {room?.name || "—"} · {sensor?.name || "—"}
                            </Text>
                            <Badge
                              level={
                                isActive(alarm) ? alarmLevel(alarm) : "normal"
                              }
                              label={alarm.status}
                            />
                          </View>
                          <Text style={[styles.help, align]}>
                            {site.name} · {t(alarm.type)}
                          </Text>
                          <Text style={[styles.value, align]}>
                            {alarm.value ?? "—"} {sensor?.unit || ""}
                          </Text>
                          <Text style={[styles.time, align]}>
                            {date(alarm.triggeredAt)}
                          </Text>
                        </View>
                      );
                    })}
                  </>
                )}
              </>
            )}
            <Text style={[styles.footer, align]}>{t("localOnly")}</Text>
          </ScrollView>
          <View style={[styles.tabs, line]}>
            {(["overview", "alarms", "settings"] as const).map((name) => (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === name }}
                key={name}
                onPress={() => setTab(name)}
                style={[styles.tab, tab === name && styles.selectedTab]}
              >
                <Text
                  style={[styles.tabText, tab === name && { color: "#007e84" }]}
                >
                  {t(name)}
                  {name === "alarms" && active ? ` (${active})` : ""}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Workspace />
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f0f5f8" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  logo: { width: 160, height: 65 },
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 32,
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  hero: { backgroundColor: "#073b56", borderRadius: 23, padding: 25, gap: 12 },
  eyebrow: {
    color: "#7edbc9",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  heroTitle: { color: "#fff", fontSize: 28, lineHeight: 42, fontWeight: "700" },
  heroText: { color: "#c5e0e7", fontSize: 13, lineHeight: 23 },
  card: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#dde8ed",
    gap: 13,
  },
  title: { fontSize: 19, fontWeight: "700", color: "#163b50" },
  help: { fontSize: 13, lineHeight: 23, color: "#536e7e" },
  label: { fontSize: 13, fontWeight: "600", color: "#254659" },
  input: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#c6d8df",
    borderRadius: 10,
    backgroundColor: "#f8fbfc",
    fontSize: 16,
    color: "#15394d",
    textAlign: "left",
    writingDirection: "ltr",
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: "#007e84",
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: { backgroundColor: "#e5eff3" },
  buttonText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  notice: {
    backgroundColor: "#fff0df",
    color: "#82511e",
    borderRadius: 12,
    padding: 16,
    fontSize: 13,
    lineHeight: 23,
  },
  stats: { gap: 10 },
  stat: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 15,
    alignItems: "center",
    gap: 8,
  },
  statValue: { color: "#073b56", fontSize: 28, fontWeight: "700" },
  statLabel: { color: "#5c7482", fontSize: 11 },
  filters: { gap: 8 },
  section: { alignItems: "center", justifyContent: "space-between", gap: 10 },
  badge: { padding: 7, borderRadius: 9, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "700" },
  stale: { color: "#815c29", fontSize: 12 },
  reading: {
    borderTopWidth: 1,
    borderColor: "#edf1f4",
    paddingTop: 13,
    gap: 7,
  },
  sensorName: { color: "#1d4156", fontSize: 14, fontWeight: "600" },
  code: { color: "#718692", fontSize: 10, marginTop: 5 },
  value: { fontSize: 27, fontWeight: "700", color: "#17485a" },
  unit: { fontSize: 13 },
  time: { color: "#69808d", fontSize: 10, lineHeight: 18 },
  tabs: {
    borderTopWidth: 1,
    borderColor: "#dbe5eb",
    backgroundColor: "#fff",
    padding: 10,
    gap: 8,
  },
  tab: { flex: 1, alignItems: "center", padding: 13, borderRadius: 11 },
  selectedTab: { backgroundColor: "#e5f5f1" },
  tabText: { fontWeight: "700", fontSize: 12, color: "#71828e" },
  footer: { fontSize: 11, color: "#6a7e89", lineHeight: 20 },
});

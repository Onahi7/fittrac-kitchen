import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useClinicalAuth } from "@/context/ClinicalAuthContext";
import { useColors } from "@/hooks/useColors";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function ClinicalHomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { clinicalToken, clinicalStaff } = useClinicalAuth();

  const [dashboard, setDashboard] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isDoctor = clinicalStaff?.role === "doctor";

  const load = async () => {
    try {
      const headers = { Authorization: `Bearer ${clinicalToken}` };
      const [dashRes, consultRes, patientsRes] = await Promise.all([
        fetch("/api/clinical-staff/dashboard", { headers }),
        fetch("/api/clinical-staff/consultations", { headers }),
        fetch("/api/clinical-staff/patients", { headers }),
      ]);
      const [dashJson, consultJson, patientsJson] = await Promise.all([
        dashRes.json(),
        consultRes.json(),
        patientsRes.json(),
      ]);
      setDashboard(dashJson);
      setConsultations(consultJson.consultations ?? []);
      setPatients(patientsJson.patients ?? []);
    } catch {
      // The child cards fall back to empty states.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const nextConsultation = useMemo(
    () => consultations.find((c) => c.status === "in-progress") ?? consultations.find((c) => c.status === "scheduled"),
    [consultations],
  );
  const highRiskPatients = patients.filter((p) => (p.riskScore ?? 0) >= 7).slice(0, 3);
  const attentionClients = dashboard?.clientsNeedingAttention ?? [];

  const statCards = isDoctor
    ? [
        { label: "Today", value: dashboard?.todayConsultations ?? 0, icon: "calendar" as const, color: colors.primary },
        { label: "Active", value: dashboard?.inProgress ?? 0, icon: "video" as const, color: "#1D4ED8" },
        { label: "Critical", value: dashboard?.criticalAlerts ?? 0, icon: "alert-triangle" as const, color: "#DC2626" },
        { label: "Patients", value: dashboard?.totalPatients ?? patients.length, icon: "users" as const, color: "#8B500A" },
      ]
    : [
        { label: "Clients", value: dashboard?.totalClients ?? patients.length, icon: "users" as const, color: colors.primary },
        { label: "Plans", value: dashboard?.activePlans ?? 0, icon: "book-open" as const, color: "#1D4ED8" },
        { label: "Adherence", value: dashboard?.averageAdherence ? `${dashboard.averageAdherence}%` : "0%", icon: "trending-up" as const, color: "#059669" },
        { label: "Attention", value: dashboard?.lowAdherence ?? attentionClients.length, icon: "alert-circle" as const, color: "#DC2626" },
      ];

  const go = (path: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    router.push(path as any);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100 },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.kicker, { color: colors.mutedForeground, fontFamily: "Manrope_600SemiBold" }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.title, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]} numberOfLines={1}>
            {clinicalStaff?.name ?? "Clinical Team"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            {isDoctor ? "Doctor workspace" : "Nutrition care workspace"}
          </Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { fontFamily: "Epilogue_700Bold" }]}>
            {(clinicalStaff?.name ?? "C").split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.statsGrid}>
            {statCards.map((s) => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: s.color + "12", borderColor: s.color + "28" }]}>
                <Feather name={s.icon} size={18} color={s.color} />
                <Text style={[styles.statValue, { color: s.color, fontFamily: "Epilogue_700Bold" }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: s.color, fontFamily: "Manrope_600SemiBold" }]}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.nextCard, { backgroundColor: colors.primary }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nextKicker, { fontFamily: "Manrope_700Bold" }]}>Next Session</Text>
              <Text style={[styles.nextName, { fontFamily: "Epilogue_700Bold" }]} numberOfLines={1}>
                {nextConsultation?.patientName ?? "No pending session"}
              </Text>
              <Text style={[styles.nextMeta, { fontFamily: "Manrope_400Regular" }]}>
                {nextConsultation ? `${nextConsultation.scheduledTime} - ${nextConsultation.chiefComplaint ?? nextConsultation.type}` : "Your schedule is clear for now"}
              </Text>
            </View>
            <Pressable style={styles.nextButton} onPress={() => go("/(clinical-tabs)/cl-schedule")}>
              <Feather name={nextConsultation ? "arrow-right" : "calendar"} size={18} color={colors.primary} />
            </Pressable>
          </View>

          <View style={styles.quickRow}>
            {[
              { label: "Schedule", icon: "calendar" as const, path: "/(clinical-tabs)/cl-schedule" },
              { label: isDoctor ? "Patients" : "Clients", icon: "users" as const, path: "/(clinical-tabs)/cl-patients" },
              { label: isDoctor ? "Labs" : "Plans", icon: isDoctor ? "clipboard" as const : "book-open" as const, path: "/(clinical-tabs)/cl-tools" },
            ].map((item) => (
              <Pressable key={item.label} style={[styles.quickButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => go(item.path)}>
                <Feather name={item.icon} size={19} color={colors.primary} />
                <Text style={[styles.quickText, { color: colors.onSurface, fontFamily: "Manrope_700Bold" }]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            {isDoctor ? "Needs Review" : "Adherence Watch"}
          </Text>
          {(isDoctor ? highRiskPatients : attentionClients).length > 0 ? (
            (isDoctor ? highRiskPatients : attentionClients).map((p: any) => (
              <Pressable
                key={p.id}
                style={[styles.attentionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => p.id && go(`/clinical-patient/${p.id}`)}
              >
                <View style={[styles.alertIcon, { backgroundColor: "#FEE2E2" }]}>
                  <Feather name="alert-triangle" size={16} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.attentionName, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>{p.name}</Text>
                  <Text style={[styles.attentionMeta, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                    {isDoctor ? `Risk score ${p.riskScore}` : `${p.adherenceScore}% adherence - ${p.reason}`}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.outline} />
              </Pressable>
            ))
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="check-circle" size={18} color="#059669" />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
                Nothing urgent right now
              </Text>
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Activity</Text>
          {(dashboard?.recentActivity ?? []).slice(0, 3).map((item: any) => (
            <View key={`${item.time}-${item.event}`} style={styles.activityRow}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.activityTime, { color: colors.outline, fontFamily: "Manrope_600SemiBold" }]}>{item.time}</Text>
              <Text style={[styles.activityText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>{item.event}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 22 },
  kicker: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  title: { fontSize: 25, marginTop: 2 },
  subtitle: { fontSize: 13, marginTop: 2 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 17 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: { width: "47.8%", borderWidth: 1, borderRadius: 16, padding: 14, gap: 6 },
  statValue: { fontSize: 24 },
  statLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4 },
  nextCard: { borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 },
  nextKicker: { color: "#ffffffB8", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  nextName: { color: "#fff", fontSize: 18 },
  nextMeta: { color: "#ffffffCC", fontSize: 12, marginTop: 3 },
  nextButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  quickRow: { flexDirection: "row", gap: 9, marginBottom: 24 },
  quickButton: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 13, alignItems: "center", gap: 6 },
  quickText: { fontSize: 11 },
  sectionTitle: { fontSize: 16, marginBottom: 12 },
  attentionCard: { borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  alertIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  attentionName: { fontSize: 14, marginBottom: 2 },
  attentionMeta: { fontSize: 12 },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 22 },
  emptyText: { fontSize: 13 },
  activityRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  activityTime: { width: 44, fontSize: 11 },
  activityText: { flex: 1, fontSize: 12, lineHeight: 17 },
});

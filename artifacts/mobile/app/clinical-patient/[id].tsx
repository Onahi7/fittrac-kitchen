import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { apiFetch } from "@/lib/api";

function initials(name = "Patient") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function MetricCard({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <View style={[styles.metricCard, { backgroundColor: tone + "12", borderColor: tone + "30" }]}>
      <Text style={[styles.metricValue, { color: tone, fontFamily: "Epilogue_700Bold" }]}>{value ?? "-"}</Text>
      <Text style={[styles.metricLabel, { color: tone, fontFamily: "Manrope_600SemiBold" }]}>{label}</Text>
    </View>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={[styles.tagText, { fontFamily: "Manrope_700Bold" }]}>{label}</Text>
    </View>
  );
}

export default function ClinicalPatientDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clinicalToken, clinicalStaff } = useClinicalAuth();

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const isDoctor = clinicalStaff?.role === "doctor";

  const load = async () => {
    try {
      const res = await apiFetch(`/api/clinical-staff/patients/${id}`, {
        headers: { Authorization: `Bearer ${clinicalToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load chart");
      setPatient(json);
      setError("");
    } catch (e: any) {
      setError(e.message ?? "Could not load chart");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const latestLab = useMemo(() => patient?.labs?.[0], [patient]);
  const activePlan = useMemo(() => patient?.mealPlans?.find((p: any) => p.status === "active") ?? patient?.mealPlans?.[0], [patient]);
  const recentRx = useMemo(() => patient?.prescriptions?.[0], [patient]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 36 },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={12}>
        <Feather name="arrow-left" size={20} color={colors.onSurface} />
      </Pressable>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      ) : error ? (
        <View style={styles.empty}>
          <Feather name="alert-circle" size={44} color={colors.destructive} />
          <Text style={[styles.emptyText, { color: colors.destructive, fontFamily: "Manrope_600SemiBold" }]}>{error}</Text>
        </View>
      ) : (
        <>
          <View style={[styles.hero, { backgroundColor: colors.primary }]}>
            <View style={styles.heroTop}>
              <View style={styles.avatar}>
                <Text style={[styles.avatarText, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>{initials(patient.name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { fontFamily: "Epilogue_700Bold" }]}>{patient.name}</Text>
                <Text style={[styles.bio, { fontFamily: "Manrope_400Regular" }]}>
                  {patient.age ? `${patient.age} years` : "Age not set"} - {patient.gender ?? "Gender not set"}
                </Text>
              </View>
              <View style={[styles.riskPill, { backgroundColor: (patient.riskScore ?? 0) >= 7 ? "#FEE2E2" : "#ffffff24" }]}>
                <Text style={[styles.riskText, { color: (patient.riskScore ?? 0) >= 7 ? "#DC2626" : "#fff", fontFamily: "Manrope_700Bold" }]}>
                  Risk {patient.riskScore ?? "-"}
                </Text>
              </View>
            </View>
            <View style={styles.tagRow}>
              {(patient.conditions ?? []).map((c: string) => <Tag key={c} label={c} />)}
            </View>
          </View>

          <View style={styles.metrics}>
            <MetricCard label="BMI" value={patient.bmi ?? "-"} tone={colors.primary} />
            <MetricCard label="HbA1c" value={patient.hba1c ? `${patient.hba1c}%` : "-"} tone="#D97706" />
            <MetricCard label="BP" value={patient.bpSystolic ? `${patient.bpSystolic}/${patient.bpDiastolic}` : "-"} tone="#DC2626" />
            <MetricCard label="Adherence" value={`${patient.adherenceScore ?? 0}%`} tone="#059669" />
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Care Summary</Text>
            <Text style={[styles.notes, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
              {patient.notes ?? "No clinical notes recorded yet."}
            </Text>
            <View style={styles.summaryRow}>
              <Feather name="calendar" size={15} color={colors.outline} />
              <Text style={[styles.summaryText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                Last visit {patient.lastVisit ?? "-"} - Next {patient.nextAppointment ?? "-"}
              </Text>
            </View>
          </View>

          {isDoctor ? (
            <>
              <InfoCard
                title="Latest Lab"
                icon="clipboard"
                colors={colors}
                primary={latestLab?.testName ?? "No lab result"}
                secondary={latestLab ? `${latestLab.value ?? ""} ${latestLab.unit ?? ""}` : "Results will appear here"}
                accent={latestLab?.status ?? latestLab?.flag}
              />
              <InfoCard
                title="Recent Prescription"
                icon="file-text"
                colors={colors}
                primary={recentRx?.diagnosis ?? "No prescription"}
                secondary={recentRx?.medications?.length ? `${recentRx.medications.length} medication(s)` : "No medication history"}
                accent={recentRx?.date}
              />
            </>
          ) : (
            <>
              <InfoCard
                title="Active Meal Plan"
                icon="book-open"
                colors={colors}
                primary={activePlan?.title ?? "No active meal plan"}
                secondary={activePlan ? `${activePlan.targetCalories} kcal - ${activePlan.targetProtein}g protein` : "Create a plan from the tools tab"}
                accent={activePlan ? `${activePlan.adherenceScore}% adherence` : undefined}
              />
              <InfoCard
                title="Session Notes"
                icon="edit-3"
                colors={colors}
                primary={patient.sessionNotes?.[0]?.summary ?? "No session notes"}
                secondary={patient.sessionNotes?.[0]?.nextSession ? `Next session ${patient.sessionNotes[0].nextSession}` : "Notes will appear here"}
              />
            </>
          )}

          <View style={styles.actionRow}>
            <Pressable style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={() => router.push("/consultation-room")}>
              <Feather name="video" size={16} color="#fff" />
              <Text style={[styles.actionText, { fontFamily: "Manrope_700Bold" }]}>Start Session</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.secondaryAction, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name={isDoctor ? "file-plus" : "edit-3"} size={16} color={colors.primary} />
              <Text style={[styles.secondaryActionText, { color: colors.primary, fontFamily: "Manrope_700Bold" }]}>
                {isDoctor ? "New Rx" : "Note"}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function InfoCard({
  title,
  icon,
  colors,
  primary,
  secondary,
  accent,
}: {
  title: string;
  icon: any;
  colors: any;
  primary: string;
  secondary: string;
  accent?: string;
}) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.infoHeader}>
        <View style={[styles.infoIcon, { backgroundColor: colors.primary + "15" }]}>
          <Feather name={icon} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>{title}</Text>
        {accent && <Text style={[styles.accent, { color: colors.primary, fontFamily: "Manrope_700Bold" }]}>{accent}</Text>}
      </View>
      <Text style={[styles.infoPrimary, { color: colors.onSurface, fontFamily: "Manrope_700Bold" }]}>{primary}</Text>
      <Text style={[styles.infoSecondary, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>{secondary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  backButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  hero: { borderRadius: 22, padding: 18, marginBottom: 14 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20 },
  name: { color: "#fff", fontSize: 21 },
  bio: { color: "#ffffffCC", fontSize: 12, marginTop: 2 },
  riskPill: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  riskText: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  tag: { backgroundColor: "#ffffff24", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  tagText: { color: "#fff", fontSize: 11, textTransform: "capitalize" },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  metricCard: { width: "47.8%", borderRadius: 15, borderWidth: 1, padding: 14 },
  metricValue: { fontSize: 22 },
  metricLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4, marginTop: 2 },
  sectionCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 15 },
  notes: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  summaryText: { fontSize: 12, flex: 1 },
  infoHeader: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 12 },
  infoIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  accent: { marginLeft: "auto", fontSize: 11, textTransform: "capitalize" },
  infoPrimary: { fontSize: 14, marginBottom: 4 },
  infoSecondary: { fontSize: 12, lineHeight: 17 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 2 },
  actionButton: { flex: 1, borderRadius: 15, paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  actionText: { color: "#fff", fontSize: 14 },
  secondaryAction: { borderWidth: 1 },
  secondaryActionText: { fontSize: 14 },
  empty: { alignItems: "center", gap: 12, marginTop: 80 },
  emptyText: { fontSize: 14, textAlign: "center" },
});

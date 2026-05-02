import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  "in-progress": { bg: "#E8F5E9", text: "#154212", label: "In Progress" },
  scheduled: { bg: "#EFF6FF", text: "#1D4ED8", label: "Scheduled" },
  completed: { bg: "#F3F4F6", text: "#6B7280", label: "Completed" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.scheduled;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.text, fontFamily: "Manrope_700Bold" }]}>{s.label}</Text>
    </View>
  );
}

export default function ScheduleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { clinicalToken, clinicalStaff } = useClinicalAuth();

  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/clinical-staff/consultations", {
        headers: { Authorization: `Bearer ${clinicalToken}` },
      });
      const data = await res.json();
      setConsultations(data.consultations ?? []);
    } catch {
      setError("Could not load schedule.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const today = new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" });

  const todayItems = consultations.filter((c) => c.status !== "completed").slice(0, 8);
  const completedItems = consultations.filter((c) => c.status === "completed");

  const handleJoin = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/consultation-room");
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
      <Text style={[styles.pageTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Schedule</Text>
      <Text style={[styles.dateSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>{today}</Text>

      <View style={[styles.summaryRow]}>
        {[
          { label: "Today", value: todayItems.length, color: colors.primary, bg: colors.primary + "15" },
          { label: "In Progress", value: todayItems.filter((c) => c.status === "in-progress").length, color: "#059669", bg: "#D1FAE5" },
          { label: "Done", value: completedItems.length, color: colors.mutedForeground, bg: colors.muted },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
            <Text style={[styles.statNum, { color: s.color, fontFamily: "Epilogue_700Bold" }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: s.color, fontFamily: "Manrope_500Medium" }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}
      {error !== "" && <Text style={[styles.errText, { color: colors.destructive, fontFamily: "Manrope_500Medium" }]}>{error}</Text>}

      {todayItems.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Upcoming</Text>
          {todayItems.map((c) => (
            <View key={c.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.avatarText, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>
                    {(c.patientName ?? "P").charAt(0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.patientName, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>{c.patientName}</Text>
                  <Text style={[styles.meta, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                    {c.scheduledTime} • {c.type}
                  </Text>
                  {c.chiefComplaint && (
                    <Text style={[styles.complaint, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]} numberOfLines={1}>
                      {c.chiefComplaint}
                    </Text>
                  )}
                </View>
                <StatusBadge status={c.status} />
              </View>
              {c.status === "in-progress" && (
                <Pressable
                  style={[styles.joinBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleJoin(c.id)}
                >
                  <Feather name="video" size={14} color="#fff" />
                  <Text style={[styles.joinText, { fontFamily: "Manrope_700Bold" }]}>Join Call</Text>
                </Pressable>
              )}
              {c.status === "scheduled" && (
                <Pressable
                  style={[styles.joinBtn, { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }]}
                  onPress={() => handleJoin(c.id)}
                >
                  <Feather name="video" size={14} color={colors.primary} />
                  <Text style={[styles.joinText, { color: colors.primary, fontFamily: "Manrope_700Bold" }]}>Prepare</Text>
                </Pressable>
              )}
            </View>
          ))}
        </>
      )}

      {completedItems.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Epilogue_700Bold" }]}>Completed</Text>
          {completedItems.slice(0, 4).map((c) => (
            <View key={c.id} style={[styles.card, styles.doneCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <View style={[styles.avatar, { backgroundColor: colors.outlineVariant }]}>
                <Text style={[styles.avatarText, { color: colors.mutedForeground, fontFamily: "Epilogue_700Bold" }]}>
                  {(c.patientName ?? "P").charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.patientName, { color: colors.mutedForeground, fontFamily: "Epilogue_700Bold" }]}>{c.patientName}</Text>
                <Text style={[styles.meta, { color: colors.outline, fontFamily: "Manrope_400Regular" }]}>{c.scheduledTime} • {c.type}</Text>
              </View>
              <Feather name="check-circle" size={18} color="#059669" />
            </View>
          ))}
        </>
      )}

      {!loading && consultations.length === 0 && (
        <View style={styles.empty}>
          <Feather name="calendar" size={48} color={colors.outlineVariant} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>No consultations today</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 0 },
  pageTitle: { fontSize: 28, letterSpacing: -0.5, marginBottom: 2 },
  dateSub: { fontSize: 13, marginBottom: 20 },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center", gap: 2 },
  statNum: { fontSize: 22 },
  statLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  sectionTitle: { fontSize: 15, marginBottom: 12, marginTop: 8 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, gap: 12 },
  doneCard: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16 },
  patientName: { fontSize: 15, marginBottom: 2 },
  meta: { fontSize: 12 },
  complaint: { fontSize: 12, marginTop: 2, fontStyle: "italic" },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  badgeText: { fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4 },
  joinBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 10 },
  joinText: { color: "#fff", fontSize: 14 },
  errText: { textAlign: "center", marginTop: 24 },
  empty: { alignItems: "center", gap: 12, marginTop: 60 },
  emptyText: { fontSize: 15 },
});

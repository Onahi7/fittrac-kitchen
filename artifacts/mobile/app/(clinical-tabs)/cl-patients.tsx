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
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useClinicalAuth } from "@/context/ClinicalAuthContext";
import { useColors } from "@/hooks/useColors";
import { apiFetch } from "@/lib/api";

const CONDITION_COLORS: Record<string, { bg: string; text: string }> = {
  hypertension: { bg: "#FEE2E2", text: "#991B1B" },
  diabetes: { bg: "#FEF3C7", text: "#92400E" },
  "weight loss": { bg: "#D1FAE5", text: "#065F46" },
  obesity: { bg: "#FCE7F3", text: "#831843" },
  liver: { bg: "#EDE9FE", text: "#4C1D95" },
};

function ConditionTag({ label }: { label: string }) {
  const key = label.toLowerCase();
  const style = CONDITION_COLORS[key] ?? { bg: "#F3F4F6", text: "#374151" };
  return (
    <View style={[styles.tag, { backgroundColor: style.bg }]}>
      <Text style={[styles.tagText, { color: style.text, fontFamily: "Manrope_600SemiBold" }]}>{label}</Text>
    </View>
  );
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["#154212", "#8B500A", "#1D4ED8", "#059669", "#7C3AED", "#DB2777"];

export default function PatientsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { clinicalToken, clinicalStaff } = useClinicalAuth();

  const [patients, setPatients] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const isDoctor = clinicalStaff?.role === "doctor";

  const load = async () => {
    try {
      const res = await apiFetch("/api/clinical-staff/patients", {
        headers: { Authorization: `Bearer ${clinicalToken}` },
      });
      const data = await res.json();
      setPatients(data.patients ?? []);
    } catch {
      setError("Could not load patients.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = patients.filter((p) => {
    const q = query.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      (p.primaryCondition ?? "").toLowerCase().includes(q)
    );
  });

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
      <Text style={[styles.pageTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
        {isDoctor ? "Patients" : "Clients"}
      </Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
        {patients.length} {isDoctor ? "patients" : "clients"} under your care
      </Text>

      <View style={[styles.searchBar, { backgroundColor: colors.input, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.outline} />
        <TextInput
          style={[styles.searchInput, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}
          value={query}
          onChangeText={setQuery}
          placeholder={`Search ${isDoctor ? "patients" : "clients"}...`}
          placeholderTextColor={colors.outline}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Feather name="x" size={14} color={colors.outline} />
          </Pressable>
        )}
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}
      {error !== "" && <Text style={[styles.errText, { color: colors.destructive, fontFamily: "Manrope_500Medium" }]}>{error}</Text>}

      {filtered.map((p, i) => {
        const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
        const riskHigh = p.riskScore >= 7;
        return (
          <View key={p.id} style={[styles.card, { backgroundColor: colors.card, borderColor: riskHigh ? "#FCA5A5" : colors.border }]}>
            <View style={styles.cardRow}>
              <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                <Text style={[styles.avatarText, { fontFamily: "Epilogue_700Bold" }]}>{initials(p.name)}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>{p.name}</Text>
                  {riskHigh && (
                    <View style={[styles.riskBadge, { backgroundColor: "#FEE2E2" }]}>
                      <Feather name="alert-triangle" size={10} color="#DC2626" />
                      <Text style={[styles.riskText, { color: "#DC2626", fontFamily: "Manrope_700Bold" }]}>High Risk</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.meta, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                  {p.age ? `${p.age}y • ` : ""}{p.gender ?? ""}
                </Text>
                <View style={styles.tagRow}>
                  {p.primaryCondition && <ConditionTag label={p.primaryCondition} />}
                  {(p.conditions ?? []).filter((c: string) => c !== p.primaryCondition).slice(0, 2).map((c: string) => (
                    <ConditionTag key={c} label={c} />
                  ))}
                </View>
                <Text style={[styles.lastVisit, { color: colors.outline, fontFamily: "Manrope_400Regular" }]}>
                  Last visit: {p.lastVisit ?? "—"}
                </Text>
              </View>
              <Pressable
                style={[styles.viewBtn, { backgroundColor: colors.primary + "15" }]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                  router.push(`/clinical-patient/${p.id}`);
                }}
              >
                <Feather name="chevron-right" size={18} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        );
      })}

      {!loading && filtered.length === 0 && (
        <View style={styles.empty}>
          <Feather name="users" size={48} color={colors.outlineVariant} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
            {query ? "No results found" : "No patients yet"}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 0 },
  pageTitle: { fontSize: 28, letterSpacing: -0.5, marginBottom: 2 },
  sub: { fontSize: 13, marginBottom: 16 },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, gap: 10, marginBottom: 20 },
  searchInput: { flex: 1, fontSize: 15 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 10 },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 16 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  name: { fontSize: 15 },
  meta: { fontSize: 12 },
  tagRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  tag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 10 },
  lastVisit: { fontSize: 11 },
  riskBadge: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  riskText: { fontSize: 9, textTransform: "uppercase", letterSpacing: 0.3 },
  viewBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  errText: { textAlign: "center", marginTop: 24 },
  empty: { alignItems: "center", gap: 12, marginTop: 60 },
  emptyText: { fontSize: 15 },
});

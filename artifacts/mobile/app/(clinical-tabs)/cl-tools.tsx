import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useClinicalAuth } from "@/context/ClinicalAuthContext";
import { apiFetch } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

function AdherenceRing({ score, size = 54 }: { score: number; size?: number }) {
  const colors = useColors();
  const color = score >= 80 ? "#059669" : score >= 60 ? "#D97706" : "#DC2626";
  return (
    <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderColor: color, borderWidth: 4, backgroundColor: color + "15" }]}>
      <Text style={[styles.ringText, { color, fontFamily: "Epilogue_700Bold", fontSize: size * 0.26 }]}>{score}%</Text>
    </View>
  );
}

function LabFlagBadge({ flag }: { flag?: string }) {
  if (!flag) return null;
  const isCrit = flag === "critical";
  return (
    <View style={[styles.flagBadge, { backgroundColor: isCrit ? "#FEE2E2" : "#FEF3C7" }]}>
      <Feather name={isCrit ? "alert-circle" : "alert-triangle"} size={10} color={isCrit ? "#DC2626" : "#D97706"} />
      <Text style={[styles.flagText, { color: isCrit ? "#DC2626" : "#D97706", fontFamily: "Manrope_700Bold" }]}>
        {isCrit ? "CRITICAL" : "ELEVATED"}
      </Text>
    </View>
  );
}

export default function ToolsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { clinicalToken, clinicalStaff } = useClinicalAuth();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const isDoctor = clinicalStaff?.role === "doctor";

  const load = async () => {
    try {
      const endpoint = isDoctor ? "/api/clinical-staff/lab-results" : "/api/clinical-staff/meal-plans";
      const res = await apiFetch(endpoint, {
        headers: { Authorization: `Bearer ${clinicalToken}` },
      });
      const json = await res.json();
      setData(isDoctor ? (json.labResults ?? []) : (json.mealPlans ?? []));
    } catch {
      setError("Could not load data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const criticalLabs = data.filter((r) => r.flag === "critical");
  const otherLabs = data.filter((r) => r.flag !== "critical");

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
        {isDoctor ? "Lab Results" : "Meal Plans"}
      </Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
        {isDoctor ? `${criticalLabs.length} critical • ${data.length} total results` : `${data.filter((p) => p.adherenceScore >= 80).length} high adherence • ${data.length} active plans`}
      </Text>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}
      {error !== "" && <Text style={[styles.errText, { color: colors.destructive, fontFamily: "Manrope_500Medium" }]}>{error}</Text>}

      {isDoctor ? (
        <>
          {criticalLabs.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: "#DC2626", fontFamily: "Epilogue_700Bold" }]}>
                Critical — Action Required
              </Text>
              {criticalLabs.map((r) => (
                <LabCard key={r.id} result={r} colors={colors} />
              ))}
            </>
          )}
          {otherLabs.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
                All Results
              </Text>
              {otherLabs.map((r) => (
                <LabCard key={r.id} result={r} colors={colors} />
              ))}
            </>
          )}
          {!loading && data.length === 0 && <EmptyState icon="clipboard" label="No lab results" colors={colors} />}
        </>
      ) : (
        <>
          {data.map((plan) => (
            <View key={plan.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.planRow}>
                <AdherenceRing score={plan.adherenceScore} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.planTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]} numberOfLines={1}>{plan.title}</Text>
                  <Text style={[styles.meta, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                    {plan.targetCalories} kcal/day • Started {plan.createdAt}
                  </Text>
                  <View style={styles.macroRow}>
                    {[
                      { label: "Protein", val: `${plan.targetProtein}g`, color: "#1D4ED8" },
                      { label: "Carbs", val: `${plan.targetCarbs}g`, color: "#D97706" },
                      { label: "Fat", val: `${plan.targetFat}g`, color: "#DC2626" },
                    ].map((m) => (
                      <View key={m.label} style={[styles.macro, { backgroundColor: m.color + "15" }]}>
                        <Text style={[styles.macroVal, { color: m.color, fontFamily: "Manrope_700Bold" }]}>{m.val}</Text>
                        <Text style={[styles.macroLabel, { color: m.color, fontFamily: "Manrope_400Regular" }]}>{m.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              <AdherenceBar score={plan.adherenceScore} colors={colors} />
            </View>
          ))}
          {!loading && data.length === 0 && <EmptyState icon="book-open" label="No meal plans" colors={colors} />}
        </>
      )}
    </ScrollView>
  );
}

function LabCard({ result: r, colors }: { result: any; colors: any }) {
  const isCrit = r.flag === "critical";
  return (
    <View style={[styles.card, { backgroundColor: isCrit ? "#FFF5F5" : colors.card, borderColor: isCrit ? "#FCA5A5" : colors.border }]}>
      <View style={styles.labRow}>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={styles.labTitleRow}>
            <Text style={[styles.testName, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>{r.testName}</Text>
            <LabFlagBadge flag={r.flag} />
          </View>
          <Text style={[styles.meta, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            {r.patientName} • {r.date}
          </Text>
          <View style={styles.valueRow}>
            <Text style={[styles.value, { color: isCrit ? "#DC2626" : colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
              {r.value} {r.unit}
            </Text>
            <Text style={[styles.range, { color: colors.outline, fontFamily: "Manrope_400Regular" }]}>
              Normal: {r.referenceRange}
            </Text>
          </View>
          {r.notes && (
            <Text style={[styles.notes, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]} numberOfLines={2}>
              {r.notes}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function AdherenceBar({ score, colors }: { score: number; colors: any }) {
  const color = score >= 80 ? "#059669" : score >= 60 ? "#D97706" : "#DC2626";
  return (
    <View style={styles.barWrap}>
      <View style={[styles.barBg, { backgroundColor: colors.muted }]}>
        <View style={[styles.barFill, { width: `${score}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barLabel, { color, fontFamily: "Manrope_700Bold" }]}>{score}% adherence</Text>
    </View>
  );
}

function EmptyState({ icon, label, colors }: { icon: any; label: string; colors: any }) {
  return (
    <View style={styles.empty}>
      <Feather name={icon} size={48} color={colors.outlineVariant} />
      <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 0 },
  pageTitle: { fontSize: 28, letterSpacing: -0.5, marginBottom: 2 },
  sub: { fontSize: 13, marginBottom: 20 },
  sectionTitle: { fontSize: 14, marginBottom: 10, marginTop: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 10, gap: 12 },
  planRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  planTitle: { fontSize: 14 },
  meta: { fontSize: 12 },
  macroRow: { flexDirection: "row", gap: 6 },
  macro: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: "center" },
  macroVal: { fontSize: 12 },
  macroLabel: { fontSize: 9, textTransform: "uppercase" },
  ring: { alignItems: "center", justifyContent: "center" },
  ringText: {},
  barWrap: { gap: 4 },
  barBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  barLabel: { fontSize: 11 },
  labRow: { flexDirection: "row", gap: 12 },
  labTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  testName: { fontSize: 15 },
  flagBadge: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  flagText: { fontSize: 9, letterSpacing: 0.3 },
  valueRow: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  value: { fontSize: 18 },
  range: { fontSize: 11 },
  notes: { fontSize: 12, fontStyle: "italic" },
  errText: { textAlign: "center", marginTop: 24 },
  empty: { alignItems: "center", gap: 12, marginTop: 60 },
  emptyText: { fontSize: 15 },
});

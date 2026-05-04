import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRider } from "@/context/RiderContext";
import { useColors } from "@/hooks/useColors";

const WEEK = [
  { day: "Mon", amount: 4200 },
  { day: "Tue", amount: 6100 },
  { day: "Wed", amount: 3500 },
  { day: "Thu", amount: 7600 },
  { day: "Fri", amount: 5200 },
  { day: "Sat", amount: 6800 },
  { day: "Sun", amount: 0 },
];

export default function RiderEarningsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { todayEarnings, todayDeliveries, rider } = useRider();
  const max = Math.max(...WEEK.map((d) => d.amount), 1);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16, paddingBottom: insets.bottom + 100 }]}
    >
      <Text style={[styles.title, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Earnings</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>Your delivery payouts</Text>

      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <Text style={[styles.heroLabel, { fontFamily: "Manrope_600SemiBold" }]}>Today</Text>
        <Text style={[styles.heroValue, { fontFamily: "Epilogue_700Bold" }]}>₦{todayEarnings.toLocaleString()}</Text>
        <Text style={[styles.heroSub, { fontFamily: "Manrope_400Regular" }]}>{todayDeliveries} completed deliveries</Text>
      </View>

      <View style={styles.statRow}>
        <SmallStat label="Rating" value={`${rider?.rating ?? 0}`} icon="star" tone="#D97706" />
        <SmallStat label="All-time" value={`${rider?.totalDeliveries ?? 0}`} icon="truck" tone={colors.primary} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Weekly Trend</Text>
        <View style={styles.chart}>
          {WEEK.map((d) => (
            <View key={d.day} style={styles.barCol}>
              <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
                <View style={[styles.bar, { height: `${Math.max(8, (d.amount / max) * 100)}%` as any, backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.day, { color: colors.outline, fontFamily: "Manrope_600SemiBold" }]}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Payout</Text>
        <InfoRow label="Next payout" value="Friday, 6 PM" icon="calendar" />
        <InfoRow label="Method" value="Bank transfer" icon="credit-card" />
        <InfoRow label="Commission" value="10% per order" icon="percent" />
      </View>
    </ScrollView>
  );
}

function SmallStat({ label, value, icon, tone }: { label: string; value: string; icon: keyof typeof Feather.glyphMap; tone: string }) {
  return (
    <View style={[styles.smallStat, { backgroundColor: tone + "12", borderColor: tone + "30" }]}>
      <Feather name={icon} size={18} color={tone} />
      <Text style={[styles.smallValue, { color: tone, fontFamily: "Epilogue_700Bold" }]}>{value}</Text>
      <Text style={[styles.smallLabel, { color: tone, fontFamily: "Manrope_600SemiBold" }]}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: keyof typeof Feather.glyphMap }) {
  const colors = useColors();
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={16} color={colors.primary} />
      <Text style={[styles.infoLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.onSurface, fontFamily: "Manrope_700Bold" }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { fontSize: 28 },
  sub: { fontSize: 13, marginTop: 2, marginBottom: 18 },
  hero: { borderRadius: 22, padding: 22, marginBottom: 14 },
  heroLabel: { color: "#ffffffCC", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  heroValue: { color: "#fff", fontSize: 36, marginTop: 6 },
  heroSub: { color: "#ffffffCC", fontSize: 13, marginTop: 3 },
  statRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  smallStat: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 15, gap: 5 },
  smallValue: { fontSize: 24 },
  smallLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, marginBottom: 14 },
  chart: { height: 160, flexDirection: "row", alignItems: "flex-end", gap: 10 },
  barCol: { flex: 1, alignItems: "center", gap: 8 },
  barTrack: { width: "100%", height: 120, borderRadius: 999, overflow: "hidden", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 999 },
  day: { fontSize: 10 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  infoLabel: { flex: 1, fontSize: 13 },
  infoValue: { fontSize: 13 },
});

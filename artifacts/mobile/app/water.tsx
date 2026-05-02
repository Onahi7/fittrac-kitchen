import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const WATER_GOAL = 8;

const HYDRATION_TIPS = [
  { icon: "sun" as const, tip: "Drink a glass first thing in the morning to kickstart metabolism" },
  { icon: "coffee" as const, tip: "Add 1 extra glass for every 30 minutes of exercise" },
  { icon: "droplet" as const, tip: "Zobo and unsweetened hibiscus tea count toward your daily intake" },
  { icon: "heart" as const, tip: "Proper hydration supports kidney health and helps lower blood pressure" },
];

export default function WaterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { waterLogs, logWater, todayWater } = useApp();

  const sorted7 = [...waterLogs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  const pct = Math.min(todayWater / WATER_GOAL, 1);
  const remaining = Math.max(WATER_GOAL - todayWater, 0);

  const handleTap = async (glass: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newCount = glass + 1 === todayWater ? glass : glass + 1;
    const toggle = todayWater > glass ? glass : glass + 1;
    await logWater(toggle);
  };

  const handlePlus = async () => {
    if (todayWater >= WATER_GOAL) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await logWater(todayWater + 1);
  };

  const handleMinus = async () => {
    if (todayWater <= 0) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await logWater(todayWater - 1);
  };

  const weekAvg = sorted7.length > 0
    ? Math.round(sorted7.reduce((s, l) => s + l.glasses, 0) / sorted7.length)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, {
        paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
        backgroundColor: colors.background,
      }]}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: colors.surfaceContainer }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
            HYDRATION TRACKER
          </Text>
          <Text style={[styles.headerTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Water Intake
          </Text>
        </View>
        <View style={[styles.avgBadge, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[styles.avgLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>7-day avg</Text>
          <Text style={[styles.avgValue, { color: colors.primary, fontFamily: "Manrope_700Bold" }]}>{weekAvg}g</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[
        styles.scroll,
        { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40 },
      ]}>
        <View style={[styles.mainCard, { backgroundColor: "#EBF4FF" }]}>
          <View style={styles.counterRow}>
            <Pressable
              style={[styles.counterBtn, { backgroundColor: "#fff" }]}
              onPress={handleMinus}
              disabled={todayWater === 0}
            >
              <Feather name="minus" size={22} color={todayWater === 0 ? "#C2C9BB" : "#3B8BE0"} />
            </Pressable>

            <View style={styles.counterCenter}>
              <Text style={[styles.counterNum, { color: "#1A3A5C", fontFamily: "Epilogue_700Bold" }]}>
                {todayWater}
              </Text>
              <Text style={[styles.counterSub, { color: "#3B8BE0", fontFamily: "Manrope_500Medium" }]}>
                / {WATER_GOAL} glasses
              </Text>
              {remaining > 0 ? (
                <Text style={[styles.counterNote, { color: "#5A7A9A", fontFamily: "Manrope_400Regular" }]}>
                  {remaining} more to reach your goal
                </Text>
              ) : (
                <Text style={[styles.counterNote, { color: "#2D7A4F", fontFamily: "Manrope_700Bold" }]}>
                  🎉 Daily goal reached!
                </Text>
              )}
            </View>

            <Pressable
              style={[styles.counterBtn, { backgroundColor: "#3B8BE0" }]}
              onPress={handlePlus}
              disabled={todayWater >= WATER_GOAL}
            >
              <Feather name="plus" size={22} color="#fff" />
            </Pressable>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: "#BFDBFE" }]}>
            <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: "#3B8BE0" }]} />
          </View>
        </View>

        <View style={[styles.glassGrid]}>
          {Array.from({ length: WATER_GOAL }, (_, i) => {
            const filled = i < todayWater;
            return (
              <Pressable
                key={i}
                style={[
                  styles.glassCup,
                  {
                    backgroundColor: filled ? "#3B8BE0" : colors.card,
                    borderColor: filled ? "#3B8BE0" : colors.border,
                  },
                ]}
                onPress={() => handleTap(i)}
              >
                <Feather
                  name="droplet"
                  size={28}
                  color={filled ? "#fff" : colors.outlineVariant}
                />
                <Text style={[
                  styles.glassNum,
                  {
                    color: filled ? "rgba(255,255,255,0.8)" : colors.mutedForeground,
                    fontFamily: "Manrope_500Medium",
                  }
                ]}>
                  {i + 1}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            7-Day History
          </Text>
          <View style={styles.historyRow}>
            {sorted7.map((log, i) => {
              const d = new Date(log.date + "T12:00:00");
              const dayLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
              const isToday = i === sorted7.length - 1;
              const filledPct = Math.min(log.glasses / WATER_GOAL, 1);
              return (
                <View key={log.date} style={styles.historyDay}>
                  <View style={[styles.historyBarTrack, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <View style={[
                      styles.historyBarFill,
                      {
                        height: `${filledPct * 100}%`,
                        backgroundColor: isToday ? "#3B8BE0" : "#93C5FD",
                      }
                    ]} />
                  </View>
                  <Text style={[styles.historyCount, {
                    color: isToday ? "#3B8BE0" : colors.mutedForeground,
                    fontFamily: isToday ? "Manrope_700Bold" : "Manrope_400Regular",
                  }]}>
                    {log.glasses}
                  </Text>
                  <Text style={[styles.historyDay2, {
                    color: isToday ? "#3B8BE0" : colors.mutedForeground,
                    fontFamily: isToday ? "Manrope_700Bold" : "Manrope_400Regular",
                  }]}>
                    {dayLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Hydration Tips
          </Text>
          {HYDRATION_TIPS.map((tip, i) => (
            <View key={i} style={[styles.tipRow, { borderBottomColor: colors.surfaceContainerHigh, borderBottomWidth: i < HYDRATION_TIPS.length - 1 ? 1 : 0 }]}>
              <View style={[styles.tipIcon, { backgroundColor: "#EBF4FF" }]}>
                <Feather name={tip.icon} size={16} color="#3B8BE0" />
              </View>
              <Text style={[styles.tipText, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}>
                {tip.tip}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "flex-start", gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginTop: 4 },
  headerLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontSize: 26, lineHeight: 32 },
  avgBadge: { padding: 10, borderRadius: 12, alignItems: "center" },
  avgLabel: { fontSize: 10 },
  avgValue: { fontSize: 16 },
  scroll: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
  mainCard: { borderRadius: 24, padding: 24, gap: 20 },
  counterRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  counterBtn: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  counterCenter: { flex: 1, alignItems: "center", gap: 4 },
  counterNum: { fontSize: 72, lineHeight: 76 },
  counterSub: { fontSize: 16 },
  counterNote: { fontSize: 13, textAlign: "center", marginTop: 2 },
  progressTrack: { height: 10, borderRadius: 5, overflow: "hidden" },
  progressFill: { height: 10, borderRadius: 5 },
  glassGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  glassCup: {
    width: "22%", aspectRatio: 0.9,
    borderRadius: 16, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
    gap: 4,
  },
  glassNum: { fontSize: 11 },
  section: { borderRadius: 20, padding: 18, gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  sectionTitle: { fontSize: 19 },
  historyRow: { flexDirection: "row", gap: 8, alignItems: "flex-end", height: 100 },
  historyDay: { flex: 1, alignItems: "center", gap: 4, height: "100%" },
  historyBarTrack: { flex: 1, width: "100%", borderRadius: 4, overflow: "hidden", justifyContent: "flex-end" },
  historyBarFill: { width: "100%", borderRadius: 4 },
  historyCount: { fontSize: 11 },
  historyDay2: { fontSize: 10 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12 },
  tipIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19 },
});

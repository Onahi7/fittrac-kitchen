import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const CALORIE_GOAL = 2000;
const PROTEIN_GOAL = 120;
const CARB_GOAL = 200;
const FAT_GOAL = 65;
const FIBER_GOAL = 30;

function MiniBarChart({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  const colors = useColors();
  const max = Math.max(...data, 1);
  const CHART_HEIGHT = 64;

  return (
    <View style={[miniChartStyles.container, { height: CHART_HEIGHT + 20 }]}>
      {data.map((val, i) => (
        <View key={i} style={miniChartStyles.barWrapper}>
          <View style={[miniChartStyles.barTrack, { height: CHART_HEIGHT, backgroundColor: colors.surfaceContainerHigh }]}>
            <View
              style={[
                miniChartStyles.barFill,
                {
                  height: (val / max) * CHART_HEIGHT,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
          <Text style={[miniChartStyles.dayLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            {["M", "T", "W", "T", "F", "S", "S"][i % 7]}
          </Text>
        </View>
      ))}
    </View>
  );
}

const miniChartStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  barWrapper: { flex: 1, alignItems: "center", gap: 4 },
  barTrack: { width: "100%", borderRadius: 4, justifyContent: "flex-end" },
  barFill: { width: "100%", borderRadius: 4 },
  dayLabel: { fontSize: 9, letterSpacing: 0.3 },
});

function MacroBar({
  label,
  current,
  goal,
  color,
}: {
  label: string;
  current: number;
  goal: number;
  color: string;
}) {
  const colors = useColors();
  const pct = Math.min(current / goal, 1);
  return (
    <View style={macroStyles.row}>
      <View style={macroStyles.labelRow}>
        <Text style={[macroStyles.label, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
          {label}
        </Text>
        <Text style={[macroStyles.value, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
          {current}g
          <Text style={{ color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }}>
            /{goal}g
          </Text>
        </Text>
      </View>
      <View style={[macroStyles.track, { backgroundColor: colors.surfaceContainerHigh }]}>
        <View
          style={[
            macroStyles.fill,
            { width: `${pct * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const macroStyles = StyleSheet.create({
  row: { gap: 6 },
  labelRow: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 12 },
  value: { fontSize: 12 },
  track: { height: 7, borderRadius: 4, overflow: "hidden" },
  fill: { height: 7, borderRadius: 4 },
});

export default function HealthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { weightLogs, nutritionLogs, currentWeight, todayNutrition, logWeight, orders } = useApp();

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState(
    currentWeight?.toString() ?? "72.0"
  );
  const [saving, setSaving] = useState(false);

  const sorted7 = [...weightLogs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  const chartWeights = sorted7.map((l) => l.weight);
  while (chartWeights.length < 7) chartWeights.unshift(chartWeights[0] ?? 72);

  const sorted7Nutrition = [...nutritionLogs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);
  const chartCalories = sorted7Nutrition.map((l) => l.calories);
  while (chartCalories.length < 7) chartCalories.unshift(chartCalories[0] ?? 1800);

  const startWeight = sorted7[0]?.weight ?? currentWeight ?? 72;
  const latestWeight = currentWeight ?? 72;
  const weightChange = parseFloat((latestWeight - startWeight).toFixed(1));
  const bmi = currentWeight
    ? parseFloat(((currentWeight) / (1.72 * 1.72)).toFixed(1))
    : 24.1;

  const streak = orders.length + 3;

  const todayCal = todayNutrition?.calories ?? 0;
  const todayProtein = todayNutrition?.protein ?? 0;
  const todayCarbs = todayNutrition?.carbs ?? 0;
  const todayFat = todayNutrition?.fat ?? 0;
  const todayFiber = todayNutrition?.fiber ?? 0;

  const avgWeeklyCalories =
    sorted7Nutrition.length > 0
      ? Math.round(sorted7Nutrition.reduce((s, l) => s + l.calories, 0) / sorted7Nutrition.length)
      : 1780;

  const handleLogWeight = async () => {
    const w = parseFloat(weightInput);
    if (isNaN(w) || w < 30 || w > 250) return;
    setSaving(true);
    await logWeight(w);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false);
    setShowWeightModal(false);
  };

  const adjustWeight = (delta: number) => {
    const w = parseFloat(weightInput) || (currentWeight ?? 72);
    const newW = parseFloat((w + delta).toFixed(1));
    setWeightInput(newW.toString());
  };

  const bmiCategory =
    bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy" : bmi < 30 ? "Overweight" : "Obese";
  const bmiColor =
    bmi < 18.5 ? colors.secondary : bmi < 25 ? colors.primary : colors.secondary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View>
          <Text style={[styles.headerLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
            YOUR HEALTH JOURNEY
          </Text>
          <Text style={[styles.headerTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Track & Improve
          </Text>
        </View>
        <View style={[styles.streakBadge, { backgroundColor: colors.tertiaryFixed }]}>
          <Feather name="zap" size={13} color={colors.tertiary} />
          <Text style={[styles.streakText, { color: colors.tertiary, fontFamily: "Manrope_700Bold" }]}>
            {streak} day streak
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90,
          },
        ]}
      >
        <View style={styles.statsRow}>
          {[
            {
              label: "WEIGHT",
              value: `${latestWeight}`,
              unit: "kg",
              icon: "activity" as const,
              sub: weightChange !== 0 ? `${weightChange > 0 ? "+" : ""}${weightChange} this week` : "No change",
              color: colors.primary,
            },
            {
              label: "BMI",
              value: `${bmi}`,
              unit: "",
              icon: "bar-chart-2" as const,
              sub: bmiCategory,
              color: bmiColor,
            },
            {
              label: "CALORIES",
              value: `${todayCal || avgWeeklyCalories}`,
              unit: "kcal",
              icon: "sun" as const,
              sub: todayCal ? "Today" : "Avg/day",
              color: colors.secondary,
            },
          ].map((stat) => (
            <View
              key={stat.label}
              style={[styles.statCard, { backgroundColor: colors.card }]}
            >
              <View style={[styles.statIcon, { backgroundColor: colors.surfaceContainer }]}>
                <Feather name={stat.icon} size={14} color={stat.color} />
              </View>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
                {stat.label}
              </Text>
              <Text style={[styles.statValue, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
                {stat.value}
                <Text style={{ fontSize: 12, fontFamily: "Manrope_400Regular", color: colors.mutedForeground }}>
                  {stat.unit}
                </Text>
              </Text>
              <Text style={[styles.statSub, { color: stat.color, fontFamily: "Manrope_400Regular" }]}>
                {stat.sub}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
                Weight Tracker
              </Text>
              <Text style={[styles.sectionSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                7-day trend
              </Text>
            </View>
            <Pressable
              style={[styles.logBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setWeightInput(currentWeight?.toString() ?? "72.0");
                setShowWeightModal(true);
              }}
            >
              <Feather name="plus" size={14} color="#fff" />
              <Text style={[styles.logBtnText, { fontFamily: "Manrope_600SemiBold" }]}>
                Log Weight
              </Text>
            </Pressable>
          </View>

          <MiniBarChart data={chartWeights} color={colors.primary} />

          <View style={styles.weightStats}>
            {[
              { label: "Start", value: `${sorted7[0]?.weight ?? latestWeight} kg` },
              { label: "Current", value: `${latestWeight} kg` },
              { label: "Change", value: `${weightChange > 0 ? "+" : ""}${weightChange} kg` },
              { label: "Goal", value: "72.0 kg" },
            ].map((s) => (
              <View key={s.label} style={styles.weightStat}>
                <Text style={[styles.weightStatLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                  {s.label}
                </Text>
                <Text style={[styles.weightStatValue, { color: colors.onSurface, fontFamily: "Manrope_700Bold" }]}>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
                Daily Nutrition
              </Text>
              <Text style={[styles.sectionSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                {todayNutrition ? "Today's intake" : "Avg based on orders"}
              </Text>
            </View>
            <View
              style={[
                styles.caloriePill,
                {
                  backgroundColor:
                    todayCal > 0 ? colors.surfaceContainer : colors.tertiaryFixed,
                },
              ]}
            >
              <Text
                style={[
                  styles.caloriePillText,
                  {
                    color: todayCal > 0 ? colors.onSurface : colors.tertiary,
                    fontFamily: "Epilogue_700Bold",
                  },
                ]}
              >
                {todayCal || avgWeeklyCalories}
              </Text>
              <Text
                style={[
                  styles.caloriePillSub,
                  {
                    color: todayCal > 0 ? colors.mutedForeground : colors.tertiary,
                    fontFamily: "Manrope_400Regular",
                  },
                ]}
              >
                / {CALORIE_GOAL} kcal
              </Text>
            </View>
          </View>

          <View
            style={[styles.calorieTrack, { backgroundColor: colors.surfaceContainerHigh }]}
          >
            <View
              style={[
                styles.calorieFill,
                {
                  width: `${Math.min(((todayCal || avgWeeklyCalories) / CALORIE_GOAL) * 100, 100)}%`,
                  backgroundColor:
                    (todayCal || avgWeeklyCalories) > CALORIE_GOAL
                      ? colors.destructive
                      : colors.primary,
                },
              ]}
            />
          </View>

          <View style={styles.macros}>
            <MacroBar
              label="Protein"
              current={todayProtein || 88}
              goal={PROTEIN_GOAL}
              color={colors.primary}
            />
            <MacroBar
              label="Carbohydrates"
              current={todayCarbs || 165}
              goal={CARB_GOAL}
              color={colors.secondary}
            />
            <MacroBar
              label="Fat"
              current={todayFat || 52}
              goal={FAT_GOAL}
              color={colors.tertiaryContainer}
            />
            <MacroBar
              label="Fibre"
              current={todayFiber || 18}
              goal={FIBER_GOAL}
              color="#6B9E6B"
            />
          </View>

          {orders.length > 0 && (
            <View
              style={[
                styles.ordersNote,
                { backgroundColor: colors.surfaceContainerLow },
              ]}
            >
              <Feather name="shopping-bag" size={12} color={colors.mutedForeground} />
              <Text style={[styles.ordersNoteText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                Auto-calculated from your {orders.length} Fittrac orders
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
                Health Trends
              </Text>
              <Text style={[styles.sectionSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                Calories this week
              </Text>
            </View>
            <View style={[styles.trendPill, { backgroundColor: colors.surfaceContainer }]}>
              <Text style={[styles.trendPillText, { color: colors.primary, fontFamily: "Manrope_700Bold" }]}>
                ↓ On track
              </Text>
            </View>
          </View>

          <MiniBarChart data={chartCalories} color={colors.secondary} />

          <View style={styles.trendsGrid}>
            {[
              {
                label: "Avg Daily Calories",
                value: `${avgWeeklyCalories} kcal`,
                icon: "trending-down" as const,
                positive: true,
              },
              {
                label: "Weekly Protein Avg",
                value: `${Math.round(sorted7Nutrition.reduce((s, l) => s + l.protein, 0) / Math.max(sorted7Nutrition.length, 1) || 88)}g`,
                icon: "award" as const,
                positive: true,
              },
              {
                label: "Sodium Adherence",
                value: "87%",
                icon: "heart" as const,
                positive: true,
              },
              {
                label: "GI Score",
                value: "Low",
                icon: "activity" as const,
                positive: true,
              },
            ].map((t) => (
              <View
                key={t.label}
                style={[
                  styles.trendItem,
                  { backgroundColor: colors.surfaceContainerLow },
                ]}
              >
                <View style={[styles.trendIcon, { backgroundColor: t.positive ? "#E8F5E9" : "#FFEBEE" }]}>
                  <Feather
                    name={t.icon}
                    size={14}
                    color={t.positive ? colors.primary : colors.destructive}
                  />
                </View>
                <Text style={[styles.trendValue, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
                  {t.value}
                </Text>
                <Text style={[styles.trendLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                  {t.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.wellnessCard,
            {
              backgroundColor: colors.primaryContainer,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={() => router.push("/wellness")}
        >
          <View style={styles.wellnessLeft}>
            <Text style={[styles.wellnessLabel, { color: colors.onPrimaryContainer, fontFamily: "Manrope_600SemiBold" }]}>
              WELLNESS TEAM
            </Text>
            <Text style={[styles.wellnessTitle, { color: "#fff", fontFamily: "Epilogue_700Bold" }]}>
              Book a Specialist Consultation
            </Text>
            <Text style={[styles.wellnessSub, { color: colors.onPrimaryContainer, fontFamily: "Manrope_400Regular" }]}>
              Nutritionists, dietitians & health coaches available this week
            </Text>
          </View>
          <View style={[styles.wellnessArrow, { backgroundColor: "#fff" }]}>
            <Feather name="arrow-right" size={18} color={colors.primary} />
          </View>
        </Pressable>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Condition Insights
          </Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            Based on your Fittrac meals
          </Text>

          <View style={styles.insightsList}>
            {[
              {
                icon: "heart" as const,
                title: "Blood Pressure Support",
                detail: "87% of your meals this week were Low Sodium rated",
                color: "#BA1A1A",
                bg: "#FFEBEE",
              },
              {
                icon: "activity" as const,
                title: "Glycaemic Control",
                detail: "92% of meals had Low or Medium glycaemic index",
                color: colors.primary,
                bg: "#E8F5E9",
              },
              {
                icon: "shield" as const,
                title: "Liver Detox Score",
                detail: "Bitter leaf & turmeric detected in 5 of 7 meals",
                color: colors.secondary,
                bg: "#FFF3E0",
              },
            ].map((ins) => (
              <View
                key={ins.title}
                style={[styles.insightCard, { backgroundColor: colors.surfaceContainerLow }]}
              >
                <View style={[styles.insightIcon, { backgroundColor: ins.bg }]}>
                  <Feather name={ins.icon} size={16} color={ins.color} />
                </View>
                <View style={styles.insightText}>
                  <Text style={[styles.insightTitle, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
                    {ins.title}
                  </Text>
                  <Text style={[styles.insightDetail, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                    {ins.detail}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showWeightModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWeightModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowWeightModal(false)}
        >
          <Pressable
            style={[styles.modalSheet, { backgroundColor: colors.background }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHandle, { backgroundColor: colors.outlineVariant }]} />
            <Text style={[styles.modalTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
              Log Today's Weight
            </Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
              Weigh yourself first thing in the morning for consistency
            </Text>

            <View style={styles.weightInputRow}>
              <Pressable
                style={[styles.adjustBtn, { backgroundColor: colors.surfaceContainer }]}
                onPress={() => adjustWeight(-0.5)}
              >
                <Feather name="minus" size={20} color={colors.onSurface} />
              </Pressable>
              <View style={[styles.weightInputBox, { backgroundColor: colors.surfaceContainerLow }]}>
                <TextInput
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="decimal-pad"
                  style={[styles.weightInputText, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}
                  selectTextOnFocus
                />
                <Text style={[styles.weightUnit, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                  kg
                </Text>
              </View>
              <Pressable
                style={[styles.adjustBtn, { backgroundColor: colors.surfaceContainer }]}
                onPress={() => adjustWeight(0.5)}
              >
                <Feather name="plus" size={20} color={colors.onSurface} />
              </Pressable>
            </View>

            <Pressable
              style={[styles.saveWeightBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
              onPress={handleLogWeight}
              disabled={saving}
            >
              <Text style={[styles.saveWeightBtnText, { fontFamily: "Epilogue_700Bold" }]}>
                {saving ? "Saving..." : "Save Weight"}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontSize: 26, lineHeight: 32 },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
  },
  streakText: { fontSize: 13 },
  scroll: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    gap: 4,
    shadowColor: "#1D1B19",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statLabel: { fontSize: 9, letterSpacing: 0.8 },
  statValue: { fontSize: 18, lineHeight: 22 },
  statSub: { fontSize: 10 },
  section: {
    borderRadius: 20,
    padding: 18,
    gap: 14,
    shadowColor: "#1D1B19",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 19 },
  sectionSub: { fontSize: 12, marginTop: 2 },
  logBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 100,
  },
  logBtnText: { color: "#fff", fontSize: 13 },
  weightStats: { flexDirection: "row", justifyContent: "space-between" },
  weightStat: { alignItems: "center", gap: 2 },
  weightStatLabel: { fontSize: 10 },
  weightStatValue: { fontSize: 14 },
  caloriePill: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  caloriePillText: { fontSize: 18 },
  caloriePillSub: { fontSize: 12 },
  calorieTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  calorieFill: { height: 8, borderRadius: 4 },
  macros: { gap: 10 },
  ordersNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    padding: 10,
  },
  ordersNoteText: { fontSize: 12, flex: 1 },
  trendPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  trendPillText: { fontSize: 12 },
  trendsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  trendItem: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  trendIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  trendValue: { fontSize: 18, lineHeight: 22 },
  trendLabel: { fontSize: 11, lineHeight: 16 },
  wellnessCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  wellnessLeft: { flex: 1, gap: 6 },
  wellnessLabel: { fontSize: 10, letterSpacing: 1.5 },
  wellnessTitle: { fontSize: 20, lineHeight: 26 },
  wellnessSub: { fontSize: 13, lineHeight: 18 },
  wellnessArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  insightsList: { gap: 10 },
  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  insightText: { flex: 1, gap: 3 },
  insightTitle: { fontSize: 14 },
  insightDetail: { fontSize: 12, lineHeight: 17 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
    alignItems: "center",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  modalTitle: { fontSize: 24 },
  modalSub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  weightInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginVertical: 8,
  },
  adjustBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  weightInputBox: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 130,
    justifyContent: "center",
  },
  weightInputText: {
    fontSize: 36,
    textAlign: "center",
    minWidth: 80,
  },
  weightUnit: { fontSize: 18 },
  saveWeightBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: "center",
    marginTop: 4,
  },
  saveWeightBtnText: { color: "#fff", fontSize: 17 },
});

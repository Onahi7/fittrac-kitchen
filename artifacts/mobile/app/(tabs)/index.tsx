import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MealCard } from "@/components/MealCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import {
  filterMealsForConditions,
  getTodayMenu,
  getTomorrowMenu,
} from "@/constants/data";

interface DailyQuote { text: string; author: string; category: string; }

const WATER_GOAL = 8;
const CALORIE_GOAL = 2000;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    profile,
    basketCount,
    currentWeight,
    todayNutrition,
    todayWater,
    todayExercise,
    orders,
  } = useApp();

  const todayMenu = getTodayMenu();
  const tomorrowMenu = getTomorrowMenu();

  const curatedMeals = filterMealsForConditions(
    tomorrowMenu.meals,
    profile.conditions
  ).slice(0, 3);

  const displayMeals =
    curatedMeals.length > 0
      ? curatedMeals
      : tomorrowMenu.meals.filter((m) => m.mealType !== "drink").slice(0, 3);

  const drinks = tomorrowMenu.meals.filter((m) => m.mealType === "drink");
  const streak = orders.length + 3;
  const todayCal = todayNutrition?.calories ?? 0;
  const avgCal = 1780;
  const displayCal = todayCal || avgCal;

  const [dailyQuote, setDailyQuote] = useState<DailyQuote | null>(null);

  useEffect(() => {
    fetch("/api/admin/public/daily-quote")
      .then((r) => r.ok ? r.json() : null)
      .then((q) => { if (q?.text) setDailyQuote(q); })
      .catch(() => {});
  }, []);

  const quickActions = [
    { icon: "droplet" as const, label: "Log\nWater", route: "/water", color: "#3B8BE0", bg: "#EBF4FF" },
    { icon: "activity" as const, label: "Log\nExercise", route: "/exercise", color: colors.primary, bg: "#E8F5E9" },
    { icon: "video" as const, label: "Book\nConsult", route: "/wellness", color: colors.secondary, bg: "#FFF3E0" },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.appName, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>
            Fittrac Kitchen
          </Text>
          <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            {todayMenu.day} · {todayMenu.theme}
          </Text>
        </View>
        <Pressable
          style={[styles.bellBtn, { backgroundColor: colors.surfaceContainer }]}
          onPress={() => router.push("/notifications")}
        >
          <Feather name="bell" size={20} color={colors.onSurface} />
          <View style={[styles.bellDot, { backgroundColor: colors.secondary }]} />
        </Pressable>
      </View>

      <Pressable
        style={[styles.healthWidget, { backgroundColor: colors.card }]}
        onPress={() => router.push("/(tabs)/health")}
      >
        <View style={styles.widgetHeader}>
          <Text style={[styles.widgetLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
            TODAY'S HEALTH SNAPSHOT
          </Text>
          <View style={[styles.streakChip, { backgroundColor: colors.tertiaryFixed }]}>
            <Feather name="zap" size={11} color={colors.tertiary} />
            <Text style={[styles.streakText, { color: colors.tertiary, fontFamily: "Manrope_700Bold" }]}>
              {streak}d streak
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: "#E8F5E9" }]}>
              <Feather name="activity" size={14} color={colors.primary} />
            </View>
            <Text style={[styles.statVal, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
              {currentWeight ?? "—"}<Text style={styles.statUnit}>kg</Text>
            </Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
              Weight
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.surfaceContainerHigh }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: "#FFF3E0" }]}>
              <Feather name="sun" size={14} color={colors.secondary} />
            </View>
            <Text style={[styles.statVal, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
              {displayCal}<Text style={styles.statUnit}>kcal</Text>
            </Text>
            <View style={[styles.calBar, { backgroundColor: colors.surfaceContainerHigh }]}>
              <View style={[styles.calFill, { width: `${Math.min((displayCal / CALORIE_GOAL) * 100, 100)}%`, backgroundColor: colors.secondary }]} />
            </View>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.surfaceContainerHigh }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: "#EBF4FF" }]}>
              <Feather name="droplet" size={14} color="#3B8BE0" />
            </View>
            <Text style={[styles.statVal, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
              {todayWater}<Text style={styles.statUnit}>/{WATER_GOAL}</Text>
            </Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
              Glasses
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.surfaceContainerHigh }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: "#FCE4EC" }]}>
              <Feather name="heart" size={14} color="#E91E63" />
            </View>
            <Text style={[styles.statVal, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
              {todayExercise.minutes}<Text style={styles.statUnit}>min</Text>
            </Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
              Active
            </Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          {quickActions.map((qa) => (
            <Pressable
              key={qa.label}
              style={[styles.quickActionBtn, { backgroundColor: qa.bg }]}
              onPress={(e) => {
                e.stopPropagation();
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(qa.route as any);
              }}
            >
              <Feather name={qa.icon} size={18} color={qa.color} />
              <Text style={[styles.quickActionLabel, { color: qa.color, fontFamily: "Manrope_600SemiBold" }]}>
                {qa.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>

      {dailyQuote && (
        <View style={[styles.quoteCard, { backgroundColor: colors.card }]}>
          <View style={styles.quoteTop}>
            <Text style={[styles.quoteLabel, { color: colors.primary, fontFamily: "Manrope_600SemiBold" }]}>
              ☀️  DAILY QUOTE
            </Text>
          </View>
          <Text style={[styles.quoteText, { color: colors.onSurface, fontFamily: "Manrope_500Medium" }]}>
            "{dailyQuote.text}"
          </Text>
          <Text style={[styles.quoteAuthor, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            — {dailyQuote.author}
          </Text>
        </View>
      )}

      <View
        style={[styles.themeBanner, { backgroundColor: colors.primaryContainer }]}
      >
        <Text style={[styles.themeCurrent, { color: colors.onPrimaryContainer, fontFamily: "Manrope_500Medium" }]}>
          CURRENT THEME
        </Text>
        <Text style={[styles.themeDay, { color: "#fff", fontFamily: "Epilogue_700Bold" }]}>
          {todayMenu.day}: {todayMenu.theme.split(" ").slice(0, 2).join(" ")}
        </Text>
        <Text style={[styles.themeSubtitle, { color: "#9DD090", fontFamily: "Epilogue_700Bold" }]}>
          {todayMenu.theme.split(" ").slice(2).join(" ")}
        </Text>
        <Text style={[styles.themeDesc, { color: colors.onPrimaryContainer, fontFamily: "Manrope_400Regular" }]}>
          {todayMenu.themeDescription}
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.preorderBanner,
          { backgroundColor: colors.tertiaryFixed, opacity: pressed ? 0.85 : 1 },
        ]}
        onPress={() => router.push("/(tabs)/menu")}
      >
        <View>
          <Text style={[styles.preorderLabel, { color: colors.tertiary, fontFamily: "Manrope_600SemiBold" }]}>
            PRE-ORDER FOR TOMORROW
          </Text>
          <Text style={[styles.preorderTitle, { color: colors.tertiary, fontFamily: "Epilogue_700Bold" }]}>
            Secure your health goals with {tomorrowMenu.day}'s Wellness Box
          </Text>
        </View>
        <Pressable
          style={[styles.planBtn, { backgroundColor: colors.secondary }]}
          onPress={() => router.push("/(tabs)/menu")}
        >
          <Text style={[styles.planBtnText, { color: "#fff", fontFamily: "Manrope_700Bold" }]}>
            Plan Tomorrow
          </Text>
        </Pressable>
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
          Curated For You
        </Text>
        <Pressable onPress={() => router.push("/(tabs)/menu")}>
          <Text style={[styles.viewAll, { color: colors.primary, fontFamily: "Manrope_600SemiBold" }]}>
            View Full Menu
          </Text>
        </Pressable>
      </View>

      {displayMeals.map((meal) => (
        <MealCard key={meal.id} meal={meal} />
      ))}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
          Apothecary Drinks
        </Text>
      </View>

      {drinks.map((meal) => (
        <MealCard key={meal.id} meal={meal} />
      ))}

      <View style={[styles.nutritionCard, { backgroundColor: colors.surfaceContainer }]}>
        <View style={styles.nutritionHeader}>
          <Text style={[styles.nutritionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Daily Balance
          </Text>
          <Text style={[styles.nutritionSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            {todayMenu.day.toUpperCase()} NUTRITIONAL PROGRESS
          </Text>
        </View>
        {[
          { label: "PROTEIN INTAKE", pct: (todayNutrition?.protein ?? 88) / 120, color: colors.primary },
          { label: "FIBER GOAL", pct: (todayNutrition?.fiber ?? 18) / 30, color: colors.secondary },
          { label: "MICRONUTRIENTS", pct: 0.92, color: colors.tertiaryContainer },
        ].map((item) => (
          <View key={item.label} style={styles.nutritionRow}>
            <View style={styles.nutritionLabelRow}>
              <Text style={[styles.nutritionLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
                {item.label}
              </Text>
              <Text style={[styles.nutritionPct, { color: item.color, fontFamily: "Manrope_700Bold" }]}>
                {Math.round(item.pct * 100)}%
              </Text>
            </View>
            <View style={[styles.barTrack, { backgroundColor: colors.surfaceContainerHigh }]}>
              <View style={[styles.barFill, { width: `${Math.min(item.pct * 100, 100)}%`, backgroundColor: item.color }]} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 0 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  appName: { fontSize: 18, lineHeight: 24 },
  greeting: { fontSize: 13, marginTop: 2 },
  bellBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  bellDot: {
    position: "absolute",
    top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    borderWidth: 1.5, borderColor: "#FFF8F4",
  },
  healthWidget: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    shadowColor: "#1D1B19",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  widgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  widgetLabel: { fontSize: 10, letterSpacing: 1.2 },
  streakChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  streakText: { fontSize: 12 },
  statsGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  statDivider: { width: 1, alignSelf: "stretch", marginVertical: 4 },
  statIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    marginBottom: 2,
  },
  statVal: { fontSize: 15, lineHeight: 20 },
  statUnit: { fontSize: 10, fontFamily: "Manrope_400Regular" },
  statLbl: { fontSize: 10, textAlign: "center" },
  calBar: { width: "80%", height: 4, borderRadius: 2, overflow: "hidden" },
  calFill: { height: 4, borderRadius: 2 },
  quickActions: { flexDirection: "row", gap: 8 },
  quickActionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  quickActionLabel: { fontSize: 11, textAlign: "center", lineHeight: 14 },
  themeBanner: {
    borderRadius: 20, padding: 20, gap: 4, marginBottom: 12,
  },
  themeCurrent: { fontSize: 10, letterSpacing: 1.5 },
  themeDay: { fontSize: 28, lineHeight: 32 },
  themeSubtitle: { fontSize: 22, lineHeight: 28 },
  themeDesc: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  preorderBanner: {
    borderRadius: 20, padding: 20, gap: 12, marginBottom: 24,
  },
  preorderLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 4 },
  preorderTitle: { fontSize: 16, lineHeight: 22 },
  planBtn: {
    alignSelf: "flex-start", paddingHorizontal: 20,
    paddingVertical: 10, borderRadius: 100,
  },
  planBtnText: { fontSize: 14 },
  sectionHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 16, marginTop: 4,
  },
  sectionTitle: { fontSize: 22 },
  viewAll: { fontSize: 14 },
  nutritionCard: { borderRadius: 20, padding: 20, gap: 14, marginTop: 8 },
  nutritionHeader: { gap: 2 },
  nutritionTitle: { fontSize: 20 },
  nutritionSub: { fontSize: 11, letterSpacing: 1 },
  nutritionRow: { gap: 6 },
  nutritionLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  nutritionLabel: { fontSize: 11, letterSpacing: 0.8 },
  nutritionPct: { fontSize: 11 },
  barTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  quoteCard: {
    borderRadius: 20, padding: 18, marginBottom: 12, gap: 8,
    shadowColor: "#1D1B19", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  quoteTop: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  quoteLabel: { fontSize: 10, letterSpacing: 1.4 },
  quoteText: { fontSize: 15, lineHeight: 22, fontStyle: "italic" },
  quoteAuthor: { fontSize: 12, lineHeight: 16 },
});

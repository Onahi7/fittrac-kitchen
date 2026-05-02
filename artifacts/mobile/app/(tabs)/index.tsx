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
import { MealCard } from "@/components/MealCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import {
  filterMealsForConditions,
  getTodayMenu,
  getTomorrowMenu,
} from "@/constants/data";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, basketCount } = useApp();

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
            NaijaHealth Kitchen
          </Text>
          <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            {todayMenu.day} · {todayMenu.theme}
          </Text>
        </View>
        <Pressable
          style={[styles.bellBtn, { backgroundColor: colors.surfaceContainer }]}
          onPress={() => {}}
        >
          <Feather name="bell" size={20} color={colors.onSurface} />
        </Pressable>
      </View>

      <View
        style={[styles.themeBanner, { backgroundColor: colors.primaryContainer }]}
      >
        <Text style={[styles.themeCurrent, { color: colors.onPrimaryContainer, fontFamily: "Manrope_500Medium" }]}>
          CURRENT THEME
        </Text>
        <Text style={[styles.themeDay, { color: "#fff", fontFamily: "Epilogue_700Bold" }]}>
          {todayMenu.day}: {todayMenu.theme.split(" ").slice(0, 2).join(" ")}
        </Text>
        <Text style={[styles.themeSubtitle, { color: colors.onPrimaryContainer, fontFamily: "Epilogue_700Bold" }]}>
          {todayMenu.theme.split(" ").slice(2).join(" ")}
        </Text>
        <Text style={[styles.themeDesc, { color: colors.onPrimaryContainer, fontFamily: "Manrope_400Regular" }]}>
          {todayMenu.themeDescription}
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.preorderBanner,
          {
            backgroundColor: colors.tertiaryFixed,
            opacity: pressed ? 0.85 : 1,
          },
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
          Curated Meals
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

      <View
        style={[
          styles.nutritionCard,
          { backgroundColor: colors.surfaceContainer },
        ]}
      >
        <View style={styles.nutritionHeader}>
          <Text style={[styles.nutritionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Daily Balance
          </Text>
          <Text style={[styles.nutritionSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            {todayMenu.day.toUpperCase()} NUTRITIONAL PROGRESS
          </Text>
        </View>
        {[
          { label: "PROTEIN INTAKE", pct: 0.75, color: colors.primary },
          { label: "FIBER GOAL", pct: 0.4, color: colors.secondary },
          { label: "MICRONUTRIENTS", pct: 0.92, color: colors.tertiaryContainer },
        ].map((item) => (
          <View key={item.label} style={styles.nutritionRow}>
            <Text style={[styles.nutritionLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
              {item.label}
            </Text>
            <View
              style={[styles.barTrack, { backgroundColor: colors.surfaceContainerHigh }]}
            >
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${item.pct * 100}%`,
                    backgroundColor: item.color,
                  },
                ]}
              />
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
    marginBottom: 20,
  },
  appName: { fontSize: 18, lineHeight: 24 },
  greeting: { fontSize: 13, marginTop: 2 },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  themeBanner: {
    borderRadius: 20,
    padding: 20,
    gap: 4,
    marginBottom: 12,
  },
  themeCurrent: { fontSize: 10, letterSpacing: 1.5 },
  themeDay: { fontSize: 28, lineHeight: 32 },
  themeSubtitle: { fontSize: 22, lineHeight: 28, color: "#9DD090" },
  themeDesc: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  preorderBanner: {
    borderRadius: 20,
    padding: 20,
    gap: 12,
    marginBottom: 24,
  },
  preorderLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 4 },
  preorderTitle: { fontSize: 16, lineHeight: 22 },
  planBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
  },
  planBtnText: { fontSize: 14 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 22 },
  viewAll: { fontSize: 14 },
  nutritionCard: {
    borderRadius: 20,
    padding: 20,
    gap: 14,
    marginTop: 8,
  },
  nutritionHeader: { gap: 2 },
  nutritionTitle: { fontSize: 20 },
  nutritionSub: { fontSize: 11, letterSpacing: 1 },
  nutritionRow: { gap: 6 },
  nutritionLabel: { fontSize: 11, letterSpacing: 0.8 },
  barTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
});

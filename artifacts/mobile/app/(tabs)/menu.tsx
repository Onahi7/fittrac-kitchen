import React, { useState } from "react";
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
import { getTomorrowMenu } from "@/constants/data";
import type { MealType } from "@/constants/types";

const TABS: { id: MealType | "all"; label: string }[] = [
  { id: "all", label: "All Dishes" },
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "drink", label: "Drinks" },
];

export default function MenuScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useApp();
  const [activeTab, setActiveTab] = useState<MealType | "all">("all");

  const tomorrowMenu = getTomorrowMenu();

  const filtered =
    activeTab === "all"
      ? tomorrowMenu.meals
      : tomorrowMenu.meals.filter((m) => m.mealType === activeTab);

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
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
              TOMORROW'S MENU
            </Text>
            <Text style={[styles.headerTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
              The Earth's Apothecary
            </Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
              {tomorrowMenu.theme} — pre-order before midnight
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active
                      ? colors.primary
                      : colors.surfaceContainer,
                  },
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: active ? "#fff" : colors.mutedForeground,
                      fontFamily: "Manrope_600SemiBold",
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View
          style={[
            styles.vitalityBar,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <Text style={[styles.vitalityLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            Your menu is colour-coded by health impact. Aim for a mix of Earthy
            Greens and Protein Heavies.
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90,
          },
        ]}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
              No meals in this category
            </Text>
          </View>
        ) : (
          filtered.map((meal) => <MealCard key={meal.id} meal={meal} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 14 },
  headerTop: {},
  headerLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 4 },
  headerTitle: { fontSize: 26, lineHeight: 32 },
  headerSub: { fontSize: 13, marginTop: 4 },
  tabsRow: { flexDirection: "row", gap: 8, paddingRight: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 100,
  },
  tabText: { fontSize: 13 },
  vitalityBar: {
    borderRadius: 12,
    padding: 12,
  },
  vitalityLabel: { fontSize: 12, lineHeight: 18 },
  list: { paddingHorizontal: 20, paddingTop: 16, gap: 0 },
  empty: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: { fontSize: 15 },
});

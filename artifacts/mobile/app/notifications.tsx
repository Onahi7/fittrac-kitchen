import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface NotifToggle {
  id: string;
  label: string;
  sub: string;
  enabled: boolean;
}

const RECENT_NOTIFS = [
  { id: "1", title: "Meal Pre-order Reminder", body: "Tomorrow's menu opens tonight at 6 PM. Secure your Egusi Soup!", time: "2h ago", icon: "bell" as const, color: "#154212" },
  { id: "2", title: "Order Confirmed", body: "VIT-4821 has been confirmed. Delivery tomorrow between 11AM–1PM.", time: "5h ago", icon: "check-circle" as const, color: "#3B8BE0" },
  { id: "3", title: "Hydration Reminder", body: "You've only had 3 glasses today. Goal is 8. Keep going! 💧", time: "8h ago", icon: "droplet" as const, color: "#3B8BE0" },
  { id: "4", title: "Health Insight", body: "87% of your meals this week were low sodium. Great work managing your blood pressure!", time: "Yesterday", icon: "heart" as const, color: "#BA1A1A" },
  { id: "5", title: "Exercise Nudge", body: "You haven't logged a workout today. Even a 20-min walk counts!", time: "Yesterday", icon: "activity" as const, color: "#8B500A" },
  { id: "6", title: "Wellness Consultation", body: "Your session with Dr. Adaeze Okonkwo starts in 15 minutes.", time: "2 days ago", icon: "video" as const, color: "#493700" },
];

const INIT_TOGGLES: { category: string; items: NotifToggle[] }[] = [
  {
    category: "Meal Reminders",
    items: [
      { id: "meal_morning", label: "Morning Meal Reminder", sub: "Reminder to log breakfast (8:00 AM)", enabled: true },
      { id: "meal_lunch", label: "Lunch Reminder", sub: "Don't forget your midday meal (12:00 PM)", enabled: true },
      { id: "meal_preorder", label: "Pre-order Alert", sub: "Tomorrow's menu is open (6:00 PM)", enabled: true },
    ],
  },
  {
    category: "Health Tracking",
    items: [
      { id: "health_weight", label: "Daily Weight Log", sub: "Reminder to log your weight (7:00 AM)", enabled: true },
      { id: "health_water", label: "Water Intake Reminders", sub: "Hourly nudge if you're behind on hydration", enabled: false },
      { id: "health_exercise", label: "Exercise Nudge", sub: "Daily reminder to stay active (4:00 PM)", enabled: true },
      { id: "health_insight", label: "Weekly Health Insights", sub: "Your personalised weekly summary", enabled: true },
    ],
  },
  {
    category: "Order Updates",
    items: [
      { id: "order_confirmed", label: "Order Confirmed", sub: "When your pre-order is accepted", enabled: true },
      { id: "order_preparing", label: "Kitchen Updates", sub: "When your meal is being prepared", enabled: false },
      { id: "order_ready", label: "Ready for Pickup / Delivery", sub: "When your order is on its way", enabled: true },
    ],
  },
  {
    category: "Wellness",
    items: [
      { id: "wellness_reminder", label: "Consultation Reminders", sub: "15 min before your session starts", enabled: true },
      { id: "wellness_tips", label: "Health Tips", sub: "Condition-specific wellness tips 3x/week", enabled: false },
    ],
  },
];

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [categories, setCategories] = useState(INIT_TOGGLES);

  const toggle = (categoryIdx: number, itemId: string) => {
    setCategories((prev) =>
      prev.map((cat, ci) =>
        ci === categoryIdx
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId ? { ...item, enabled: !item.enabled } : item
              ),
            }
          : cat
      )
    );
  };

  const totalEnabled = categories.flatMap((c) => c.items).filter((i) => i.enabled).length;

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
            ALERTS & REMINDERS
          </Text>
          <Text style={[styles.headerTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Notifications
          </Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[styles.countText, { color: colors.primary, fontFamily: "Manrope_700Bold" }]}>
            {totalEnabled} on
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[
        styles.scroll,
        { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40 },
      ]}>
        <View style={[styles.recentSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Recent
          </Text>
          {RECENT_NOTIFS.map((n, i) => (
            <View key={n.id} style={[styles.notifItem, {
              borderBottomColor: colors.surfaceContainerHigh,
              borderBottomWidth: i < RECENT_NOTIFS.length - 1 ? 1 : 0,
            }]}>
              <View style={[styles.notifIcon, { backgroundColor: n.color + "18" }]}>
                <Feather name={n.icon} size={18} color={n.color} />
              </View>
              <View style={styles.notifContent}>
                <Text style={[styles.notifTitle, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
                  {n.title}
                </Text>
                <Text style={[styles.notifBody, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                  {n.body}
                </Text>
                <Text style={[styles.notifTime, { color: colors.outlineVariant, fontFamily: "Manrope_400Regular" }]}>
                  {n.time}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={[styles.settingsHeading, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
          Notification Settings
        </Text>

        {categories.map((category, ci) => (
          <View key={category.category} style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.categoryTitle, { color: colors.mutedForeground, fontFamily: "Manrope_700Bold" }]}>
              {category.category.toUpperCase()}
            </Text>
            {category.items.map((item, ii) => (
              <View key={item.id} style={[styles.toggleRow, {
                borderBottomColor: colors.surfaceContainerHigh,
                borderBottomWidth: ii < category.items.length - 1 ? 1 : 0,
              }]}>
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, { color: colors.onSurface, fontFamily: "Manrope_500Medium" }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.toggleSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                    {item.sub}
                  </Text>
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => toggle(ci, item.id)}
                  trackColor={{ false: colors.surfaceContainerHigh, true: colors.primaryContainer }}
                  thumbColor={item.enabled ? colors.primary : colors.outlineVariant}
                  ios_backgroundColor={colors.surfaceContainerHigh}
                />
              </View>
            ))}
          </View>
        ))}

        <View style={[styles.infoCard, { backgroundColor: colors.surfaceContainerLow }]}>
          <Feather name="shield" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            All notifications are stored locally on your device. Fittrac Kitchen never sends your data to third-party servers.
          </Text>
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
  countBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, alignSelf: "center" },
  countText: { fontSize: 13 },
  scroll: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
  recentSection: { borderRadius: 20, padding: 18, gap: 0, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  sectionTitle: { fontSize: 19, marginBottom: 6 },
  notifItem: { flexDirection: "row", gap: 12, paddingVertical: 14, alignItems: "flex-start" },
  notifIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  notifContent: { flex: 1, gap: 3 },
  notifTitle: { fontSize: 14 },
  notifBody: { fontSize: 12, lineHeight: 18 },
  notifTime: { fontSize: 11 },
  settingsHeading: { fontSize: 22, marginTop: 4 },
  section: { borderRadius: 20, padding: 18, gap: 0, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  categoryTitle: { fontSize: 11, letterSpacing: 1.2, marginBottom: 8 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 15 },
  toggleSub: { fontSize: 12, marginTop: 2 },
  infoCard: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 16, alignItems: "flex-start" },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});

import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
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
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const WORKOUT_TYPES = [
  { name: "Walking", icon: "navigation" as const, calPerMin: 4 },
  { name: "Jogging", icon: "wind" as const, calPerMin: 8 },
  { name: "Cycling", icon: "trending-up" as const, calPerMin: 7 },
  { name: "Swimming", icon: "droplet" as const, calPerMin: 8.5 },
  { name: "Strength", icon: "zap" as const, calPerMin: 6 },
  { name: "Yoga", icon: "sun" as const, calPerMin: 3 },
  { name: "HIIT", icon: "activity" as const, calPerMin: 10 },
  { name: "Dance", icon: "music" as const, calPerMin: 5 },
];

const DURATIONS = [15, 20, 30, 45, 60, 90];

const INTENSITIES = [
  { key: "Low" as const, label: "Low", emoji: "🌿", mult: 0.7, color: "#6B9E6B" },
  { key: "Medium" as const, label: "Medium", emoji: "🔥", mult: 1.0, color: "#8B500A" },
  { key: "High" as const, label: "High", emoji: "⚡", mult: 1.3, color: "#BA1A1A" },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ExerciseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { exerciseLogs, logExercise, todayExercise } = useApp();

  const [selectedType, setSelectedType] = useState("Walking");
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [selectedIntensity, setSelectedIntensity] = useState<"Low" | "Medium" | "High">("Medium");
  const [saving, setSaving] = useState(false);
  const [justLogged, setJustLogged] = useState(false);

  const workout = WORKOUT_TYPES.find((w) => w.name === selectedType) ?? WORKOUT_TYPES[0];
  const intensity = INTENSITIES.find((i) => i.key === selectedIntensity) ?? INTENSITIES[1];
  const estimatedCal = Math.round(workout.calPerMin * selectedDuration * intensity.mult);

  const handleLog = async () => {
    setSaving(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await logExercise({
      type: selectedType,
      duration: selectedDuration,
      intensity: selectedIntensity,
      caloriesBurned: estimatedCal,
    });
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 2000);
  };

  const sorted = [...exerciseLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const dayLogs = exerciseLogs.filter((l) => l.date === dateStr);
    return {
      dayLabel: DAY_LABELS[d.getDay()],
      minutes: dayLogs.reduce((s, l) => s + l.duration, 0),
      isToday: i === 6,
    };
  });

  const maxMinutes = Math.max(...last7Days.map((d) => d.minutes), 30);

  const weeklyStats = {
    totalMinutes: last7Days.reduce((s, d) => s + d.minutes, 0),
    totalCalories: exerciseLogs
      .filter((l) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        return l.date >= cutoff.toISOString().split("T")[0];
      })
      .reduce((s, l) => s + l.caloriesBurned, 0),
    activeDays: last7Days.filter((d) => d.minutes > 0).length,
  };

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
            FITNESS TRACKER
          </Text>
          <Text style={[styles.headerTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Exercise Log
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[
        styles.scroll,
        { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40 },
      ]}>
        <View style={styles.todayStats}>
          {[
            { label: "TODAY'S ACTIVE TIME", value: `${todayExercise.minutes}`, unit: "min", icon: "clock" as const, color: colors.primary },
            { label: "CALORIES BURNED", value: `${todayExercise.calories}`, unit: "kcal", icon: "zap" as const, color: colors.secondary },
            { label: "WORKOUTS DONE", value: `${todayExercise.workouts}`, unit: "", icon: "check-circle" as const, color: "#3B8BE0" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Feather name={s.icon} size={18} color={s.color} />
              <Text style={[styles.statValue, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
                {s.value}<Text style={{ fontSize: 11, fontFamily: "Manrope_400Regular", color: colors.mutedForeground }}>{s.unit}</Text>
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Weekly Activity
          </Text>
          <View style={styles.weekChart}>
            {last7Days.map((day, i) => (
              <View key={i} style={styles.dayCol}>
                <View style={[styles.dayBarTrack, { backgroundColor: colors.surfaceContainerHigh }]}>
                  <View style={[
                    styles.dayBarFill,
                    {
                      height: `${(day.minutes / maxMinutes) * 100}%`,
                      backgroundColor: day.isToday ? colors.primary : "#A5C9A1",
                    }
                  ]} />
                </View>
                <Text style={[styles.dayLbl, {
                  color: day.isToday ? colors.primary : colors.mutedForeground,
                  fontFamily: day.isToday ? "Manrope_700Bold" : "Manrope_400Regular",
                }]}>
                  {day.dayLabel}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.weekSummary}>
            {[
              { label: "Week Total", value: `${weeklyStats.totalMinutes} min` },
              { label: "Calories", value: `${weeklyStats.totalCalories} kcal` },
              { label: "Active Days", value: `${weeklyStats.activeDays}/7` },
            ].map((s) => (
              <View key={s.label} style={styles.weekStat}>
                <Text style={[styles.weekStatLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>{s.label}</Text>
                <Text style={[styles.weekStatValue, { color: colors.onSurface, fontFamily: "Manrope_700Bold" }]}>{s.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Log a Workout
          </Text>

          <Text style={[styles.logLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
            WORKOUT TYPE
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.typeRow}>
              {WORKOUT_TYPES.map((w) => {
                const active = selectedType === w.name;
                return (
                  <Pressable
                    key={w.name}
                    style={[styles.typeChip, {
                      backgroundColor: active ? colors.primary : colors.surfaceContainerLow,
                      borderColor: active ? colors.primary : "transparent",
                      borderWidth: 1.5,
                    }]}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                      setSelectedType(w.name);
                    }}
                  >
                    <Feather name={w.icon} size={16} color={active ? "#fff" : colors.onSurface} />
                    <Text style={[styles.typeChipText, {
                      color: active ? "#fff" : colors.onSurface,
                      fontFamily: active ? "Manrope_700Bold" : "Manrope_500Medium",
                    }]}>
                      {w.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <Text style={[styles.logLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
            DURATION (MINUTES)
          </Text>
          <View style={styles.durationRow}>
            {DURATIONS.map((d) => {
              const active = selectedDuration === d;
              return (
                <Pressable
                  key={d}
                  style={[styles.durationChip, {
                    backgroundColor: active ? colors.primary : colors.surfaceContainerLow,
                  }]}
                  onPress={() => setSelectedDuration(d)}
                >
                  <Text style={[styles.durationText, {
                    color: active ? "#fff" : colors.onSurface,
                    fontFamily: active ? "Epilogue_700Bold" : "Manrope_500Medium",
                  }]}>
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.logLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
            INTENSITY
          </Text>
          <View style={styles.intensityRow}>
            {INTENSITIES.map((int) => {
              const active = selectedIntensity === int.key;
              return (
                <Pressable
                  key={int.key}
                  style={[styles.intensityChip, {
                    backgroundColor: active ? int.color : colors.surfaceContainerLow,
                    flex: 1,
                  }]}
                  onPress={() => setSelectedIntensity(int.key)}
                >
                  <Text style={styles.intensityEmoji}>{int.emoji}</Text>
                  <Text style={[styles.intensityLabel, {
                    color: active ? "#fff" : colors.onSurface,
                    fontFamily: active ? "Manrope_700Bold" : "Manrope_500Medium",
                  }]}>
                    {int.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.estimateCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <Feather name="zap" size={16} color={colors.primary} />
            <Text style={[styles.estimateText, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}>
              Estimated burn: <Text style={{ fontFamily: "Epilogue_700Bold", color: colors.primary }}>{estimatedCal} kcal</Text>
              {" "}for {selectedDuration} min {selectedType.toLowerCase()} at {selectedIntensity.toLowerCase()} intensity
            </Text>
          </View>

          <Pressable
            style={[styles.logBtn, {
              backgroundColor: justLogged ? "#6B9E6B" : colors.primary,
              opacity: saving ? 0.7 : 1,
            }]}
            onPress={handleLog}
            disabled={saving}
          >
            <Feather name={justLogged ? "check" : "plus"} size={18} color="#fff" />
            <Text style={[styles.logBtnText, { fontFamily: "Epilogue_700Bold" }]}>
              {saving ? "Saving..." : justLogged ? "Workout Logged!" : "Log Workout"}
            </Text>
          </Pressable>
        </View>

        {sorted.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
              Recent Workouts
            </Text>
            {sorted.map((log) => {
              const w = WORKOUT_TYPES.find((x) => x.name === log.type) ?? WORKOUT_TYPES[0];
              const int = INTENSITIES.find((x) => x.key === log.intensity) ?? INTENSITIES[1];
              return (
                <View key={log.id} style={[styles.historyItem, { borderBottomColor: colors.surfaceContainerHigh }]}>
                  <View style={[styles.historyIcon, { backgroundColor: int.color + "22" }]}>
                    <Feather name={w.icon} size={18} color={int.color} />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={[styles.historyType, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
                      {log.type} · {log.intensity}
                    </Text>
                    <Text style={[styles.historyMeta, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                      {log.date} · {log.duration} min
                    </Text>
                  </View>
                  <Text style={[styles.historyCal, { color: int.color, fontFamily: "Epilogue_700Bold" }]}>
                    −{log.caloriesBurned}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
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
  scroll: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
  todayStats: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, gap: 4, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 20, lineHeight: 24, marginTop: 4 },
  statLabel: { fontSize: 8, letterSpacing: 0.5, textAlign: "center" },
  section: { borderRadius: 20, padding: 18, gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  sectionTitle: { fontSize: 19 },
  weekChart: { flexDirection: "row", height: 80, alignItems: "flex-end", gap: 6 },
  dayCol: { flex: 1, alignItems: "center", gap: 4, height: "100%" },
  dayBarTrack: { flex: 1, width: "100%", borderRadius: 4, overflow: "hidden", justifyContent: "flex-end" },
  dayBarFill: { width: "100%", borderRadius: 4 },
  dayLbl: { fontSize: 10 },
  weekSummary: { flexDirection: "row", justifyContent: "space-between" },
  weekStat: { alignItems: "center", gap: 2 },
  weekStatLabel: { fontSize: 10 },
  weekStatValue: { fontSize: 14 },
  logLabel: { fontSize: 11, letterSpacing: 1, marginBottom: -6 },
  typeRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 100 },
  typeChipText: { fontSize: 14 },
  durationRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  durationChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, minWidth: 52, alignItems: "center" },
  durationText: { fontSize: 15 },
  intensityRow: { flexDirection: "row", gap: 8 },
  intensityChip: { alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 12, borderRadius: 14 },
  intensityEmoji: { fontSize: 20 },
  intensityLabel: { fontSize: 13 },
  estimateCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 14 },
  estimateText: { flex: 1, fontSize: 13, lineHeight: 19 },
  logBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 100 },
  logBtnText: { color: "#fff", fontSize: 17 },
  historyItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  historyIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  historyInfo: { flex: 1 },
  historyType: { fontSize: 14 },
  historyMeta: { fontSize: 12, marginTop: 2 },
  historyCal: { fontSize: 16 },
});

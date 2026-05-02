import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
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
import { CONDITIONS, DIETARY_RESTRICTIONS } from "@/constants/data";
import type { Condition } from "@/constants/types";

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
      {title}
    </Text>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, setConditions, setDietaryRestrictions } = useApp();
  const [editingConditions, setEditingConditions] = useState(false);
  const [localConditions, setLocalConditions] = useState<Condition[]>(profile.conditions);

  const toggleCondition = (id: Condition) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setLocalConditions((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const saveConditions = async () => {
    await setConditions(localConditions);
    setEditingConditions(false);
  };

  const toggleRestriction = async (r: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    const current = profile.dietaryRestrictions;
    const updated = current.includes(r)
      ? current.filter((x) => x !== r)
      : [...current, r];
    await setDietaryRestrictions(updated);
  };

  const seedPoints = 840;
  const tierName = seedPoints < 500 ? "Seedling" : seedPoints < 1000 ? "Sprout" : "Golden Harvest";

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
      <Text style={[styles.pageTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
        Profile
      </Text>

      <View style={[styles.seedCard, { backgroundColor: colors.primaryContainer }]}>
        <View style={styles.seedHeader}>
          <View>
            <Text style={[styles.seedPoints, { color: "#fff", fontFamily: "Epilogue_700Bold" }]}>
              {seedPoints}
            </Text>
            <Text style={[styles.seedLabel, { color: colors.onPrimaryContainer, fontFamily: "Manrope_400Regular" }]}>
              CURRENT SEED POINTS
            </Text>
          </View>
          <View style={[styles.tierBadge, { backgroundColor: colors.tertiaryFixed }]}>
            <Text style={[styles.tierText, { color: colors.tertiary, fontFamily: "Manrope_700Bold" }]}>
              {tierName}
            </Text>
          </View>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.primary }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((seedPoints % 500) / 500) * 100}%`,
                backgroundColor: colors.tertiaryFixed,
              },
            ]}
          />
        </View>
        <Text style={[styles.seedProgress, { color: colors.onPrimaryContainer, fontFamily: "Manrope_400Regular" }]}>
          {500 - (seedPoints % 500)} more seeds to reach the next harvest
        </Text>
      </View>

      <SectionHeader title="Health Conditions" />
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {editingConditions ? (
          <View style={{ gap: 10 }}>
            {CONDITIONS.map((c) => {
              const active = localConditions.includes(c.id);
              return (
                <Pressable
                  key={c.id}
                  style={[
                    styles.condRow,
                    {
                      backgroundColor: active
                        ? colors.surfaceContainer
                        : "transparent",
                      padding: 12,
                      borderRadius: 12,
                    },
                  ]}
                  onPress={() => toggleCondition(c.id)}
                >
                  <View
                    style={[
                      styles.condIcon,
                      {
                        backgroundColor: active ? colors.primaryContainer : colors.surfaceContainer,
                      },
                    ]}
                  >
                    <Feather
                      name={c.icon as any}
                      size={16}
                      color={active ? colors.onPrimaryContainer : c.color}
                    />
                  </View>
                  <Text style={[styles.condLabel, { color: colors.onSurface, fontFamily: "Manrope_500Medium" }]}>
                    {c.label}
                  </Text>
                  {active && (
                    <Feather name="check" size={18} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
            <View style={styles.editActions}>
              <Pressable
                style={[styles.cancelBtn, { borderColor: colors.outlineVariant }]}
                onPress={() => {
                  setLocalConditions(profile.conditions);
                  setEditingConditions(false);
                }}
              >
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={saveConditions}
              >
                <Text style={[styles.saveBtnText, { fontFamily: "Manrope_600SemiBold" }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {profile.conditions.length === 0 ? (
              <Text style={[styles.noConditions, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                No conditions selected — all meals shown
              </Text>
            ) : (
              profile.conditions.map((id) => {
                const c = CONDITIONS.find((x) => x.id === id);
                if (!c) return null;
                return (
                  <View key={id} style={styles.condRow}>
                    <View style={[styles.condIcon, { backgroundColor: colors.surfaceContainer }]}>
                      <Feather name={c.icon as any} size={16} color={c.color} />
                    </View>
                    <Text style={[styles.condLabel, { color: colors.onSurface, fontFamily: "Manrope_500Medium" }]}>
                      {c.label}
                    </Text>
                  </View>
                );
              })
            )}
            <Pressable
              style={[styles.editBtn, { borderColor: colors.primary }]}
              onPress={() => {
                setLocalConditions(profile.conditions);
                setEditingConditions(true);
              }}
            >
              <Feather name="edit-2" size={14} color={colors.primary} />
              <Text style={[styles.editBtnText, { color: colors.primary, fontFamily: "Manrope_600SemiBold" }]}>
                Edit Conditions
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      <SectionHeader title="Dietary Restrictions" />
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.restrictionsGrid}>
          {DIETARY_RESTRICTIONS.map((r) => {
            const active = profile.dietaryRestrictions.includes(r);
            return (
              <Pressable
                key={r}
                style={[
                  styles.restrictionChip,
                  {
                    backgroundColor: active ? colors.primaryContainer : colors.surfaceContainer,
                    borderColor: active ? colors.primary : "transparent",
                    borderWidth: 1.5,
                  },
                ]}
                onPress={() => toggleRestriction(r)}
              >
                <Text
                  style={[
                    styles.restrictionText,
                    {
                      color: active ? colors.onPrimaryContainer : colors.mutedForeground,
                      fontFamily: active ? "Manrope_600SemiBold" : "Manrope_400Regular",
                    },
                  ]}
                >
                  {r}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <SectionHeader title="Settings" />
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {[
          { icon: "bell", label: "Notifications", sub: "Meal reminders & order updates" },
          { icon: "help-circle", label: "Help & Support", sub: "FAQs and health standards" },
          { icon: "info", label: "About Fittrac-Kitchen", sub: "Version 1.0.0" },
        ].map((item, i, arr) => (
          <View key={item.label}>
            <Pressable style={styles.settingsRow}>
              <View style={[styles.settingsIcon, { backgroundColor: colors.surfaceContainer }]}>
                <Feather name={item.icon as any} size={16} color={colors.primary} />
              </View>
              <View style={styles.settingsText}>
                <Text style={[styles.settingsLabel, { color: colors.onSurface, fontFamily: "Manrope_500Medium" }]}>
                  {item.label}
                </Text>
                <Text style={[styles.settingsSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                  {item.sub}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.outlineVariant} />
            </Pressable>
            {i < arr.length - 1 && (
              <View style={[styles.divider, { backgroundColor: colors.surfaceContainer }]} />
            )}
          </View>
        ))}
      </View>

      <Text style={[styles.footer, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
        "Let food be thy medicine, and let your kitchen be your first apothecary."
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  pageTitle: { fontSize: 30 },
  seedCard: {
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  seedHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  seedPoints: { fontSize: 42, lineHeight: 48 },
  seedLabel: { fontSize: 10, letterSpacing: 1 },
  tierBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
  },
  tierText: { fontSize: 13 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: 6, borderRadius: 3 },
  seedProgress: { fontSize: 12 },
  sectionTitle: { fontSize: 20 },
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 0,
    shadowColor: "#1D1B19",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  condRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  condIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  condLabel: { flex: 1, fontSize: 15 },
  noConditions: { fontSize: 14, textAlign: "center", paddingVertical: 8 },
  editActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 100,
    borderWidth: 1.5,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14 },
  saveBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 100,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 14 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: 100,
    borderWidth: 1.5,
    marginTop: 4,
  },
  editBtnText: { fontSize: 14 },
  restrictionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  restrictionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },
  restrictionText: { fontSize: 13 },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  settingsIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsText: { flex: 1 },
  settingsLabel: { fontSize: 15 },
  settingsSub: { fontSize: 12, marginTop: 1 },
  divider: { height: 1, borderRadius: 1, marginHorizontal: -16 },
  footer: { fontSize: 13, textAlign: "center", fontStyle: "italic", paddingVertical: 8 },
});

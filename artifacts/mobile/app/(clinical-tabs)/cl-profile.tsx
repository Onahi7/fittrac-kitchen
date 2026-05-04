import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { useClinicalAuth } from "@/context/ClinicalAuthContext";
import { useColors } from "@/hooks/useColors";
import { apiFetch } from "@/lib/api";

export default function ProviderProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { clinicalStaff, clinicalToken, logout } = useClinicalAuth();

  const [dashData, setDashData] = useState<any>(null);

  useEffect(() => {
    apiFetch("/api/clinical-staff/dashboard", {
      headers: { Authorization: `Bearer ${clinicalToken}` },
    })
      .then((r) => r.json())
      .then(setDashData)
      .catch(() => {});
  }, []);

  const isDoctor = clinicalStaff?.role === "doctor";

  const handleLogout = () => {
    if (Platform.OS === "web") {
      logout().then(() => router.replace("/onboarding"));
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out of the provider portal?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/onboarding");
          },
        },
      ]);
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const stats = isDoctor
    ? [
        { label: "Today's Consults", value: dashData?.todayConsultations ?? "—", icon: "calendar" as const, color: colors.primary },
        { label: "Total Patients", value: dashData?.totalPatients ?? "—", icon: "users" as const, color: "#1D4ED8" },
        { label: "Critical Labs", value: dashData?.criticalAlerts ?? "—", icon: "alert-triangle" as const, color: "#DC2626" },
        { label: "Completed Today", value: dashData?.completed ?? "—", icon: "check-circle" as const, color: "#059669" },
      ]
    : [
        { label: "Total Clients", value: dashData?.totalClients ?? "—", icon: "users" as const, color: colors.primary },
        { label: "Active Plans", value: dashData?.activePlans ?? "—", icon: "book-open" as const, color: "#1D4ED8" },
        { label: "Avg Adherence", value: dashData?.averageAdherence ? `${dashData.averageAdherence}%` : "—", icon: "trending-up" as const, color: "#059669" },
        { label: "Today's Sessions", value: dashData?.todaySessions ?? "—", icon: "calendar" as const, color: "#D97706" },
      ];

  const initials = (clinicalStaff?.name ?? "P").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const menuItems = [
    { icon: "globe" as const, label: "Open Web Portal", action: () => {}, color: colors.onSurface },
    { icon: "bell" as const, label: "Notification Settings", action: () => {}, color: colors.onSurface },
    { icon: "shield" as const, label: "Privacy & Security", action: () => {}, color: colors.onSurface },
    { icon: "help-circle" as const, label: "Help & Support", action: () => {}, color: colors.onSurface },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100 },
      ]}
    >
      <Text style={[styles.pageTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Profile</Text>

      <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: "#fff" }]}>
            <Text style={[styles.avatarText, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>{initials}</Text>
          </View>
          <View style={[styles.roleChip, { backgroundColor: isDoctor ? "#3B82F6" : "#8B500A" }]}>
            <Feather name={isDoctor ? "activity" : "heart"} size={10} color="#fff" />
            <Text style={[styles.roleChipText, { fontFamily: "Manrope_700Bold" }]}>
              {isDoctor ? "Doctor" : "Nutritionist"}
            </Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.staffName, { fontFamily: "Epilogue_700Bold" }]}>{clinicalStaff?.name}</Text>
          <Text style={[styles.staffSpec, { fontFamily: "Manrope_400Regular" }]}>{clinicalStaff?.specialization}</Text>
          <Text style={[styles.staffEmail, { fontFamily: "Manrope_400Regular" }]}>{clinicalStaff?.email}</Text>
          <View style={[styles.badgePill, { backgroundColor: "#ffffff25" }]}>
            <Text style={[styles.badgeText, { fontFamily: "Manrope_600SemiBold" }]}>{clinicalStaff?.badge}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Today's Overview</Text>
      <View style={styles.statsGrid}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: s.color + "12", borderColor: s.color + "30" }]}>
            <Feather name={s.icon} size={20} color={s.color} />
            <Text style={[styles.statVal, { color: s.color, fontFamily: "Epilogue_700Bold" }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: s.color, fontFamily: "Manrope_500Medium" }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Settings</Text>
      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {menuItems.map((item, i) => (
          <Pressable
            key={item.label}
            style={[styles.menuItem, i < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            onPress={item.action}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.muted }]}>
              <Feather name={item.icon} size={16} color={colors.onSurface} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.onSurface, fontFamily: "Manrope_500Medium" }]}>{item.label}</Text>
            <Feather name="chevron-right" size={16} color={colors.outline} />
          </Pressable>
        ))}
      </View>

      <Pressable style={[styles.logoutBtn, { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" }]} onPress={handleLogout}>
        <Feather name="log-out" size={18} color="#DC2626" />
        <Text style={[styles.logoutText, { color: "#DC2626", fontFamily: "Manrope_700Bold" }]}>Sign Out of Provider Portal</Text>
      </Pressable>

      <View style={[styles.versionRow]}>
        <Text style={[styles.versionText, { color: colors.outline, fontFamily: "Manrope_400Regular" }]}>
          Fittrac Clinical • Provider Edition
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 0 },
  pageTitle: { fontSize: 28, letterSpacing: -0.5, marginBottom: 20 },
  profileCard: { borderRadius: 20, padding: 20, flexDirection: "row", gap: 16, alignItems: "flex-start", marginBottom: 28 },
  avatarWrap: { position: "relative" },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 22 },
  roleChip: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, position: "absolute", bottom: -6, left: "50%", transform: [{ translateX: -24 }], width: 80 },
  roleChipText: { color: "#fff", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.3 },
  staffName: { color: "#fff", fontSize: 17, marginBottom: 2 },
  staffSpec: { color: "#ffffffCC", fontSize: 12, marginBottom: 2 },
  staffEmail: { color: "#ffffff99", fontSize: 11, marginBottom: 10 },
  badgePill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  badgeText: { color: "#fff", fontSize: 11 },
  sectionTitle: { fontSize: 16, marginBottom: 14 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  statCard: { width: "47%", borderRadius: 16, borderWidth: 1, padding: 16, alignItems: "center", gap: 6 },
  statVal: { fontSize: 24 },
  statLabel: { fontSize: 10, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.4 },
  menuCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 20 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  menuIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, borderWidth: 1, paddingVertical: 16, marginBottom: 16 },
  logoutText: { fontSize: 15 },
  versionRow: { alignItems: "center", paddingVertical: 8 },
  versionText: { fontSize: 11 },
});

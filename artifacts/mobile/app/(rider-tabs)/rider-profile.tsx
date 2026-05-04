import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRider } from "@/context/RiderContext";
import { useColors } from "@/hooks/useColors";

export default function RiderProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { rider, isOnline, todayDeliveries, logout } = useRider();

  const signOut = () => {
    const run = async () => {
      await logout();
      router.replace("/login");
    };
    if (Platform.OS === "web") {
      run();
      return;
    }
    Alert.alert("Sign out", "Sign out of the rider app?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: run },
    ]);
  };

  const initials = (rider?.name ?? "R").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16, paddingBottom: insets.bottom + 100 }]}
    >
      <Text style={[styles.title, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Profile</Text>

      <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
        <View style={styles.avatar}>
          <Text style={[styles.avatarText, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { fontFamily: "Epilogue_700Bold" }]}>{rider?.name}</Text>
          <Text style={[styles.meta, { fontFamily: "Manrope_400Regular" }]}>{rider?.phone}</Text>
          <View style={styles.chipRow}>
            <View style={styles.chip}><Text style={[styles.chipText, { fontFamily: "Manrope_700Bold" }]}>{rider?.vehicleType}</Text></View>
            <View style={[styles.chip, { backgroundColor: isOnline ? "#D1FAE5" : "#ffffff24" }]}>
              <Text style={[styles.chipText, { color: isOnline ? "#059669" : "#fff", fontFamily: "Manrope_700Bold" }]}>{isOnline ? "Online" : "Offline"}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.statRow}>
        <Stat label="Rating" value={`${rider?.rating ?? 0}`} icon="star" tone="#D97706" />
        <Stat label="Today" value={`${todayDeliveries}`} icon="check-circle" tone="#059669" />
        <Stat label="Total" value={`${rider?.totalDeliveries ?? 0}`} icon="truck" tone={colors.primary} />
      </View>

      <View style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MenuRow icon="bell" label="Notifications" />
        <MenuRow icon="shield" label="Safety & Support" />
        <MenuRow icon="map-pin" label="Delivery Zones" />
        <MenuRow icon="credit-card" label="Payout Account" />
      </View>

      <Pressable style={styles.logout} onPress={signOut}>
        <Feather name="log-out" size={17} color="#DC2626" />
        <Text style={[styles.logoutText, { fontFamily: "Manrope_700Bold" }]}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: keyof typeof Feather.glyphMap; tone: string }) {
  return (
    <View style={[styles.stat, { backgroundColor: tone + "12", borderColor: tone + "30" }]}>
      <Feather name={icon} size={17} color={tone} />
      <Text style={[styles.statValue, { color: tone, fontFamily: "Epilogue_700Bold" }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: tone, fontFamily: "Manrope_600SemiBold" }]}>{label}</Text>
    </View>
  );
}

function MenuRow({ icon, label }: { icon: keyof typeof Feather.glyphMap; label: string }) {
  const colors = useColors();
  return (
    <View style={[styles.menuRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.menuIcon, { backgroundColor: colors.muted }]}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={[styles.menuText, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>{label}</Text>
      <Feather name="chevron-right" size={16} color={colors.outline} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { fontSize: 28, marginBottom: 18 },
  profileCard: { borderRadius: 22, padding: 20, flexDirection: "row", gap: 16, alignItems: "center", marginBottom: 14 },
  avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 22 },
  name: { color: "#fff", fontSize: 20 },
  meta: { color: "#ffffffCC", fontSize: 12, marginTop: 2 },
  chipRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  chip: { backgroundColor: "#ffffff24", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  chipText: { color: "#fff", fontSize: 10, textTransform: "capitalize" },
  statRow: { flexDirection: "row", gap: 9, marginBottom: 14 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 15, padding: 12, alignItems: "center", gap: 4 },
  statValue: { fontSize: 21 },
  statLabel: { fontSize: 10, textTransform: "uppercase" },
  menu: { borderWidth: 1, borderRadius: 16, overflow: "hidden", marginBottom: 18 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 15, borderBottomWidth: 1 },
  menuIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  menuText: { flex: 1, fontSize: 14 },
  logout: { borderWidth: 1, borderColor: "#FCA5A5", backgroundColor: "#FEE2E2", borderRadius: 15, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  logoutText: { color: "#DC2626", fontSize: 14 },
});

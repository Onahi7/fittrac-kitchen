import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRider, type RiderOrder } from "@/context/RiderContext";
import { useColors } from "@/hooks/useColors";

const STEPS: Array<{ id: RiderOrder["status"]; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { id: "accepted", label: "Accepted", icon: "check-circle" },
  { id: "picked_up", label: "Picked Up", icon: "package" },
  { id: "delivered", label: "Delivered", icon: "home" },
];

export default function RiderDeliveryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeOrder, updateStatus } = useRider();

  const mark = async (status: RiderOrder["status"]) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateStatus(status);
  };

  if (!activeOrder) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Feather name="navigation" size={52} color={colors.outlineVariant} />
        <Text style={[styles.emptyTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>No Active Delivery</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>Accepted orders will appear here with pickup and drop-off steps.</Text>
      </View>
    );
  }

  const currentIndex = STEPS.findIndex((step) => step.id === activeOrder.status);
  const canPickup = activeOrder.status === "accepted";
  const canDeliver = activeOrder.status === "picked_up";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16, paddingBottom: insets.bottom + 100 }]}
    >
      <Text style={[styles.title, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Active Delivery</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>{activeOrder.orderId}</Text>

      <View style={[styles.mapCard, { backgroundColor: colors.primary }]}>
        <Feather name="map" size={34} color="#fff" />
        <Text style={[styles.mapTitle, { fontFamily: "Epilogue_700Bold" }]}>{activeOrder.distance}</Text>
        <Text style={[styles.mapSub, { fontFamily: "Manrope_400Regular" }]}>{activeOrder.estimatedTime} min estimated route</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Route</Text>
        <LocationRow icon="box" label="Pickup" value={activeOrder.pickupAddress} colors={colors} />
        <LocationRow icon="map-pin" label="Drop-off" value={activeOrder.customerAddress} colors={colors} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Progress</Text>
        {STEPS.map((step, index) => {
          const done = index <= currentIndex || activeOrder.status === "delivered";
          return (
            <View key={step.id} style={styles.stepRow}>
              <View style={[styles.stepIcon, { backgroundColor: done ? colors.primary : colors.muted }]}>
                <Feather name={step.icon} size={15} color={done ? "#fff" : colors.outline} />
              </View>
              <Text style={[styles.stepLabel, { color: done ? colors.onSurface : colors.mutedForeground, fontFamily: "Manrope_600SemiBold" }]}>{step.label}</Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>{activeOrder.customerName}</Text>
        <Text style={[styles.customerPhone, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>{activeOrder.customerPhone || "No phone provided"}</Text>
        <View style={styles.actionRow}>
          <Pressable style={[styles.outlineBtn, { borderColor: colors.border }]} onPress={() => activeOrder.customerPhone && Linking.openURL(`tel:${activeOrder.customerPhone}`)}>
            <Feather name="phone" size={15} color={colors.primary} />
            <Text style={[styles.outlineText, { color: colors.primary, fontFamily: "Manrope_700Bold" }]}>Call</Text>
          </Pressable>
          <Pressable style={[styles.outlineBtn, { borderColor: colors.border }]} onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(activeOrder.customerAddress)}`)}>
            <Feather name="navigation" size={15} color={colors.primary} />
            <Text style={[styles.outlineText, { color: colors.primary, fontFamily: "Manrope_700Bold" }]}>Map</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: canPickup || canDeliver ? 1 : 0.55 }]}
        disabled={!canPickup && !canDeliver}
        onPress={() => mark(canPickup ? "picked_up" : "delivered")}
      >
        <Text style={[styles.primaryText, { fontFamily: "Manrope_700Bold" }]}>
          {canPickup ? "Mark Picked Up" : canDeliver ? "Complete Delivery" : "Delivery Complete"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function LocationRow({ icon, label, value, colors }: { icon: keyof typeof Feather.glyphMap; label: string; value: string; colors: any }) {
  return (
    <View style={styles.locationRow}>
      <View style={[styles.locationIcon, { backgroundColor: colors.primary + "15" }]}>
        <Feather name={icon} size={15} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.locationLabel, { color: colors.outline, fontFamily: "Manrope_600SemiBold" }]}>{label}</Text>
        <Text style={[styles.locationValue, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { fontSize: 28 },
  sub: { fontSize: 13, marginTop: 2, marginBottom: 18 },
  mapCard: { height: 160, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  mapTitle: { color: "#fff", fontSize: 26, marginTop: 10 },
  mapSub: { color: "#ffffffCC", fontSize: 13, marginTop: 3 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12, gap: 14 },
  cardTitle: { fontSize: 16 },
  locationRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  locationIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  locationLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  locationValue: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  stepLabel: { fontSize: 14 },
  customerPhone: { fontSize: 13 },
  actionRow: { flexDirection: "row", gap: 10 },
  outlineBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 11, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  outlineText: { fontSize: 13 },
  primaryBtn: { borderRadius: 15, paddingVertical: 16, alignItems: "center", marginTop: 2 },
  primaryText: { color: "#fff", fontSize: 15 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  emptyTitle: { fontSize: 20, marginTop: 16 },
  emptyText: { fontSize: 14, textAlign: "center", marginTop: 6, lineHeight: 20 },
});

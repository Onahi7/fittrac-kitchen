import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRider, type RiderOrder } from "@/context/RiderContext";
import { useColors } from "@/hooks/useColors";

function OrderCard({ order, onAccept }: { order: RiderOrder; onAccept: (order: RiderOrder) => void }) {
  const colors = useColors();
  return (
    <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.orderTop}>
        <View style={[styles.orderIcon, { backgroundColor: colors.primary + "15" }]}>
          <Feather name="package" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.orderTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>{order.orderId}</Text>
          <Text style={[styles.orderMeta, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>{order.customerName}</Text>
        </View>
        <Text style={[styles.earning, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>₦{order.earnings.toLocaleString()}</Text>
      </View>
      <View style={styles.routeRow}>
        <Feather name="map-pin" size={13} color={colors.outline} />
        <Text style={[styles.routeText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]} numberOfLines={2}>
          {order.customerAddress}
        </Text>
      </View>
      <View style={styles.orderFooter}>
        <Text style={[styles.distance, { color: colors.outline, fontFamily: "Manrope_600SemiBold" }]}>{order.distance} - {order.estimatedTime} min</Text>
        <Pressable style={[styles.acceptBtn, { backgroundColor: colors.primary }]} onPress={() => onAccept(order)}>
          <Text style={[styles.acceptText, { fontFamily: "Manrope_700Bold" }]}>Accept</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function RiderHomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    rider, isLoading, isOnline, toggleOnline, availableOrders, activeOrder,
    todayEarnings, todayDeliveries, refresh, acceptOrder,
  } = useRider();

  const handleAccept = async (order: RiderOrder) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await acceptOrder(order);
    router.push("/(rider-tabs)/rider-delivery");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16, paddingBottom: insets.bottom + 100 }]}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, { color: colors.mutedForeground, fontFamily: "Manrope_600SemiBold" }]}>Rider App</Text>
          <Text style={[styles.title, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Hi, {rider?.name?.split(" ")[0] ?? "Rider"}</Text>
        </View>
        <Pressable
          style={[styles.onlineSwitch, { backgroundColor: isOnline ? "#D1FAE5" : colors.muted, borderColor: isOnline ? "#059669" : colors.border }]}
          onPress={toggleOnline}
        >
          <View style={[styles.onlineDot, { backgroundColor: isOnline ? "#059669" : colors.outline }]} />
          <Text style={[styles.onlineText, { color: isOnline ? "#059669" : colors.mutedForeground, fontFamily: "Manrope_700Bold" }]}>
            {isOnline ? "Online" : "Offline"}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <View>
          <Text style={[styles.heroLabel, { fontFamily: "Manrope_600SemiBold" }]}>Today</Text>
          <Text style={[styles.heroValue, { fontFamily: "Epilogue_700Bold" }]}>₦{todayEarnings.toLocaleString()}</Text>
          <Text style={[styles.heroSub, { fontFamily: "Manrope_400Regular" }]}>{todayDeliveries} deliveries completed</Text>
        </View>
        <View style={styles.heroIcon}>
          <Feather name="truck" size={26} color={colors.primary} />
        </View>
      </View>

      {activeOrder && (
        <Pressable style={[styles.activeCard, { backgroundColor: "#FEF3C7", borderColor: "#D97706" }]} onPress={() => router.push("/(rider-tabs)/rider-delivery")}>
          <Feather name="navigation" size={18} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.activeTitle, { color: "#92400E", fontFamily: "Manrope_700Bold" }]}>Active delivery</Text>
            <Text style={[styles.activeText, { color: "#92400E", fontFamily: "Manrope_400Regular" }]}>{activeOrder.customerName} - {activeOrder.status.replace("_", " ")}</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#92400E" />
        </Pressable>
      )}

      <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Available Orders</Text>
      {!isOnline ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="power" size={28} color={colors.outline} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>Go online to receive delivery jobs</Text>
        </View>
      ) : availableOrders.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>Waiting for ready orders</Text>
        </View>
      ) : (
        availableOrders.map((order) => <OrderCard key={order.id} order={order} onAccept={handleAccept} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  kicker: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  title: { fontSize: 27, marginTop: 2 },
  onlineSwitch: { flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineText: { fontSize: 12 },
  hero: { borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  heroLabel: { color: "#ffffffCC", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  heroValue: { color: "#fff", fontSize: 32, marginTop: 4 },
  heroSub: { color: "#ffffffCC", fontSize: 13, marginTop: 2 },
  heroIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  activeCard: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 22 },
  activeTitle: { fontSize: 13 },
  activeText: { fontSize: 12, textTransform: "capitalize" },
  sectionTitle: { fontSize: 16, marginBottom: 12 },
  empty: { borderWidth: 1, borderRadius: 16, padding: 22, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, textAlign: "center" },
  orderCard: { borderRadius: 16, borderWidth: 1, padding: 15, marginBottom: 12, gap: 12 },
  orderTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  orderIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  orderTitle: { fontSize: 15 },
  orderMeta: { fontSize: 12, marginTop: 2 },
  earning: { fontSize: 16 },
  routeRow: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  routeText: { flex: 1, fontSize: 12, lineHeight: 17 },
  orderFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  distance: { fontSize: 12 },
  acceptBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  acceptText: { color: "#fff", fontSize: 13 },
});

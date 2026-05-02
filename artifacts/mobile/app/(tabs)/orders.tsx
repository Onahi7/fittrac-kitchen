import { Feather } from "@expo/vector-icons";
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
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import type { Order } from "@/constants/types";

const STATUS_STEPS = ["confirmed", "preparing", "ready", "delivered"] as const;
const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  preparing: "Preparing Ingredients",
  ready: "Ready for Collection",
  delivered: "Out for Delivery",
};

function OrderStatusTracker({ status }: { status: Order["status"] }) {
  const colors = useColors();
  const currentIndex = STATUS_STEPS.indexOf(status);

  return (
    <View style={styles.tracker}>
      {STATUS_STEPS.slice(0, 3).map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === 2;
        return (
          <View key={step} style={styles.trackerStep}>
            <View style={styles.trackerLeft}>
              <View
                style={[
                  styles.trackerDot,
                  {
                    backgroundColor: done ? colors.primary : colors.surfaceContainerHigh,
                    borderColor: done ? colors.primary : colors.outlineVariant,
                  },
                ]}
              >
                {done && <Feather name="check" size={11} color="#fff" />}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.trackerLine,
                    { backgroundColor: done ? colors.primary : colors.outlineVariant },
                  ]}
                />
              )}
            </View>
            <View style={styles.trackerContent}>
              <Text
                style={[
                  styles.trackerLabel,
                  {
                    color: done ? colors.onSurface : colors.mutedForeground,
                    fontFamily: done ? "Manrope_600SemiBold" : "Manrope_400Regular",
                  },
                ]}
              >
                {STATUS_LABELS[step]}
              </Text>
              {i === 0 && done && (
                <Text style={[styles.trackerTime, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                  Today {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function OrderCard({ order }: { order: Order }) {
  const colors = useColors();

  return (
    <View
      style={[styles.orderCard, { backgroundColor: colors.card }]}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={[styles.orderId, { color: colors.primary, fontFamily: "Manrope_700Bold" }]}>
            #{order.id}
          </Text>
          <Text style={[styles.orderDate, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            For {order.deliveryDate}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                order.status === "delivered"
                  ? "#E8F5E9"
                  : order.status === "preparing"
                  ? "#FFF8E1"
                  : colors.surfaceContainer,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  order.status === "delivered"
                    ? colors.primary
                    : order.status === "preparing"
                    ? colors.secondary
                    : colors.mutedForeground,
                fontFamily: "Manrope_600SemiBold",
              },
            ]}
          >
            {STATUS_LABELS[order.status]}
          </Text>
        </View>
      </View>

      {order.status !== "delivered" && (
        <OrderStatusTracker status={order.status} />
      )}

      <View style={[styles.divider, { backgroundColor: colors.surfaceContainer }]} />

      {order.items.slice(0, 2).map((item, i) => (
        <View key={i} style={styles.itemRow}>
          <Text style={[styles.itemName, { color: colors.onSurface, fontFamily: "Manrope_500Medium" }]}>
            {item.meal.name}
          </Text>
          <Text style={[styles.itemPrice, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            ₦{item.meal.price.toLocaleString()}
          </Text>
        </View>
      ))}
      {order.items.length > 2 && (
        <Text style={[styles.moreItems, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
          +{order.items.length - 2} more items
        </Text>
      )}

      <View style={styles.orderFooter}>
        <Text style={[styles.totalLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
          Total
        </Text>
        <Text style={[styles.totalAmount, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>
          ₦{order.total.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { orders } = useApp();

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
        <Text style={[styles.title, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
          Orders
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
          Track your Apothecary feasts
        </Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="shopping-bag" size={40} color={colors.outlineVariant} />
          <Text style={[styles.emptyTitle, { color: colors.onSurface, fontFamily: "Epilogue_600SemiBold" }]}>
            No orders yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            Pre-order tomorrow's health-tailored meals from the menu
          </Text>
          <Pressable
            style={[styles.browseBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/menu")}
          >
            <Text style={[styles.browseBtnText, { fontFamily: "Manrope_600SemiBold" }]}>
              Browse Menu
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90,
            },
          ]}
        >
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, gap: 4 },
  title: { fontSize: 30 },
  subtitle: { fontSize: 14 },
  list: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, marginTop: 12 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  browseBtn: {
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 100,
    marginTop: 8,
  },
  browseBtnText: { color: "#fff", fontSize: 15 },
  orderCard: {
    borderRadius: 20,
    padding: 20,
    gap: 12,
    shadowColor: "#1D1B19",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  orderId: { fontSize: 16 },
  orderDate: { fontSize: 13, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  statusText: { fontSize: 12 },
  tracker: { gap: 0 },
  trackerStep: { flexDirection: "row", gap: 12, minHeight: 44 },
  trackerLeft: { alignItems: "center", width: 20 },
  trackerDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  trackerLine: { flex: 1, width: 2, marginVertical: 2 },
  trackerContent: { flex: 1, paddingTop: 2, gap: 2, paddingBottom: 8 },
  trackerLabel: { fontSize: 14 },
  trackerTime: { fontSize: 12 },
  divider: { height: 1, borderRadius: 1 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: { fontSize: 14, flex: 1 },
  itemPrice: { fontSize: 14 },
  moreItems: { fontSize: 12 },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  totalLabel: { fontSize: 14 },
  totalAmount: { fontSize: 22 },
});

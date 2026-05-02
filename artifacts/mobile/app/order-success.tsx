import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function OrderSuccessScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { orders } = useApp();

  const order = orders.find((o) => o.id === orderId) ?? orders[0];

  const steps = [
    { key: "confirmed", label: "Confirmed", time: "Today " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), done: true },
    { key: "preparing", label: "Preparing Ingredients", time: "Expected 11:45 AM", done: false },
    { key: "delivered", label: "Out for Delivery", time: "Arriving", done: false },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100,
          },
        ]}
      >
        <View
          style={[
            styles.successHeader,
            {
              backgroundColor: colors.primaryContainer,
              paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 32,
            },
          ]}
        >
          <View style={styles.checkCircle}>
            <Feather name="check" size={28} color={colors.primaryContainer} />
          </View>
          <Text style={[styles.successLabel, { color: colors.onPrimaryContainer, fontFamily: "Manrope_600SemiBold" }]}>
            ORDER CONFIRMED
          </Text>
          <Text style={[styles.successTitle, { color: "#fff", fontFamily: "Epilogue_700Bold" }]}>
            Your Apothecary Feast is on the Way.
          </Text>
          <Text style={[styles.successSub, { color: colors.onPrimaryContainer, fontFamily: "Manrope_400Regular" }]}>
            Pre-order #{order?.id ?? orderId} successful. We're preparing your
            nutrient-dense meal for the noon cycle.
          </Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.trackingCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.trackingTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
              Tracking Your Meal
            </Text>
            <View style={styles.tracker}>
              {steps.map((step, i) => (
                <View key={step.key} style={styles.trackerStep}>
                  <View style={styles.trackerLeft}>
                    <View
                      style={[
                        styles.trackerDot,
                        {
                          backgroundColor: step.done
                            ? colors.primary
                            : colors.surfaceContainerHigh,
                          borderColor: step.done
                            ? colors.primary
                            : colors.outlineVariant,
                        },
                      ]}
                    >
                      {step.done ? (
                        <Feather name="check" size={12} color="#fff" />
                      ) : (
                        <View
                          style={[
                            styles.trackerInnerDot,
                            { backgroundColor: colors.tertiaryFixed },
                          ]}
                        />
                      )}
                    </View>
                    {i < steps.length - 1 && (
                      <View
                        style={[
                          styles.trackerLine,
                          {
                            backgroundColor: step.done
                              ? colors.primary
                              : colors.outlineVariant,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.trackerText}>
                    <Text
                      style={[
                        styles.trackerLabel,
                        {
                          color: step.done ? colors.onSurface : colors.mutedForeground,
                          fontFamily: step.done ? "Manrope_600SemiBold" : "Manrope_400Regular",
                        },
                      ]}
                    >
                      {step.label}
                    </Text>
                    <Text
                      style={[
                        styles.trackerTime,
                        { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" },
                      ]}
                    >
                      {step.time}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View
            style={[
              styles.mapPlaceholder,
              { backgroundColor: colors.primaryContainer },
            ]}
          >
            <View style={styles.mapContent}>
              <Feather name="map" size={32} color={colors.onPrimaryContainer} />
              <Text style={[styles.mapText, { color: colors.onPrimaryContainer, fontFamily: "Manrope_400Regular" }]}>
                Live tracking map
              </Text>
            </View>
            <View
              style={[
                styles.pickupPin,
                { backgroundColor: colors.background },
              ]}
            >
              <Feather name="map-pin" size={14} color={colors.primary} />
              <Text style={[styles.pickupText, { color: colors.onSurface, fontFamily: "Manrope_500Medium" }]}>
                Pickup Point — 12 Victoria Island Crescent, Lagos
              </Text>
            </View>
          </View>

          {order && (
            <View style={[styles.orderDetails, { backgroundColor: colors.card }]}>
              <Text style={[styles.detailsLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
                YOUR SELECTION
              </Text>
              <Text style={[styles.detailsCycle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
                {order.deliveryDate} Delivery
              </Text>

              {order.items.map((item, i) => (
                <View key={i} style={styles.detailItem}>
                  <Text style={[styles.detailItemName, { color: colors.onSurface, fontFamily: "Manrope_500Medium" }]}>
                    {item.meal.name}
                  </Text>
                  <Text style={[styles.detailItemPrice, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                    ₦{item.meal.price.toLocaleString()}
                  </Text>
                </View>
              ))}

              <View
                style={[styles.macroBar, { backgroundColor: colors.surfaceContainer }]}
              >
                <Text style={[styles.macroLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
                  MEAL MACRO BALANCE
                </Text>
                <Text style={[styles.macroKcal, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>
                  {order.items.reduce((s, i) => s + i.meal.calories, 0)} kcal
                </Text>
                <View style={styles.macroLegend}>
                  {[
                    { label: "Protein", color: colors.primary },
                    { label: "Carbs", color: colors.secondary },
                    { label: "Fats", color: colors.tertiaryFixed },
                  ].map((m) => (
                    <View key={m.label} style={styles.macroItem}>
                      <View style={[styles.macroDot, { backgroundColor: m.color }]} />
                      <Text style={[styles.macroItemLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                        {m.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 16,
          },
        ]}
      >
        <Pressable
          style={[styles.contactBtn, { backgroundColor: colors.primary }]}
          onPress={() => {}}
        >
          <Feather name="message-circle" size={18} color="#fff" />
          <Text style={[styles.contactBtnText, { fontFamily: "Manrope_600SemiBold" }]}>
            Contact Kitchen
          </Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/(tabs)")}>
          <Text style={[styles.homeText, { color: colors.primary, fontFamily: "Manrope_600SemiBold" }]}>
            Back to Home
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {},
  successHeader: {
    padding: 28,
    paddingBottom: 36,
    gap: 12,
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#9DD090",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  successLabel: { fontSize: 11, letterSpacing: 1.5 },
  successTitle: { fontSize: 30, lineHeight: 36 },
  successSub: { fontSize: 14, lineHeight: 20 },
  content: { padding: 20, gap: 16 },
  trackingCard: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: "#1D1B19",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  trackingTitle: { fontSize: 20 },
  tracker: { gap: 0 },
  trackerStep: { flexDirection: "row", gap: 14, minHeight: 52 },
  trackerLeft: { alignItems: "center", width: 22 },
  trackerDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  trackerInnerDot: { width: 8, height: 8, borderRadius: 4 },
  trackerLine: { flex: 1, width: 2, marginVertical: 2 },
  trackerText: { flex: 1, paddingTop: 2, gap: 2, paddingBottom: 8 },
  trackerLabel: { fontSize: 15 },
  trackerTime: { fontSize: 12 },
  mapPlaceholder: {
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mapContent: { alignItems: "center", gap: 8 },
  mapText: { fontSize: 13 },
  pickupPin: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 12,
  },
  pickupText: { fontSize: 12, flex: 1 },
  orderDetails: {
    borderRadius: 20,
    padding: 20,
    gap: 12,
    shadowColor: "#1D1B19",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailsLabel: { fontSize: 10, letterSpacing: 1.5 },
  detailsCycle: { fontSize: 22, lineHeight: 28 },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailItemName: { fontSize: 15 },
  detailItemPrice: { fontSize: 14 },
  macroBar: {
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginTop: 4,
  },
  macroLabel: { fontSize: 10, letterSpacing: 1 },
  macroKcal: { fontSize: 22 },
  macroLegend: { flexDirection: "row", gap: 16 },
  macroItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroItemLabel: { fontSize: 12 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    alignItems: "center",
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 100,
    width: "100%",
  },
  contactBtnText: { color: "#fff", fontSize: 16 },
  homeText: { fontSize: 15 },
});

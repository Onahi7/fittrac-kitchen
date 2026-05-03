import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
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

interface DeliveryStatus {
  step: 0 | 1 | 2 | 3;
  label: string;
  description: string;
}

const STATUS_STEPS = [
  { label: "Order Confirmed", description: "Your order has been confirmed and is being prepared", icon: "check-circle" as const },
  { label: "Preparing Your Meal", description: "Our chefs are carefully preparing your wellness meal", icon: "coffee" as const },
  { label: "Rider on the Way", description: "Your rider has picked up and is heading to you", icon: "navigation" as const },
  { label: "Delivered", description: "Your meal has arrived. Enjoy your wellness journey!", icon: "home" as const },
];

// SVG-style map as a set of React Native views — works everywhere
function DeliveryMap({ riderProgress }: { riderProgress: number }) {
  const colors = useColors();

  // Rider animates from left (kitchen) to right (customer) based on progress
  const riderX = 40 + riderProgress * 240;

  return (
    <View style={[styles.mapContainer, { backgroundColor: "#f0ebe3" }]}>
      {/* Map background blocks */}
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <View
            key={`${row}-${col}`}
            style={[
              styles.mapBlock,
              { left: 20 + col * 80, top: 20 + row * 55, backgroundColor: "#e8e2d8" },
            ]}
          />
        ))
      )}

      {/* Horizontal roads */}
      {[55, 110, 165].map((y) => (
        <View key={y} style={[styles.road, styles.roadH, { top: y }]} />
      ))}
      {/* Vertical roads */}
      {[80, 160, 240, 320].map((x) => (
        <View key={x} style={[styles.road, styles.roadV, { left: x }]} />
      ))}

      {/* Route line (dashed) */}
      <View style={[styles.routeLine, { top: 110, left: 40, width: 260 }]}>
        {Array.from({ length: 13 }).map((_, i) => (
          <View key={i} style={[styles.routeDash, { backgroundColor: colors.primary, opacity: i * 20 < riderProgress * 260 ? 1 : 0.2 }]} />
        ))}
      </View>

      {/* Fittrac Kitchen (start) */}
      <View style={[styles.kitchenMarker, { left: 25, top: 96, backgroundColor: colors.primary }]}>
        <Text style={styles.markerText}>FK</Text>
      </View>
      <View style={[styles.markerLabel, { left: 6, top: 120, backgroundColor: colors.primary }]}>
        <Text style={styles.markerLabelText}>Kitchen</Text>
      </View>

      {/* Customer pin (destination) */}
      <View style={[styles.customerPinBase, { left: 288, top: 96, backgroundColor: "#BA1A1A" }]}>
        <View style={styles.customerPinDot} />
      </View>
      <View style={[styles.markerLabel, { left: 274, top: 75, backgroundColor: "#BA1A1A" }]}>
        <Text style={styles.markerLabelText}>You</Text>
      </View>

      {/* Rider marker */}
      <View style={[styles.riderMarker, { left: riderX - 18, top: 95 }]}>
        <View style={[styles.riderBg, { backgroundColor: "white" }]} />
        <Text style={styles.riderEmoji}>🛵</Text>
      </View>

      {/* Pulse around rider */}
      <View style={[styles.riderPulse, { left: riderX - 22, top: 91, borderColor: colors.primary + "40" }]} />
    </View>
  );
}

export default function DeliveryTracking() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { orders } = useApp();

  const orderId = (params.orderId as string) ?? "";
  const currentOrder = orders.find((o) => o.id === orderId);
  const orderItems = currentOrder?.items.map((i: any) => i.meal?.name ?? i.name ?? "Item") ?? [];

  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3>(1);
  const [riderProgress, setRiderProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Simulate delivery progression
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setCurrentStep(2), 8000));
    timers.push(setTimeout(() => setCurrentStep(3), 25000));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Animate rider on map when step is "on the way"
  useEffect(() => {
    if (currentStep >= 2) {
      const anim = Animated.timing(progressAnim, {
        toValue: 1,
        duration: currentStep === 3 ? 500 : 20000,
        useNativeDriver: false,
      });
      anim.start();
      const listener = progressAnim.addListener(({ value }) => setRiderProgress(value));
      return () => progressAnim.removeListener(listener);
    }
  }, [currentStep]);

  const eta = currentStep === 0 ? "35 min" : currentStep === 1 ? "28 min" : currentStep === 2 ? "12 min" : "Arrived!";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 12, backgroundColor: colors.primary }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="white" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerSub, { fontFamily: "Manrope_500Medium" }]}>Order {orderId}</Text>
          <Text style={[styles.headerTitle, { fontFamily: "Epilogue_700Bold" }]}>Track Delivery</Text>
        </View>
        <View style={[styles.etaBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
          <Text style={[styles.etaText, { fontFamily: "Epilogue_700Bold" }]}>{eta}</Text>
          {currentStep < 3 && <Text style={[styles.etaSub, { fontFamily: "Manrope_400Regular" }]}>ETA</Text>}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Map */}
        <DeliveryMap riderProgress={riderProgress} />

        {/* Status timeline */}
        <View style={[styles.card, { backgroundColor: colors.card, marginTop: 12 }]}>
          <Text style={[styles.cardTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Delivery Status</Text>
          {STATUS_STEPS.map((step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;
            return (
              <View key={step.label} style={styles.stepRow}>
                <View style={[
                  styles.stepDot,
                  isDone ? { backgroundColor: colors.primary } :
                  isActive ? { backgroundColor: colors.primary, opacity: 1 } :
                  { backgroundColor: colors.surfaceContainerHigh },
                ]}>
                  {isDone ? (
                    <Feather name="check" size={12} color="white" />
                  ) : isActive ? (
                    <View style={[styles.stepActiveDot, { backgroundColor: "white" }]} />
                  ) : (
                    <Feather name={step.icon} size={12} color={colors.mutedForeground} />
                  )}
                </View>
                {i < STATUS_STEPS.length - 1 && (
                  <View style={[styles.stepLine, { backgroundColor: i < currentStep ? colors.primary : colors.surfaceContainerHigh }]} />
                )}
                <View style={styles.stepContent}>
                  <Text style={[styles.stepLabel, {
                    color: isDone || isActive ? colors.onSurface : colors.mutedForeground,
                    fontFamily: isActive ? "Manrope_700Bold" : "Manrope_500Medium",
                  }]}>{step.label}</Text>
                  {isActive && (
                    <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                      {step.description}
                    </Text>
                  )}
                </View>
                {isActive && (
                  <View style={[styles.activePulse, { backgroundColor: colors.primary }]} />
                )}
              </View>
            );
          })}
        </View>

        {/* Rider info */}
        {currentStep >= 2 && currentStep < 3 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Your Rider</Text>
            <View style={styles.riderInfo}>
              <View style={[styles.riderAvatar, { backgroundColor: colors.primary + "20" }]}>
                <Text style={styles.riderAvatarText}>🛵</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.riderName, { color: colors.onSurface, fontFamily: "Manrope_700Bold" }]}>Your Rider</Text>
                <Text style={[styles.riderRating, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                  Fittrac Certified · On the way
                </Text>
              </View>
              <View style={[styles.callBtn, { backgroundColor: colors.primary }]}>
                <Feather name="phone" size={18} color="white" />
              </View>
            </View>
            <View style={[styles.liveTag, { backgroundColor: colors.primary + "15" }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.liveText, { color: colors.primary, fontFamily: "Manrope_600SemiBold" }]}>
                Live location tracking active
              </Text>
            </View>
          </View>
        )}

        {/* Delivered! */}
        {currentStep === 3 && (
          <View style={[styles.deliveredCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <Text style={styles.deliveredEmoji}>🎉</Text>
            <Text style={[styles.deliveredTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Order Delivered!</Text>
            <Text style={[styles.deliveredSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
              Enjoy your wellness meal. Rate your experience below.
            </Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Text key={s} style={styles.star}>⭐</Text>
              ))}
            </View>
          </View>
        )}

        {/* Order summary */}
        {orderItems.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Order Summary</Text>
            {orderItems.map((item: string, idx: number) => (
              <View key={idx} style={styles.orderItem}>
                <Text style={[styles.orderItemDot, { color: colors.primary }]}>•</Text>
                <Text style={[styles.orderItemText, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "flex-end", gap: 12,
    paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  headerSub: { color: "rgba(255,255,255,0.6)", fontSize: 11 },
  headerTitle: { color: "white", fontSize: 20 },
  etaBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignItems: "center" },
  etaText: { color: "white", fontSize: 20, lineHeight: 24 },
  etaSub: { color: "rgba(255,255,255,0.7)", fontSize: 9 },

  // Map
  mapContainer: {
    height: 220, marginHorizontal: 16, marginTop: 16,
    borderRadius: 20, overflow: "hidden",
    position: "relative",
  },
  mapBlock: { position: "absolute", width: 60, height: 40, borderRadius: 6 },
  road: { position: "absolute", backgroundColor: "#d4c9b8" },
  roadH: { left: 0, right: 0, height: 12 },
  roadV: { top: 0, bottom: 0, width: 10 },
  routeLine: {
    position: "absolute", height: 3, flexDirection: "row",
    alignItems: "center", gap: 4,
  },
  routeDash: { width: 14, height: 3, borderRadius: 2 },

  kitchenMarker: {
    position: "absolute", width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  markerText: { color: "white", fontSize: 9, fontWeight: "bold" },
  markerLabel: {
    position: "absolute", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  markerLabelText: { color: "white", fontSize: 8, fontWeight: "600" },

  customerPinBase: {
    position: "absolute", width: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  customerPinDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "white" },

  riderMarker: { position: "absolute", width: 36, height: 36, alignItems: "center", justifyContent: "center", zIndex: 10 },
  riderBg: { position: "absolute", width: 36, height: 36, borderRadius: 18, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  riderEmoji: { fontSize: 18, zIndex: 11 },
  riderPulse: { position: "absolute", width: 44, height: 44, borderRadius: 22, borderWidth: 2 },

  // Cards
  card: { marginHorizontal: 16, marginTop: 12, borderRadius: 20, padding: 16, gap: 12 },
  cardTitle: { fontSize: 16 },

  // Steps
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, position: "relative" },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1,
  },
  stepActiveDot: { width: 8, height: 8, borderRadius: 4 },
  stepLine: { position: "absolute", left: 13, top: 28, width: 2, height: 36, zIndex: 0 },
  stepContent: { flex: 1, paddingTop: 4 },
  stepLabel: { fontSize: 13 },
  stepDesc: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  activePulse: { width: 8, height: 8, borderRadius: 4, marginTop: 10 },

  // Rider info
  riderInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  riderAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  riderAvatarText: { fontSize: 22 },
  riderName: { fontSize: 15 },
  riderRating: { fontSize: 12 },
  callBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  liveTag: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 12 },

  // Delivered
  deliveredCard: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 20, padding: 20, alignItems: "center", gap: 8,
    borderWidth: 1.5,
  },
  deliveredEmoji: { fontSize: 40 },
  deliveredTitle: { fontSize: 22 },
  deliveredSub: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  stars: { flexDirection: "row", gap: 6, marginTop: 4 },
  star: { fontSize: 24 },

  // Order summary
  orderItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  orderItemDot: { fontSize: 16 },
  orderItemText: { fontSize: 14 },
});

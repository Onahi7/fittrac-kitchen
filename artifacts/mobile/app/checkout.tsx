import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { DELIVERY_FEE } from "@/constants/data";

type PaymentMethod = "card" | "ussd" | "bank";
type Fulfillment = "delivery" | "pickup";

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { basket, basketTotal, removeFromBasket, placeOrder } = useApp();
  const [fulfillment, setFulfillment] = useState<Fulfillment>("delivery");
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  const deliveryFee = fulfillment === "delivery" ? DELIVERY_FEE : 0;
  const promoDiscount = promoApplied ? 500 : 0;
  const total = basketTotal + deliveryFee - promoDiscount;

  const handlePlaceOrder = async () => {
    if (basket.length === 0) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const order = placeOrder(
      fulfillment,
      "42 Admiralty Way, Lekki Phase 1, Lagos",
      payment === "card" ? "Card Payment" : payment === "ussd" ? "USSD Code" : "Bank Transfer"
    );
    setLoading(false);
    router.replace({ pathname: "/order-success", params: { orderId: order.id } });
  };

  if (basket.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.topBar,
            {
              paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
              backgroundColor: colors.background,
            },
          ]}
        >
          <Pressable onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.onSurface} />
          </Pressable>
          <Text style={[styles.topBarTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Checkout
          </Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.emptyState}>
          <Feather name="shopping-bag" size={40} color={colors.outlineVariant} />
          <Text style={[styles.emptyText, { color: colors.onSurface, fontFamily: "Epilogue_600SemiBold" }]}>
            Your basket is empty
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
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.topBarTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
          Checkout
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 120,
          },
        ]}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
              Basket Summary
            </Text>
            <Text style={[styles.itemCount, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
              {basket.length} {basket.length === 1 ? "item" : "items"}
            </Text>
          </View>

          {basket.map((item) => (
            <View
              key={`${item.meal.id}-${item.mealType}`}
              style={[styles.basketItem, { backgroundColor: colors.card }]}
            >
              <Image
                source={item.meal.image}
                style={styles.basketImage}
                resizeMode="cover"
              />
              <View style={styles.basketInfo}>
                <Text style={[styles.basketName, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
                  {item.meal.name}
                </Text>
                <Text style={[styles.basketType, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                  {item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)} Portion
                </Text>
                <Text style={[styles.basketPrice, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>
                  ₦{item.meal.price.toLocaleString()}
                </Text>
              </View>
              <Pressable
                onPress={() => removeFromBasket(item.meal.id)}
                style={[styles.removeBtn, { backgroundColor: colors.surfaceContainer }]}
              >
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Fulfilment
          </Text>
          <View style={styles.fulfillmentRow}>
            {(["delivery", "pickup"] as Fulfillment[]).map((f) => (
              <Pressable
                key={f}
                style={[
                  styles.fulfillmentBtn,
                  {
                    backgroundColor:
                      fulfillment === f
                        ? colors.tertiaryFixed
                        : colors.surfaceContainer,
                    borderColor:
                      fulfillment === f ? colors.secondary : "transparent",
                    borderWidth: 1.5,
                  },
                ]}
                onPress={() => setFulfillment(f)}
              >
                <Feather
                  name={f === "delivery" ? "truck" : "map-pin"}
                  size={20}
                  color={
                    fulfillment === f ? colors.secondary : colors.mutedForeground
                  }
                />
                <Text
                  style={[
                    styles.fulfillmentText,
                    {
                      color:
                        fulfillment === f ? colors.secondary : colors.onSurface,
                      fontFamily: fulfillment === f ? "Manrope_700Bold" : "Manrope_500Medium",
                    },
                  ]}
                >
                  {f === "delivery" ? "Delivery" : "Pickup"}
                </Text>
              </Pressable>
            ))}
          </View>

          {fulfillment === "delivery" && (
            <View
              style={[
                styles.addressCard,
                { backgroundColor: colors.surfaceContainerLow },
              ]}
            >
              <View style={styles.addressHeader}>
                <Text style={[styles.addressLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
                  DELIVERY ADDRESS
                </Text>
                <Pressable>
                  <Text style={[styles.changeText, { color: colors.primary, fontFamily: "Manrope_600SemiBold" }]}>
                    Change
                  </Text>
                </Pressable>
              </View>
              <View style={styles.addressRow}>
                <Feather name="map-pin" size={16} color={colors.primary} />
                <View>
                  <Text style={[styles.addressName, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
                    Home
                  </Text>
                  <Text style={[styles.addressFull, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                    42 Admiralty Way, Lekki Phase 1, Lagos
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Promo Code
          </Text>
          <View style={styles.promoRow}>
            <TextInput
              value={promoCode}
              onChangeText={setPromoCode}
              placeholder="Enter code"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.promoInput,
                {
                  backgroundColor: colors.surfaceContainer,
                  color: colors.onSurface,
                  fontFamily: "Manrope_400Regular",
                  borderColor: promoApplied ? colors.primary : "transparent",
                  borderWidth: promoApplied ? 1.5 : 0,
                },
              ]}
            />
            <Pressable
              style={[styles.promoBtn, { backgroundColor: colors.secondary }]}
              onPress={() => promoCode.length > 0 && setPromoApplied(true)}
            >
              <Text style={[styles.promoBtnText, { fontFamily: "Manrope_700Bold" }]}>
                Apply
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.paymentHeader}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
              Payment Method
            </Text>
            <View style={styles.sslBadge}>
              <Feather name="shield" size={12} color={colors.primary} />
              <Text style={[styles.sslText, { color: colors.primary, fontFamily: "Manrope_600SemiBold" }]}>
                SECURE SSL
              </Text>
            </View>
          </View>

          {[
            { id: "card" as PaymentMethod, icon: "credit-card", label: "Card Payment", sub: "Pay with Mastercard/Visa" },
            { id: "ussd" as PaymentMethod, icon: "phone", label: "USSD Code", sub: "Quick dial from your phone" },
            { id: "bank" as PaymentMethod, icon: "home", label: "Bank Transfer", sub: "Direct bank app transfer" },
          ].map((p) => (
            <Pressable
              key={p.id}
              style={[
                styles.paymentOption,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: payment === p.id ? colors.primary : "transparent",
                  borderWidth: payment === p.id ? 1.5 : 0,
                },
              ]}
              onPress={() => setPayment(p.id)}
            >
              <Feather name={p.icon as any} size={20} color={colors.onSurface} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentLabel, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
                  {p.label}
                </Text>
                <Text style={[styles.paymentSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                  {p.sub}
                </Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: payment === p.id ? colors.primary : colors.outlineVariant },
                ]}
              >
                {payment === p.id && (
                  <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
            </Pressable>
          ))}
        </View>

        <View
          style={[styles.summaryCard, { backgroundColor: colors.surfaceContainer }]}
        >
          {[
            { label: "Subtotal", value: basketTotal },
            { label: "Delivery Fee", value: deliveryFee },
          ].map((row) => (
            <View key={row.label} style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                {row.label}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.onSurface, fontFamily: "Manrope_500Medium" }]}>
                ₦{row.value.toLocaleString()}
              </Text>
            </View>
          ))}
          {promoApplied && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.primary, fontFamily: "Manrope_400Regular" }]}>
                Promo Discount
              </Text>
              <Text style={[styles.summaryValue, { color: colors.primary, fontFamily: "Manrope_500Medium" }]}>
                -₦{promoDiscount.toLocaleString()}
              </Text>
            </View>
          )}
          <View style={[styles.summaryDivider, { backgroundColor: colors.surfaceContainerHigh }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
              Total Amount
            </Text>
            <Text style={[styles.totalValue, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>
              ₦{total.toLocaleString()}
            </Text>
          </View>
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
          style={({ pressed }) => [
            styles.placeOrderBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed || loading ? 0.8 : 1,
            },
          ]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <Text style={[styles.placeOrderText, { fontFamily: "Epilogue_700Bold" }]}>
            {loading ? "Placing Order..." : "Place Order"}
          </Text>
          {!loading && <Feather name="arrow-right" size={18} color="#fff" />}
        </Pressable>
        <Text style={[styles.termsText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
          By placing an order you agree to our Terms & Conditions
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  topBarTitle: { fontSize: 20 },
  scroll: { paddingHorizontal: 20, gap: 24 },
  section: { gap: 12 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 20 },
  itemCount: { fontSize: 14 },
  basketItem: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    gap: 12,
    padding: 12,
    alignItems: "center",
  },
  basketImage: { width: 64, height: 64, borderRadius: 12 },
  basketInfo: { flex: 1, gap: 3 },
  basketName: { fontSize: 15 },
  basketType: { fontSize: 12 },
  basketPrice: { fontSize: 18 },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  fulfillmentRow: { flexDirection: "row", gap: 12 },
  fulfillmentBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 6,
  },
  fulfillmentText: { fontSize: 15 },
  addressCard: { borderRadius: 14, padding: 14, gap: 10 },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addressLabel: { fontSize: 10, letterSpacing: 1 },
  changeText: { fontSize: 13 },
  addressRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  addressName: { fontSize: 15 },
  addressFull: { fontSize: 13, marginTop: 2 },
  promoRow: { flexDirection: "row", gap: 10 },
  promoInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  promoBtn: {
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  promoBtnText: { color: "#fff", fontSize: 15 },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sslBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  sslText: { fontSize: 10, letterSpacing: 0.5 },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
  },
  paymentLabel: { fontSize: 15 },
  paymentSub: { fontSize: 12, marginTop: 2 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  summaryCard: { borderRadius: 16, padding: 16, gap: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14 },
  summaryDivider: { height: 1, borderRadius: 1 },
  totalLabel: { fontSize: 18 },
  totalValue: { fontSize: 22 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 20 },
  browseBtn: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 100 },
  browseBtnText: { color: "#fff", fontSize: 15 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  placeOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    borderRadius: 100,
  },
  placeOrderText: { color: "#fff", fontSize: 17 },
  termsText: { fontSize: 11, textAlign: "center" },
});

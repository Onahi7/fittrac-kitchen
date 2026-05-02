import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Modal,
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

type PaymentMethod = "paystack_card" | "paystack_ussd" | "paystack_transfer" | "opay";
type Fulfillment = "delivery" | "pickup";

function PaystackModal({ visible, total, onClose, onSuccess }: {
  visible: boolean; total: number; onClose: () => void; onSuccess: () => void;
}) {
  const colors = useColors();
  const [step, setStep] = useState<"card" | "otp" | "success">("card");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  const formatCard = (val: string) => val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    return clean.length > 2 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
  };

  const handlePay = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setProcessing(false);
    setStep("otp");
  };

  const handleOtp = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setProcessing(false);
    setStep("success");
    setTimeout(onSuccess, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={() => step !== "success" && !processing && onClose()}>
        <Pressable style={[styles.modalSheet, { backgroundColor: colors.background }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.modalHandle, { backgroundColor: colors.outlineVariant }]} />
          <View style={[styles.psHeader, { borderBottomColor: colors.surfaceContainerHigh }]}>
            <View style={[styles.psLogo, { backgroundColor: "#00C3F7" }]}>
              <Text style={[styles.psLogoText, { fontFamily: "Epilogue_700Bold" }]}>P</Text>
            </View>
            <View>
              <Text style={[styles.psTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Paystack Checkout</Text>
              <Text style={[styles.psSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                Secured by Paystack · SSL Encrypted
              </Text>
            </View>
            <View style={[styles.psAmount, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[styles.psAmountText, { fontFamily: "Epilogue_700Bold", color: "#fff" }]}>₦{total.toLocaleString()}</Text>
            </View>
          </View>

          {step === "card" && (
            <View style={styles.psForm}>
              <Text style={[styles.psLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>CARD NUMBER</Text>
              <TextInput
                value={card}
                onChangeText={(t) => setCard(formatCard(t))}
                placeholder="0000 0000 0000 0000"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                style={[styles.psInput, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, fontFamily: "Manrope_400Regular", borderColor: colors.border }]}
              />
              <View style={styles.psRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.psLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>EXPIRY</Text>
                  <TextInput
                    value={expiry}
                    onChangeText={(t) => setExpiry(formatExpiry(t))}
                    placeholder="MM/YY"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numeric"
                    style={[styles.psInput, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, fontFamily: "Manrope_400Regular", borderColor: colors.border }]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.psLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>CVV</Text>
                  <TextInput
                    value={cvv}
                    onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 3))}
                    placeholder="•••"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numeric"
                    secureTextEntry
                    style={[styles.psInput, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, fontFamily: "Manrope_400Regular", borderColor: colors.border }]}
                  />
                </View>
              </View>
              <Pressable
                style={[styles.psPayBtn, { backgroundColor: "#00C3F7", opacity: processing ? 0.7 : 1 }]}
                onPress={handlePay}
                disabled={processing}
              >
                <Text style={[styles.psPayText, { fontFamily: "Epilogue_700Bold" }]}>
                  {processing ? "Processing..." : `Pay ₦${total.toLocaleString()}`}
                </Text>
              </Pressable>
            </View>
          )}

          {step === "otp" && (
            <View style={styles.psForm}>
              <View style={[styles.otpIcon, { backgroundColor: "#E3F2FD" }]}>
                <Feather name="message-square" size={28} color="#1565C0" />
              </View>
              <Text style={[styles.otpTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Enter OTP</Text>
              <Text style={[styles.otpSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                A one-time PIN has been sent to your registered phone number ending in **45.
              </Text>
              <TextInput
                placeholder="_ _ _ _ _ _"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                maxLength={6}
                style={[styles.psInput, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, fontFamily: "Manrope_600SemiBold", textAlign: "center", fontSize: 22, letterSpacing: 8, borderColor: colors.border }]}
              />
              <Pressable
                style={[styles.psPayBtn, { backgroundColor: "#00C3F7", opacity: processing ? 0.7 : 1 }]}
                onPress={handleOtp}
                disabled={processing}
              >
                <Text style={[styles.psPayText, { fontFamily: "Epilogue_700Bold" }]}>
                  {processing ? "Verifying..." : "Confirm Payment"}
                </Text>
              </Pressable>
            </View>
          )}

          {step === "success" && (
            <View style={styles.psSuccess}>
              <View style={[styles.psSuccessIcon, { backgroundColor: "#E8F5E9" }]}>
                <Feather name="check-circle" size={48} color="#154212" />
              </View>
              <Text style={[styles.psSuccessTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Payment Successful!</Text>
              <Text style={[styles.psSuccessSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                ₦{total.toLocaleString()} paid via Paystack
              </Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function OPayModal({ visible, total, onClose, onSuccess }: {
  visible: boolean; total: number; onClose: () => void; onSuccess: () => void;
}) {
  const colors = useColors();
  const [method, setMethod] = useState<"bank" | "ussd" | "wallet">("bank");
  const [phone, setPhone] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePay = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1800));
    setProcessing(false);
    setSuccess(true);
    setTimeout(onSuccess, 1200);
  };

  const METHODS = [
    { id: "bank" as const, label: "Bank Transfer", icon: "home" as const },
    { id: "ussd" as const, label: "USSD", icon: "phone" as const },
    { id: "wallet" as const, label: "OPay Wallet", icon: "credit-card" as const },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={() => !processing && !success && onClose()}>
        <Pressable style={[styles.modalSheet, { backgroundColor: colors.background }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.modalHandle, { backgroundColor: colors.outlineVariant }]} />
          <View style={[styles.psHeader, { borderBottomColor: colors.surfaceContainerHigh }]}>
            <View style={[styles.psLogo, { backgroundColor: "#1DB954" }]}>
              <Text style={[styles.psLogoText, { fontFamily: "Epilogue_700Bold" }]}>O</Text>
            </View>
            <View>
              <Text style={[styles.psTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>OPay Checkout</Text>
              <Text style={[styles.psSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                Fast, Secure Nigerian Payments
              </Text>
            </View>
            <View style={[styles.psAmount, { backgroundColor: "#1DB954" }]}>
              <Text style={[styles.psAmountText, { fontFamily: "Epilogue_700Bold", color: "#fff" }]}>₦{total.toLocaleString()}</Text>
            </View>
          </View>

          {success ? (
            <View style={styles.psSuccess}>
              <View style={[styles.psSuccessIcon, { backgroundColor: "#E8F5E9" }]}>
                <Feather name="check-circle" size={48} color="#1DB954" />
              </View>
              <Text style={[styles.psSuccessTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Payment Successful!</Text>
              <Text style={[styles.psSuccessSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                ₦{total.toLocaleString()} paid via OPay
              </Text>
            </View>
          ) : (
            <View style={styles.psForm}>
              <View style={styles.opayMethods}>
                {METHODS.map((m) => (
                  <Pressable
                    key={m.id}
                    style={[styles.opayMethodBtn, {
                      backgroundColor: method === m.id ? "#1DB95415" : colors.surfaceContainerLow,
                      borderColor: method === m.id ? "#1DB954" : "transparent",
                      borderWidth: method === m.id ? 1.5 : 0,
                    }]}
                    onPress={() => setMethod(m.id)}
                  >
                    <Feather name={m.icon} size={18} color={method === m.id ? "#1DB954" : colors.onSurface} />
                    <Text style={[styles.opayMethodText, { color: method === m.id ? "#1DB954" : colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
                      {m.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.psLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
                {method === "wallet" ? "OPAY PHONE NUMBER" : method === "ussd" ? "YOUR PHONE NUMBER" : "ACCOUNT NUMBER"}
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder={method === "bank" ? "0123456789" : "08012345678"}
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                style={[styles.psInput, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, fontFamily: "Manrope_400Regular", borderColor: colors.border }]}
              />

              {method === "ussd" && (
                <View style={[styles.ussdCode, { backgroundColor: colors.surfaceContainerLow }]}>
                  <Text style={[styles.ussdLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>Dial this USSD code:</Text>
                  <Text style={[styles.ussdValue, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>
                    *955*000*{total}#
                  </Text>
                </View>
              )}

              <Pressable
                style={[styles.psPayBtn, { backgroundColor: "#1DB954", opacity: processing ? 0.7 : 1 }]}
                onPress={handlePay}
                disabled={processing}
              >
                <Text style={[styles.psPayText, { fontFamily: "Epilogue_700Bold" }]}>
                  {processing ? "Processing..." : `Pay ₦${total.toLocaleString()}`}
                </Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { basket, basketTotal, removeFromBasket, placeOrder } = useApp();
  const [fulfillment, setFulfillment] = useState<Fulfillment>("delivery");
  const [payment, setPayment] = useState<PaymentMethod>("paystack_card");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);
  const [showOpay, setShowOpay] = useState(false);

  const deliveryFee = fulfillment === "delivery" ? DELIVERY_FEE : 0;
  const promoDiscount = promoApplied ? 500 : 0;
  const total = basketTotal + deliveryFee - promoDiscount;

  const handlePlaceOrder = async () => {
    if (basket.length === 0) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (payment === "opay") { setShowOpay(true); return; }
    setShowPaystack(true);
  };

  const finishOrder = () => {
    setShowPaystack(false);
    setShowOpay(false);
    setLoading(true);
    setTimeout(() => {
      const label =
        payment === "paystack_card" ? "Paystack Card"
        : payment === "paystack_ussd" ? "Paystack USSD"
        : payment === "paystack_transfer" ? "Paystack Transfer"
        : "OPay";
      const order = placeOrder(fulfillment, "42 Admiralty Way, Lekki Phase 1, Lagos", label);
      setLoading(false);
      router.replace({ pathname: "/order-success", params: { orderId: order.id } });
    }, 300);
  };

  const PAYMENT_OPTIONS = [
    {
      id: "paystack_card" as PaymentMethod,
      icon: "credit-card" as const,
      label: "Paystack · Card",
      sub: "Mastercard, Visa, Verve",
      brand: "#00C3F7",
    },
    {
      id: "paystack_ussd" as PaymentMethod,
      icon: "phone" as const,
      label: "Paystack · USSD",
      sub: "Quick dial from any phone",
      brand: "#00C3F7",
    },
    {
      id: "paystack_transfer" as PaymentMethod,
      icon: "home" as const,
      label: "Paystack · Bank Transfer",
      sub: "Direct from banking app",
      brand: "#00C3F7",
    },
    {
      id: "opay" as PaymentMethod,
      icon: "zap" as const,
      label: "OPay",
      sub: "OPay wallet, bank or USSD",
      brand: "#1DB954",
    },
  ];

  if (basket.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16, backgroundColor: colors.background }]}>
          <Pressable onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.onSurface} />
          </Pressable>
          <Text style={[styles.topBarTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Checkout</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.emptyState}>
          <Feather name="shopping-bag" size={40} color={colors.outlineVariant} />
          <Text style={[styles.emptyText, { color: colors.onSurface, fontFamily: "Epilogue_600SemiBold" }]}>Your basket is empty</Text>
          <Pressable style={[styles.browseBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/(tabs)/menu")}>
            <Text style={[styles.browseBtnText, { fontFamily: "Manrope_600SemiBold" }]}>Browse Menu</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16, backgroundColor: colors.background }]}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.topBarTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Checkout</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 120 }]}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Basket Summary</Text>
            <Text style={[styles.itemCount, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
              {basket.length} {basket.length === 1 ? "item" : "items"}
            </Text>
          </View>
          {basket.map((item) => (
            <View key={`${item.meal.id}-${item.mealType}`} style={[styles.basketItem, { backgroundColor: colors.card }]}>
              <Image source={item.meal.image} style={styles.basketImage} resizeMode="cover" />
              <View style={styles.basketInfo}>
                <Text style={[styles.basketName, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>{item.meal.name}</Text>
                <Text style={[styles.basketType, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                  {item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)} Portion
                </Text>
                <Text style={[styles.basketPrice, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>₦{item.meal.price.toLocaleString()}</Text>
              </View>
              <Pressable onPress={() => removeFromBasket(item.meal.id)} style={[styles.removeBtn, { backgroundColor: colors.surfaceContainer }]}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Fulfilment</Text>
          <View style={styles.fulfillmentRow}>
            {(["delivery", "pickup"] as Fulfillment[]).map((f) => (
              <Pressable
                key={f}
                style={[styles.fulfillmentBtn, {
                  backgroundColor: fulfillment === f ? colors.tertiaryFixed : colors.surfaceContainer,
                  borderColor: fulfillment === f ? colors.secondary : "transparent",
                  borderWidth: 1.5,
                }]}
                onPress={() => setFulfillment(f)}
              >
                <Feather name={f === "delivery" ? "truck" : "map-pin"} size={20} color={fulfillment === f ? colors.secondary : colors.mutedForeground} />
                <Text style={[styles.fulfillmentText, {
                  color: fulfillment === f ? colors.secondary : colors.onSurface,
                  fontFamily: fulfillment === f ? "Manrope_700Bold" : "Manrope_500Medium",
                }]}>
                  {f === "delivery" ? "Delivery" : "Pickup"}
                </Text>
              </Pressable>
            ))}
          </View>
          {fulfillment === "delivery" && (
            <View style={[styles.addressCard, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={styles.addressHeader}>
                <Text style={[styles.addressLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>DELIVERY ADDRESS</Text>
                <Pressable><Text style={[styles.changeText, { color: colors.primary, fontFamily: "Manrope_600SemiBold" }]}>Change</Text></Pressable>
              </View>
              <View style={styles.addressRow}>
                <Feather name="map-pin" size={16} color={colors.primary} />
                <View>
                  <Text style={[styles.addressName, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>Home</Text>
                  <Text style={[styles.addressFull, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                    42 Admiralty Way, Lekki Phase 1, Lagos
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Promo Code</Text>
          <View style={styles.promoRow}>
            <TextInput
              value={promoCode}
              onChangeText={setPromoCode}
              placeholder="Enter code"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.promoInput, {
                backgroundColor: colors.surfaceContainer,
                color: colors.onSurface,
                fontFamily: "Manrope_400Regular",
                borderColor: promoApplied ? colors.primary : "transparent",
                borderWidth: promoApplied ? 1.5 : 0,
              }]}
            />
            <Pressable style={[styles.promoBtn, { backgroundColor: colors.secondary }]} onPress={() => promoCode.length > 0 && setPromoApplied(true)}>
              <Text style={[styles.promoBtnText, { fontFamily: "Manrope_700Bold" }]}>Apply</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.paymentHeader}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Payment Method</Text>
            <View style={styles.sslBadge}>
              <Feather name="shield" size={12} color={colors.primary} />
              <Text style={[styles.sslText, { color: colors.primary, fontFamily: "Manrope_600SemiBold" }]}>SECURE SSL</Text>
            </View>
          </View>

          {PAYMENT_OPTIONS.map((p) => (
            <Pressable
              key={p.id}
              style={[styles.paymentOption, {
                backgroundColor: colors.surfaceContainerLow,
                borderColor: payment === p.id ? p.brand : "transparent",
                borderWidth: payment === p.id ? 1.5 : 0,
              }]}
              onPress={() => setPayment(p.id)}
            >
              <View style={[styles.paymentBrandDot, { backgroundColor: `${p.brand}20` }]}>
                <Feather name={p.icon} size={18} color={p.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentLabel, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>{p.label}</Text>
                <Text style={[styles.paymentSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>{p.sub}</Text>
              </View>
              <View style={[styles.radioOuter, { borderColor: payment === p.id ? p.brand : colors.outlineVariant }]}>
                {payment === p.id && <View style={[styles.radioInner, { backgroundColor: p.brand }]} />}
              </View>
            </Pressable>
          ))}
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.surfaceContainer }]}>
          {[
            { label: "Subtotal", value: basketTotal },
            { label: "Delivery Fee", value: deliveryFee },
          ].map((row) => (
            <View key={row.label} style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>{row.label}</Text>
              <Text style={[styles.summaryValue, { color: colors.onSurface, fontFamily: "Manrope_500Medium" }]}>₦{row.value.toLocaleString()}</Text>
            </View>
          ))}
          {promoApplied && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.primary, fontFamily: "Manrope_400Regular" }]}>Promo Discount</Text>
              <Text style={[styles.summaryValue, { color: colors.primary, fontFamily: "Manrope_500Medium" }]}>-₦{promoDiscount.toLocaleString()}</Text>
            </View>
          )}
          <View style={[styles.summaryDivider, { backgroundColor: colors.surfaceContainerHigh }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>₦{total.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 16 }]}>
        <Pressable
          style={({ pressed }) => [styles.placeOrderBtn, { backgroundColor: colors.primary, opacity: pressed || loading ? 0.8 : 1 }]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <Text style={[styles.placeOrderText, { fontFamily: "Epilogue_700Bold" }]}>
            {loading ? "Processing..." : "Proceed to Payment"}
          </Text>
          {!loading && <Feather name="arrow-right" size={18} color="#fff" />}
        </Pressable>
        <Text style={[styles.termsText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
          By placing an order you agree to our Terms & Conditions
        </Text>
      </View>

      <PaystackModal
        visible={showPaystack}
        total={total}
        onClose={() => setShowPaystack(false)}
        onSuccess={finishOrder}
      />
      <OPayModal
        visible={showOpay}
        total={total}
        onClose={() => setShowOpay(false)}
        onSuccess={finishOrder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 },
  topBarTitle: { fontSize: 20 },
  scroll: { paddingHorizontal: 20, gap: 24 },
  section: { gap: 12 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 20 },
  itemCount: { fontSize: 14 },
  basketItem: { flexDirection: "row", borderRadius: 16, overflow: "hidden", gap: 12, padding: 12, alignItems: "center" },
  basketImage: { width: 64, height: 64, borderRadius: 12 },
  basketInfo: { flex: 1, gap: 3 },
  basketName: { fontSize: 15 },
  basketType: { fontSize: 12 },
  basketPrice: { fontSize: 18 },
  removeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  fulfillmentRow: { flexDirection: "row", gap: 12 },
  fulfillmentBtn: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 16, gap: 6 },
  fulfillmentText: { fontSize: 15 },
  addressCard: { borderRadius: 14, padding: 14, gap: 10 },
  addressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addressLabel: { fontSize: 10, letterSpacing: 1 },
  changeText: { fontSize: 13 },
  addressRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  addressName: { fontSize: 15 },
  addressFull: { fontSize: 13, marginTop: 2 },
  promoRow: { flexDirection: "row", gap: 10 },
  promoInput: { flex: 1, height: 48, borderRadius: 12, paddingHorizontal: 16, fontSize: 15 },
  promoBtn: { paddingHorizontal: 20, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  promoBtnText: { color: "#fff", fontSize: 15 },
  paymentHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  sslBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#E8F5E9", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  sslText: { fontSize: 10, letterSpacing: 0.5 },
  paymentOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14 },
  paymentBrandDot: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  paymentLabel: { fontSize: 15 },
  paymentSub: { fontSize: 12, marginTop: 2 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
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
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, gap: 8 },
  placeOrderBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17, borderRadius: 100 },
  placeOrderText: { color: "#fff", fontSize: 17 },
  termsText: { fontSize: 11, textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, gap: 0 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  psHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 18, borderBottomWidth: 1, marginBottom: 20 },
  psLogo: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  psLogoText: { color: "#fff", fontSize: 20 },
  psTitle: { fontSize: 16 },
  psSub: { fontSize: 12, marginTop: 1 },
  psAmount: { marginLeft: "auto", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100 },
  psAmountText: { fontSize: 14 },
  psForm: { gap: 14 },
  psLabel: { fontSize: 10, letterSpacing: 1, marginBottom: -6 },
  psInput: { height: 52, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, borderWidth: 1 },
  psRow: { flexDirection: "row", gap: 12 },
  psPayBtn: { height: 52, borderRadius: 100, alignItems: "center", justifyContent: "center", marginTop: 4 },
  psPayText: { color: "#fff", fontSize: 16 },
  otpIcon: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  otpTitle: { fontSize: 22, textAlign: "center" },
  otpSub: { fontSize: 14, lineHeight: 20, textAlign: "center", color: "#888" },
  psSuccess: { alignItems: "center", paddingVertical: 24, gap: 12 },
  psSuccessIcon: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  psSuccessTitle: { fontSize: 24 },
  psSuccessSub: { fontSize: 15 },
  opayMethods: { flexDirection: "row", gap: 10 },
  opayMethodBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, gap: 6 },
  opayMethodText: { fontSize: 11 },
  ussdCode: { borderRadius: 12, padding: 16, alignItems: "center", gap: 6 },
  ussdLabel: { fontSize: 12 },
  ussdValue: { fontSize: 22 },
});

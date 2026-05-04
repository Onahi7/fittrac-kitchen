import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRider } from "@/context/RiderContext";
import { useColors } from "@/hooks/useColors";

const DEMO = { phone: "08030000001", pin: "1234" };

export default function RiderLoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useRider();

  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!phone.trim() || !pin.trim()) {
      setError("Enter your phone and rider PIN.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError("");
    try {
      await login(phone.trim(), pin.trim());
      router.replace("/(rider-tabs)/rider-home");
    } catch (e: any) {
      setError(e.message ?? "Rider login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setPhone(DEMO.phone);
    setPin(DEMO.pin);
    setError("");
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}
      >
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={20} color={colors.onSurface} />
        </Pressable>

        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Feather name="truck" size={28} color="#fff" />
          </View>
          <Text style={[styles.title, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Fittrac Rider</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            Delivery partner app
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {error !== "" && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color="#DC2626" />
              <Text style={[styles.errorText, { fontFamily: "Manrope_500Medium" }]}>{error}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Manrope_600SemiBold" }]}>Phone</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Feather name="phone" size={16} color={colors.outline} />
              <TextInput
                style={[styles.input, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="08030000001"
                placeholderTextColor={colors.outline}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Manrope_600SemiBold" }]}>PIN</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Feather name="lock" size={16} color={colors.outline} />
              <TextInput
                style={[styles.input, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                placeholder="1234"
                placeholderTextColor={colors.outline}
              />
            </View>
          </View>

          <Pressable style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.75 : 1 }]} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.buttonText, { fontFamily: "Manrope_700Bold" }]}>Go Online</Text>}
          </Pressable>
        </View>

        <Pressable style={[styles.demoCard, { backgroundColor: "#E8F5E9", borderColor: colors.primary + "30" }]} onPress={fillDemo}>
          <Feather name="zap" size={16} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.demoTitle, { color: colors.primary, fontFamily: "Manrope_700Bold" }]}>Quick Demo Access</Text>
            <Text style={[styles.demoText, { color: colors.primary, fontFamily: "Manrope_400Regular" }]}>{DEMO.phone} / {DEMO.pin}</Text>
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24 },
  back: { marginBottom: 24, alignSelf: "flex-start" },
  header: { alignItems: "center", marginBottom: 32, gap: 8 },
  logo: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26 },
  subtitle: { fontSize: 14 },
  card: { borderRadius: 20, borderWidth: 1, padding: 22, gap: 16, marginBottom: 20 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", borderColor: "#FCA5A5", borderWidth: 1, borderRadius: 10, padding: 12 },
  errorText: { color: "#DC2626", fontSize: 13, flex: 1 },
  field: { gap: 6 },
  label: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  input: { flex: 1, fontSize: 15 },
  button: { borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 2 },
  buttonText: { color: "#fff", fontSize: 16 },
  demoCard: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  demoTitle: { fontSize: 13 },
  demoText: { fontSize: 12, opacity: 0.78, marginTop: 2 },
});

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
import { useClinicalAuth } from "@/context/ClinicalAuthContext";
import { useColors } from "@/hooks/useColors";

const DEMO_CREDS = [
  { label: "Doctor", user: "dr.amara", pass: "doctor2026", icon: "activity" as const, color: "#154212", bg: "#E8F5E9" },
  { label: "Nutritionist", user: "nutri.kezia", pass: "nutri2026", icon: "heart" as const, color: "#8B500A", bg: "#FFF3E0" },
];

export default function ClinicalLoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useClinicalAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter your credentials.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError("");
    try {
      await login(username.trim(), password.trim());
      router.replace("/(clinical-tabs)/cl-home");
    } catch (e: any) {
      setError(e.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (user: string, pass: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setUsername(user);
    setPassword(pass);
    setError("");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Feather name="arrow-left" size={20} color={colors.onSurface} />
        </Pressable>

        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Feather name="shield" size={28} color="#fff" />
          </View>
          <Text style={[styles.title, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Fittrac Clinical
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            Provider Command Center
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Sign In
          </Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            Enter your provider credentials
          </Text>

          {error !== "" && (
            <View style={[styles.errorBox, { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" }]}>
              <Feather name="alert-circle" size={14} color="#DC2626" />
              <Text style={[styles.errorText, { fontFamily: "Manrope_500Medium" }]}>{error}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
              Username
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Feather name="user" size={16} color={colors.outline} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.input, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="dr.amara"
                placeholderTextColor={colors.outline}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
              Password
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Feather name="lock" size={16} color={colors.outline} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.input, { color: colors.onSurface, fontFamily: "Manrope_400Regular", flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="••••••••"
                placeholderTextColor={colors.outline}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.outline} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.btn, { backgroundColor: loading ? colors.primaryContainer : colors.primary, opacity: loading ? 0.8 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.btnText, { fontFamily: "Manrope_700Bold" }]}>Sign In</Text>
            )}
          </Pressable>
        </View>

        <Text style={[styles.demoLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
          Quick Demo Access
        </Text>
        <View style={styles.demoRow}>
          {DEMO_CREDS.map((d) => (
            <Pressable
              key={d.label}
              style={[styles.demoCard, { backgroundColor: d.bg, borderColor: d.color + "30" }]}
              onPress={() => fillDemo(d.user, d.pass)}
            >
              <View style={[styles.demoIcon, { backgroundColor: d.color }]}>
                <Feather name={d.icon} size={16} color="#fff" />
              </View>
              <Text style={[styles.demoRole, { color: d.color, fontFamily: "Epilogue_700Bold" }]}>{d.label}</Text>
              <Text style={[styles.demoUser, { color: d.color + "BB", fontFamily: "Manrope_400Regular" }]}>{d.user}</Text>
              <Text style={[styles.demoUser, { color: d.color + "BB", fontFamily: "Manrope_400Regular" }]}>{d.pass}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 24, gap: 0 },
  backBtn: { marginBottom: 24, alignSelf: "flex-start" },
  header: { alignItems: "center", marginBottom: 32, gap: 8 },
  logoCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  title: { fontSize: 26, letterSpacing: -0.5 },
  subtitle: { fontSize: 14 },
  card: { borderRadius: 20, borderWidth: 1, padding: 24, marginBottom: 32, gap: 16 },
  cardTitle: { fontSize: 20 },
  cardSub: { fontSize: 13, marginTop: -8 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, padding: 12 },
  errorText: { color: "#DC2626", fontSize: 13, flex: 1 },
  field: { gap: 6 },
  label: { fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  input: { fontSize: 15, flex: 1 },
  btn: { borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  btnText: { color: "#fff", fontSize: 16 },
  demoLabel: { fontSize: 12, textAlign: "center", marginBottom: 12, letterSpacing: 0.5, textTransform: "uppercase" },
  demoRow: { flexDirection: "row", gap: 12 },
  demoCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, alignItems: "center", gap: 6 },
  demoIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  demoRole: { fontSize: 14 },
  demoUser: { fontSize: 11 },
});

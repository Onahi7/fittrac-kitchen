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
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoogleLoading(true);
    setError("");
    try {
      await loginWithGoogle();
    } catch (e: any) {
      setError(e.message ?? "Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please enter your email and password");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setError("");
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      setError(e.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 32,
            paddingBottom: insets.bottom + 40,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.logoBox, { backgroundColor: colors.primaryContainer }]}>
            <Feather name="heart" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>
            Welcome back
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            Sign in to your Fittrac Kitchen account
          </Text>
        </View>

        <View style={styles.form}>
          <View>
            <Text style={[styles.label, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
              Email address
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}>
              <Feather name="mail" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View>
            <Text style={[styles.label, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
              Password
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword((p) => !p)}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: "#FFF0F0", borderColor: "#FFCCCC" }]}>
              <Feather name="alert-circle" size={14} color="#CC0000" />
              <Text style={[styles.errorText, { fontFamily: "Manrope_400Regular" }]}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: colors.primary, opacity: pressed || loading ? 0.8 : 1 },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={[styles.btnText, { fontFamily: "Epilogue_700Bold" }]}>Sign In</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
              Don't have an account?
            </Text>
            <Pressable onPress={() => router.replace("/register")}>
              <Text style={[styles.switchLink, { color: colors.primary, fontFamily: "Manrope_700Bold" }]}>
                Sign up
              </Text>
            </Pressable>
          </View>

          <View style={[styles.divider, { borderColor: colors.outlineVariant }]}>
            <Text style={[styles.dividerText, { color: colors.mutedForeground, backgroundColor: colors.background, fontFamily: "Manrope_400Regular" }]}>
              or
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.providerBtn,
              { borderColor: colors.outlineVariant, opacity: pressed || googleLoading ? 0.7 : 1 },
            ]}
            onPress={handleGoogleLogin}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={{ fontSize: 17 }}>G</Text>
            )}
            <Text style={[styles.providerText, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
              Continue with Google
            </Text>
          </Pressable>

          <View style={[styles.divider, { borderColor: colors.outlineVariant }]}>
            <Text style={[styles.dividerText, { color: colors.mutedForeground, backgroundColor: colors.background, fontFamily: "Manrope_400Regular" }]}>
              or
            </Text>
          </View>

          <Pressable
            style={[styles.providerBtn, { borderColor: colors.outlineVariant }]}
            onPress={() => router.push("/staff-login")}
          >
            <Feather name="briefcase" size={16} color={colors.primary} />
            <Text style={[styles.providerText, { color: colors.primary, fontFamily: "Manrope_600SemiBold" }]}>
              Staff login
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  header: { alignItems: "center", gap: 12, marginBottom: 36 },
  logoBox: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 30, textAlign: "center" },
  subtitle: { fontSize: 15, textAlign: "center" },
  form: { gap: 16 },
  label: { fontSize: 14, marginBottom: 6 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 14,
    borderRadius: 14, borderWidth: 1.5,
  },
  input: { flex: 1, fontSize: 15 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  errorText: { flex: 1, fontSize: 13, color: "#CC0000" },
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 17, borderRadius: 100,
  },
  btnText: { color: "#fff", fontSize: 17 },
  switchRow: { flexDirection: "row", justifyContent: "center", gap: 6, alignItems: "center" },
  switchText: { fontSize: 14 },
  switchLink: { fontSize: 14 },
  divider: {
    borderTopWidth: 1, alignItems: "center", marginVertical: 4,
  },
  dividerText: { fontSize: 12, paddingHorizontal: 12, marginTop: -9 },
  providerBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 100, borderWidth: 1.5,
  },
  providerText: { fontSize: 14 },
});

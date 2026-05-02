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
import { CONDITIONS } from "@/constants/data";
import type { Condition } from "@/constants/types";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleCondition = (id: Condition) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSelectedConditions((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (!email.trim() || !email.includes("@")) { setError("Please enter a valid email"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setError("");
    setStep(2);
  };

  const handleRegister = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setError("");
    try {
      await register(name.trim(), email.trim().toLowerCase(), phone.trim(), password, selectedConditions);
    } catch (e: any) {
      setError(e.message ?? "Registration failed");
      setStep(1);
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
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 24,
            paddingBottom: insets.bottom + 40,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.logoBox, { backgroundColor: colors.primaryContainer }]}>
            <Feather name="user-plus" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>
            Create your account
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            {step === 1 ? "Your details" : "Select your health conditions"}
          </Text>
          <View style={styles.steps}>
            <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
            <View style={[styles.stepLine, { backgroundColor: step === 2 ? colors.primary : colors.outlineVariant }]} />
            <View style={[styles.stepDot, { backgroundColor: step === 2 ? colors.primary : colors.outlineVariant }]} />
          </View>
        </View>

        {step === 1 ? (
          <View style={styles.form}>
            <View>
              <Text style={[styles.label, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>Full name</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}>
                <Feather name="user" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}
                  placeholder="Amaka Okonkwo"
                  placeholderTextColor={colors.mutedForeground}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View>
              <Text style={[styles.label, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>Email address</Text>
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
              <Text style={[styles.label, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>Phone number <Text style={{ fontWeight: "400", color: colors.mutedForeground }}>(optional)</Text></Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}>
                <Feather name="phone" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}
                  placeholder="08031234567"
                  placeholderTextColor={colors.mutedForeground}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View>
              <Text style={[styles.label, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>Password</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}>
                <Feather name="lock" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}
                  placeholder="Min. 6 characters"
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

            <View>
              <Text style={[styles.label, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>Confirm password</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}>
                <Feather name="lock" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.mutedForeground}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: "#FFF0F0", borderColor: "#FFCCCC" }]}>
                <Feather name="alert-circle" size={14} color="#CC0000" />
                <Text style={[styles.errorText, { fontFamily: "Manrope_400Regular" }]}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [styles.btn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
              onPress={handleNext}
            >
              <Text style={[styles.btnText, { fontFamily: "Epilogue_700Bold" }]}>Continue</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>

            <View style={styles.switchRow}>
              <Text style={[styles.switchText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                Already have an account?
              </Text>
              <Pressable onPress={() => router.replace("/login")}>
                <Text style={[styles.switchLink, { color: colors.primary, fontFamily: "Manrope_700Bold" }]}>
                  Sign in
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={[styles.condNote, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
              We use this to personalise your meal recommendations. You can update it anytime.
            </Text>
            {CONDITIONS.map((condition) => {
              const isSelected = selectedConditions.includes(condition.id);
              return (
                <Pressable
                  key={condition.id}
                  style={({ pressed }) => [
                    styles.condCard,
                    {
                      backgroundColor: isSelected ? colors.primaryContainer : colors.surfaceContainer,
                      borderColor: isSelected ? colors.primary : "transparent",
                      borderWidth: 2,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                  onPress={() => toggleCondition(condition.id)}
                >
                  <View style={styles.condRow}>
                    <View style={[styles.condIcon, { backgroundColor: isSelected ? colors.primary : colors.surfaceContainerHigh }]}>
                      <Feather name={condition.icon as any} size={18} color={isSelected ? "#fff" : condition.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.condLabel, { color: isSelected ? "#fff" : colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
                        {condition.label}
                      </Text>
                      <Text style={[styles.condDesc, { color: isSelected ? colors.onPrimaryContainer : colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                        {condition.description}
                      </Text>
                    </View>
                    {isSelected && <Feather name="check-circle" size={20} color={colors.onPrimaryContainer} />}
                  </View>
                </Pressable>
              );
            })}

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: "#FFF0F0", borderColor: "#FFCCCC" }]}>
                <Feather name="alert-circle" size={14} color="#CC0000" />
                <Text style={[styles.errorText, { fontFamily: "Manrope_400Regular" }]}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [styles.btn, { backgroundColor: colors.primary, opacity: pressed || loading ? 0.8 : 1 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={[styles.btnText, { fontFamily: "Epilogue_700Bold" }]}>Create Account</Text>
                  <Feather name="check" size={18} color="#fff" />
                </>
              )}
            </Pressable>

            <Pressable style={styles.backBtn} onPress={() => { setError(""); setStep(1); }}>
              <Feather name="arrow-left" size={15} color={colors.mutedForeground} />
              <Text style={[styles.backText, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>Back</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  header: { alignItems: "center", gap: 10, marginBottom: 28 },
  logoBox: { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center" },
  steps: { flexDirection: "row", alignItems: "center", gap: 0, marginTop: 4 },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  stepLine: { width: 40, height: 2, borderRadius: 1 },
  form: { gap: 14 },
  label: { fontSize: 14, marginBottom: 6 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
  },
  input: { flex: 1, fontSize: 15 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  errorText: { flex: 1, fontSize: 13, color: "#CC0000" },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17, borderRadius: 100 },
  btnText: { color: "#fff", fontSize: 17 },
  switchRow: { flexDirection: "row", justifyContent: "center", gap: 6, alignItems: "center" },
  switchText: { fontSize: 14 },
  switchLink: { fontSize: 14 },
  condNote: { fontSize: 13, lineHeight: 19 },
  condCard: { borderRadius: 16, padding: 14 },
  condRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  condIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  condLabel: { fontSize: 16, marginBottom: 2 },
  condDesc: { fontSize: 12, lineHeight: 17 },
  backBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8 },
  backText: { fontSize: 14 },
});

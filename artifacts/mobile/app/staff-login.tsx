import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { useRider } from "@/context/RiderContext";
import { useColors } from "@/hooks/useColors";

const STAFF_DEMOS = [
  {
    label: "Doctor",
    id: "dr.amara",
    code: "doctor2026",
    icon: "activity" as const,
    color: "#154212",
    bg: "#E8F5E9",
  },
  {
    label: "Nutritionist",
    id: "nutri.kezia",
    code: "nutri2026",
    icon: "heart" as const,
    color: "#8B500A",
    bg: "#FFF3E0",
  },
  {
    label: "Rider",
    id: "rid-001",
    code: "1234",
    icon: "truck" as const,
    color: "#1D4ED8",
    bg: "#EFF6FF",
  },
];

function inferRole(identifier: string) {
  const id = identifier.trim().toLowerCase();
  if (id.startsWith("dr.") || id.startsWith("nutri.")) return "clinical";
  if (id.startsWith("rid-") || /^\+?\d/.test(id)) return "rider";
  return "unknown";
}

export default function StaffLoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const clinicalAuth = useClinicalAuth();
  const riderAuth = useRider();

  const [staffId, setStaffId] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roleHint = useMemo(() => inferRole(staffId), [staffId]);
  const roleText = roleHint === "clinical" ? "Clinical staff" : roleHint === "rider" ? "Rider partner" : "Auto-detect role";

  const submit = async () => {
    const id = staffId.trim();
    const code = accessCode.trim();
    if (!id || !code) {
      setError("Enter staff ID and access code.");
      return;
    }

    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError("");

    const role = inferRole(id);
    try {
      if (role === "clinical") {
        await clinicalAuth.login(id, code);
        router.replace("/(clinical-tabs)/cl-home");
        return;
      }

      if (role === "rider") {
        await riderAuth.login(id, code);
        router.replace("/(rider-tabs)/rider-home");
        return;
      }

      try {
        await clinicalAuth.login(id, code);
        router.replace("/(clinical-tabs)/cl-home");
      } catch {
        await riderAuth.login(id, code);
        router.replace("/(rider-tabs)/rider-home");
      }
    } catch (e: any) {
      setError(e.message ?? "Staff login failed. Check the ID and access code.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (id: string, code: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setStaffId(id);
    setAccessCode(code);
    setError("");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
            <Feather name="briefcase" size={28} color="#fff" />
          </View>
          <Text style={[styles.title, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Staff Login</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            Use your assigned ID to open the right workspace
          </Text>
        </View>

        <View style={[styles.roleHint, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "28" }]}>
          <Feather name={roleHint === "rider" ? "truck" : roleHint === "clinical" ? "shield" : "shuffle"} size={15} color={colors.primary} />
          <Text style={[styles.roleHintText, { color: colors.primary, fontFamily: "Manrope_700Bold" }]}>{roleText}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {error !== "" && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color="#DC2626" />
              <Text style={[styles.errorText, { fontFamily: "Manrope_500Medium" }]}>{error}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Manrope_600SemiBold" }]}>Staff ID</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Feather name="user-check" size={16} color={colors.outline} />
              <TextInput
                style={[styles.input, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}
                value={staffId}
                onChangeText={setStaffId}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="dr.amara, nutri.kezia, rid-001"
                placeholderTextColor={colors.outline}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Manrope_600SemiBold" }]}>Access Code</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Feather name="lock" size={16} color={colors.outline} />
              <TextInput
                style={[styles.input, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}
                value={accessCode}
                onChangeText={setAccessCode}
                secureTextEntry={!showCode}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Password or rider PIN"
                placeholderTextColor={colors.outline}
              />
              <Pressable onPress={() => setShowCode((v) => !v)} hitSlop={8}>
                <Feather name={showCode ? "eye-off" : "eye"} size={16} color={colors.outline} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.78 : 1 }]}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={[styles.buttonText, { fontFamily: "Manrope_700Bold" }]}>Continue</Text>
                <Feather name="arrow-right" size={17} color="#fff" />
              </>
            )}
          </Pressable>
        </View>

        <Text style={[styles.demoLabel, { color: colors.mutedForeground, fontFamily: "Manrope_600SemiBold" }]}>Demo IDs</Text>
        <View style={styles.demoGrid}>
          {STAFF_DEMOS.map((demo) => (
            <Pressable
              key={demo.label}
              style={[styles.demoCard, { backgroundColor: demo.bg, borderColor: demo.color + "30" }]}
              onPress={() => fillDemo(demo.id, demo.code)}
            >
              <View style={[styles.demoIcon, { backgroundColor: demo.color }]}>
                <Feather name={demo.icon} size={15} color="#fff" />
              </View>
              <Text style={[styles.demoRole, { color: demo.color, fontFamily: "Epilogue_700Bold" }]}>{demo.label}</Text>
              <Text style={[styles.demoText, { color: demo.color, fontFamily: "Manrope_400Regular" }]}>{demo.id}</Text>
              <Text style={[styles.demoText, { color: demo.color, fontFamily: "Manrope_400Regular" }]}>{demo.code}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24 },
  back: { marginBottom: 24, alignSelf: "flex-start" },
  header: { alignItems: "center", marginBottom: 20, gap: 8 },
  logo: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 27 },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  roleHint: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 18 },
  roleHintText: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4 },
  card: { borderRadius: 20, borderWidth: 1, padding: 22, gap: 16, marginBottom: 22 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", borderColor: "#FCA5A5", borderWidth: 1, borderRadius: 10, padding: 12 },
  errorText: { color: "#DC2626", fontSize: 13, flex: 1 },
  field: { gap: 6 },
  label: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  input: { flex: 1, fontSize: 15 },
  button: { borderRadius: 14, paddingVertical: 15, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  buttonText: { color: "#fff", fontSize: 16 },
  demoLabel: { fontSize: 12, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  demoGrid: { gap: 10 },
  demoCard: { borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  demoIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  demoRole: { width: 88, fontSize: 13 },
  demoText: { flex: 1, fontSize: 11, opacity: 0.78 },
});

import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";

import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { CONDITIONS } from "@/constants/data";
import type { Condition } from "@/constants/types";

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = useApp();
  const [selected, setSelected] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = (id: Condition) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      await completeOnboarding(selected);
      router.replace("/(tabs)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 20,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.lockBadge}>
            <Feather name="lock" size={11} color={colors.mutedForeground} />
            <Text style={[styles.lockText, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
              ANONYMOUS & SECURE
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>
            Your Health,{"\n"}
            <Text style={{ color: colors.secondary, fontStyle: "italic" }}>
              Our Secret.
            </Text>
          </Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant, fontFamily: "Manrope_400Regular" }]}>
            Personalise your nutritional journey. We don't ask for your name or
            email — all preferences stay on your device.
          </Text>
          <View style={styles.privacyBadge}>
            <Feather name="map-pin" size={12} color={colors.primary} />
            <Text style={[styles.privacyText, { color: colors.primary, fontFamily: "Manrope_600SemiBold" }]}>
              ZERO-KNOWLEDGE STORAGE
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_600SemiBold" }]}>
            Tailor Your Plate
          </Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            Select all conditions you're managing.
          </Text>
        </View>

        <View style={styles.conditions}>
          {CONDITIONS.map((condition) => {
            const isSelected = selected.includes(condition.id);
            return (
              <Pressable
                key={condition.id}
                style={({ pressed }) => [
                  styles.conditionCard,
                  {
                    backgroundColor: isSelected
                      ? colors.primaryContainer
                      : colors.surfaceContainer,
                    borderColor: isSelected
                      ? colors.primary
                      : "transparent",
                    borderWidth: 2,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                onPress={() => toggle(condition.id)}
              >
                <View style={styles.conditionRow}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surfaceContainerHigh,
                      },
                    ]}
                  >
                    <Feather
                      name={condition.icon as any}
                      size={18}
                      color={isSelected ? "#fff" : condition.color}
                    />
                  </View>
                  <View style={styles.conditionText}>
                    <Text
                      style={[
                        styles.conditionLabel,
                        {
                          color: isSelected ? "#fff" : colors.onSurface,
                          fontFamily: "Epilogue_700Bold",
                        },
                      ]}
                    >
                      {condition.label}
                    </Text>
                    <Text
                      style={[
                        styles.conditionDesc,
                        {
                          color: isSelected
                            ? colors.onPrimaryContainer
                            : colors.mutedForeground,
                          fontFamily: "Manrope_400Regular",
                        },
                      ]}
                    >
                      {condition.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <Feather name="check-circle" size={20} color={colors.onPrimaryContainer} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.privacyCard, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[styles.privacyCardTitle, { color: colors.onSurface, fontFamily: "Epilogue_600SemiBold" }]}>
            No Database. No Tracking.
          </Text>
          <Text style={[styles.privacyCardText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            At Fittrac-Kitchen, we believe your health is your business. Your
            selections are stored locally in your browser's secure cache. We
            never see it, and we can't sell it.
          </Text>
          <View style={styles.privacyRow}>
            <View style={styles.privacyItem}>
              <Feather name="lock" size={13} color={colors.primary} />
              <Text style={[styles.privacyLabel, { color: colors.primary, fontFamily: "Manrope_600SemiBold" }]}>
                Local Encryption
              </Text>
            </View>
            <View style={styles.privacyItem}>
              <Feather name="user-x" size={13} color={colors.primary} />
              <Text style={[styles.privacyLabel, { color: colors.primary, fontFamily: "Manrope_600SemiBold" }]}>
                No Profile Required
              </Text>
            </View>
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
            styles.ctaBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed || loading ? 0.8 : 1,
            },
          ]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={[styles.ctaBtnText, { fontFamily: "Epilogue_700Bold" }]}>
            {loading ? "Setting up..." : "Get My Recommendations"}
          </Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </Pressable>
        <Text style={[styles.termsText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
          By proceeding, you agree to our Privacy Charter
        </Text>
        <Pressable
          style={styles.providerLink}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.selectionAsync();
            router.push("/clinical-login");
          }}
        >
          <Feather name="shield" size={13} color={colors.primary} />
          <Text style={[styles.providerLinkText, { color: colors.primary, fontFamily: "Manrope_600SemiBold" }]}>
            Are you a provider? Sign in here
          </Text>
          <Feather name="arrow-right" size={13} color={colors.primary} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  header: { gap: 12, marginBottom: 32 },
  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  lockText: { fontSize: 10, letterSpacing: 1 },
  title: { fontSize: 40, lineHeight: 46 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  privacyText: { fontSize: 11, letterSpacing: 0.5 },
  section: { gap: 4, marginBottom: 16 },
  sectionTitle: { fontSize: 22, lineHeight: 28 },
  sectionSub: { fontSize: 14 },
  conditions: { gap: 12, marginBottom: 24 },
  conditionCard: {
    borderRadius: 16,
    padding: 16,
  },
  conditionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  conditionText: { flex: 1 },
  conditionLabel: { fontSize: 17, marginBottom: 2 },
  conditionDesc: { fontSize: 13, lineHeight: 18 },
  privacyCard: {
    borderRadius: 20,
    padding: 20,
    gap: 10,
    marginBottom: 16,
  },
  privacyCardTitle: { fontSize: 18 },
  privacyCardText: { fontSize: 13, lineHeight: 20 },
  privacyRow: { flexDirection: "row", gap: 20 },
  privacyItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  privacyLabel: { fontSize: 12 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 10,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    borderRadius: 100,
  },
  ctaBtnText: { color: "#fff", fontSize: 17 },
  termsText: { fontSize: 12, textAlign: "center" },
  providerLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 4 },
  providerLinkText: { fontSize: 13 },
});

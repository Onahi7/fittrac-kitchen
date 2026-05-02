import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

export default function PrescriptionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { prescriptionId } = useLocalSearchParams<{ prescriptionId: string }>();
  const { prescriptions, isLoading } = useApp();

  const rx = prescriptions.find((p) => p.id === prescriptionId) ?? null;

  const header = (
    <View style={[styles.header, {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
      backgroundColor: colors.background,
    }]}>
      <Pressable style={[styles.backBtn, { backgroundColor: colors.surfaceContainer }]} onPress={() => router.back()}>
        <Feather name="arrow-left" size={20} color={colors.onSurface} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={[styles.headerLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>TELEMEDICINE</Text>
        <Text style={[styles.headerTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Prescription</Text>
      </View>
      <View style={[styles.rxBadge, { backgroundColor: "#E8F5E9" }]}>
        <Text style={[styles.rxBadgeText, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>Rx</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.centerText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>Loading prescription...</Text>
        </View>
      </View>
    );
  }

  if (!rx) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <View style={styles.centerState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceContainerLow }]}>
            <Feather name="file-text" size={40} color={colors.outlineVariant} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>No Prescription Found</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            This prescription may not have been issued yet or has been removed. Contact your doctor for details.
          </Text>
          <Pressable style={[styles.backBtnLarge, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={[styles.backBtnText, { fontFamily: "Manrope_700Bold" }]}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const issueDate = new Date(rx.issuedAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, {
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40,
        }]}
      >
        <View style={[styles.rxHeader, { backgroundColor: colors.primary }]}>
          <View style={styles.rxHeaderTop}>
            <View>
              <Text style={[styles.brandName, { fontFamily: "Epilogue_700Bold", color: "#fff" }]}>Fittrac Kitchen</Text>
              <Text style={[styles.brandSub, { fontFamily: "Manrope_400Regular", color: "rgba(255,255,255,0.7)" }]}>
                Vitara Health · Telemedicine Division
              </Text>
            </View>
            <View style={[styles.rxSymbol, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <Text style={[styles.rxSymbolText, { fontFamily: "Epilogue_700Bold", color: "#fff" }]}>℞</Text>
            </View>
          </View>
          <View style={[styles.rxDividerLine, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
          <View style={styles.rxMeta}>
            <View>
              <Text style={[styles.rxMetaLabel, { color: "rgba(255,255,255,0.6)", fontFamily: "Manrope_400Regular" }]}>PRESCRIBED BY</Text>
              <Text style={[styles.rxMetaValue, { color: "#fff", fontFamily: "Manrope_600SemiBold" }]}>{rx.doctorName}</Text>
              <Text style={[styles.rxMetaSub, { color: "rgba(255,255,255,0.7)", fontFamily: "Manrope_400Regular" }]}>{rx.doctorType}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.rxMetaLabel, { color: "rgba(255,255,255,0.6)", fontFamily: "Manrope_400Regular" }]}>DATE ISSUED</Text>
              <Text style={[styles.rxMetaValue, { color: "#fff", fontFamily: "Manrope_600SemiBold" }]}>{issueDate}</Text>
              <Text style={[styles.rxMetaSub, { color: "rgba(255,255,255,0.7)", fontFamily: "Manrope_400Regular" }]}>{rx.id}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Feather name="clipboard" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Diagnosis</Text>
          </View>
          <Text style={[styles.diagnosisText, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}>
            {rx.diagnosis}
          </Text>
        </View>

        {rx.medications.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <Feather name="package" size={16} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
                Medications ({rx.medications.length})
              </Text>
            </View>
            <View style={{ gap: 14 }}>
              {rx.medications.map((med, i) => (
                <View key={i} style={[styles.medCard, { backgroundColor: colors.surfaceContainerLow }]}>
                  <View style={styles.medTop}>
                    <View style={[styles.medNum, { backgroundColor: colors.primaryContainer }]}>
                      <Text style={[styles.medNumText, { fontFamily: "Manrope_700Bold", color: "#fff" }]}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.medName, { color: colors.onSurface, fontFamily: "Manrope_700Bold" }]}>{med.name}</Text>
                      <Text style={[styles.medDosage, { color: colors.primary, fontFamily: "Manrope_600SemiBold" }]}>
                        {med.dosage} · {med.frequency}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.medDetail, { backgroundColor: colors.surfaceContainer }]}>
                    <View style={styles.medRow}>
                      <Text style={[styles.medRowLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>Duration</Text>
                      <Text style={[styles.medRowValue, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}>{med.duration}</Text>
                    </View>
                    <View style={[styles.medDivider, { backgroundColor: colors.surfaceContainerHigh }]} />
                    <View style={styles.medRow}>
                      <Text style={[styles.medRowLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>Instructions</Text>
                      <Text style={[styles.medRowValue, { color: colors.onSurface, fontFamily: "Manrope_400Regular", flex: 1, textAlign: "right" }]}>{med.instructions}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {rx.labTests.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <Feather name="activity" size={16} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Lab Orders</Text>
            </View>
            <View style={{ gap: 10 }}>
              {rx.labTests.map((t, i) => (
                <View key={i} style={styles.labRow}>
                  <View style={[styles.labDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.labText, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Feather name="calendar" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Follow-Up</Text>
          </View>
          <Text style={[styles.followUp, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>{rx.followUpDate}</Text>
        </View>

        {!!rx.notes && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <Feather name="message-square" size={16} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Doctor's Notes</Text>
            </View>
            <Text style={[styles.notesText, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}>{rx.notes}</Text>
          </View>
        )}

        <View style={[styles.footer, { backgroundColor: colors.surfaceContainerLow }]}>
          <Feather name="shield" size={14} color={colors.mutedForeground} />
          <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            This prescription is digitally issued via Vitara Health. It is valid for use at registered pharmacies. Ref: {rx.id}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginTop: 4 },
  headerLabel: { fontSize: 10, letterSpacing: 1.5 },
  headerTitle: { fontSize: 24 },
  rxBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, marginTop: 4 },
  rxBadgeText: { fontSize: 16 },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 16 },
  centerText: { fontSize: 14 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 22, textAlign: "center" },
  emptyText: { fontSize: 14, lineHeight: 21, textAlign: "center" },
  backBtnLarge: { paddingHorizontal: 32, paddingVertical: 13, borderRadius: 100, marginTop: 8 },
  backBtnText: { color: "#fff", fontSize: 15 },
  scroll: { paddingHorizontal: 20, paddingTop: 4, gap: 14 },
  rxHeader: { borderRadius: 20, padding: 20, gap: 16 },
  rxHeaderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brandName: { fontSize: 18 },
  brandSub: { fontSize: 12, marginTop: 2 },
  rxSymbol: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  rxSymbolText: { fontSize: 26 },
  rxDividerLine: { height: 1 },
  rxMeta: { flexDirection: "row", justifyContent: "space-between" },
  rxMetaLabel: { fontSize: 9, letterSpacing: 1, marginBottom: 3 },
  rxMetaValue: { fontSize: 14 },
  rxMetaSub: { fontSize: 11, marginTop: 2 },
  section: { borderRadius: 16, padding: 16, gap: 14, shadowColor: "#1D1B19", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 18 },
  diagnosisText: { fontSize: 14, lineHeight: 22 },
  medCard: { borderRadius: 12, padding: 14, gap: 10 },
  medTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  medNum: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  medNumText: { fontSize: 12 },
  medName: { fontSize: 15 },
  medDosage: { fontSize: 13 },
  medDetail: { borderRadius: 10, padding: 12, gap: 8 },
  medRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  medRowLabel: { fontSize: 12 },
  medRowValue: { fontSize: 13 },
  medDivider: { height: 1 },
  labRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  labDot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 5 },
  labText: { flex: 1, fontSize: 14, lineHeight: 20 },
  followUp: { fontSize: 16 },
  notesText: { fontSize: 14, lineHeight: 22 },
  footer: { borderRadius: 14, padding: 14, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  footerText: { flex: 1, fontSize: 12, lineHeight: 18 },
});

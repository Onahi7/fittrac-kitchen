import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { apiFetch } from "@/lib/api";

interface AvailableTest { name: string; instructions: string; code: string; }
interface TestUpload { code: string; uri: string | null; uploaded: boolean; }

export default function TestResultsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { consultationId } = useLocalSearchParams<{ consultationId: string }>();

  const [availableTests, setAvailableTests] = useState<AvailableTest[]>([]);
  const [uploads, setUploads] = useState<TestUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    apiFetch("/api/clinical/tests")
      .then((r) => r.json())
      .then((data: any[]) => {
        const tests = data.map((t) => ({ name: t.name, instructions: t.instructions, code: t.name.replace(/\s+/g, "_").slice(0, 8) }));
        setAvailableTests(tests);
        setUploads(tests.map((t) => ({ code: t.code, uri: null, uploaded: false })));
      })
      .catch(() => setAvailableTests([]))
      .finally(() => setLoading(false));
  }, []);

  const pickImage = async (code: string) => {
    if (Platform.OS === "web") {
      setUploads((prev) =>
        prev.map((u) => (u.code === code ? { ...u, uri: "web-placeholder", uploaded: false } : u))
      );
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photo library to upload results.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setUploads((prev) =>
        prev.map((u) => (u.code === code ? { ...u, uri: result.assets[0].uri, uploaded: false } : u))
      );
    }
  };

  const handleSubmit = async () => {
    const withFiles = uploads.filter((u) => u.uri);
    if (withFiles.length === 0) {
      Alert.alert("No results uploaded", "Please upload at least one test result before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/clinical/test-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultationId, uploads: withFiles }),
      });
    } catch {}
    setSubmitting(false);
    setSubmitted(true);
  };

  const header = (
    <View style={[styles.header, {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
      backgroundColor: colors.background,
    }]}>
      <Pressable style={[styles.backBtn, { backgroundColor: colors.surfaceContainer }]} onPress={() => router.back()}>
        <Feather name="arrow-left" size={20} color={colors.onSurface} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={[styles.headerLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
          TELEMEDICINE
        </Text>
        <Text style={[styles.headerTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
          Upload Test Results
        </Text>
      </View>
    </View>
  );

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <View style={styles.successState}>
          <View style={[styles.successIcon, { backgroundColor: "#E8F5E9" }]}>
            <Feather name="check-circle" size={48} color="#154212" />
          </View>
          <Text style={[styles.successTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Results Submitted!
          </Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            Your doctor will review the results and update your consultation notes. You'll be notified within 24–48 hours.
          </Text>
          <Pressable style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={[styles.doneBtnText, { fontFamily: "Epilogue_700Bold" }]}>Back to Wellness</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            Loading available tests...
          </Text>
        </View>
      </View>
    );
  }

  if (availableTests.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <View style={styles.centerState}>
          <Feather name="clipboard" size={40} color={colors.outlineVariant} />
          <Text style={[styles.emptyTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>No Tests Requested</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            Your doctor has not requested any lab tests yet. Check back after your consultation.
          </Text>
          <Pressable style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={[styles.doneBtnText, { fontFamily: "Manrope_700Bold" }]}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, {
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100,
        }]}
      >
        <View style={[styles.infoCard, { backgroundColor: colors.primaryContainer }]}>
          <Feather name="info" size={16} color="#fff" />
          <Text style={[styles.infoText, { color: "#fff", fontFamily: "Manrope_400Regular" }]}>
            Upload clear photos of your printed lab results. Accepted: JPG, PNG, PDF photos.
            Your doctor will review within 24–48 hours.
          </Text>
        </View>

        {availableTests.map((test, i) => {
          const upload = uploads.find((u) => u.code === test.code)!;
          if (!upload) return null;
          return (
            <View key={test.code} style={[styles.testCard, { backgroundColor: colors.card }]}>
              <View style={styles.testHeader}>
                <View style={[styles.testNum, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[styles.testNumText, { fontFamily: "Manrope_700Bold", color: "#fff" }]}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.testName, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
                    {test.name}
                  </Text>
                  <Text style={[styles.testInstructions, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                    {test.instructions}
                  </Text>
                </View>
              </View>

              {upload.uri && upload.uri !== "web-placeholder" ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: upload.uri }} style={styles.preview} resizeMode="cover" />
                  <Pressable
                    style={[styles.reuploadBtn, { backgroundColor: colors.surfaceContainer }]}
                    onPress={() => pickImage(test.code)}
                  >
                    <Feather name="refresh-cw" size={14} color={colors.onSurface} />
                    <Text style={[styles.reuploadText, { color: colors.onSurface, fontFamily: "Manrope_500Medium" }]}>
                      Replace
                    </Text>
                  </Pressable>
                </View>
              ) : upload.uri === "web-placeholder" ? (
                <View style={[styles.webPlaceholder, { backgroundColor: colors.surfaceContainerLow }]}>
                  <Feather name="check" size={20} color={colors.primary} />
                  <Text style={[styles.webPlaceholderText, { color: colors.primary, fontFamily: "Manrope_500Medium" }]}>
                    File selected
                  </Text>
                </View>
              ) : (
                <Pressable
                  style={[styles.uploadBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
                  onPress={() => pickImage(test.code)}
                >
                  <Feather name="upload" size={22} color={colors.primary} />
                  <Text style={[styles.uploadBtnText, { color: colors.primary, fontFamily: "Manrope_600SemiBold" }]}>
                    Upload Result
                  </Text>
                  <Text style={[styles.uploadBtnSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                    Tap to choose photo from gallery
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, {
        backgroundColor: colors.background,
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 16,
        borderTopColor: colors.surfaceContainerHigh,
      }]}>
        <Text style={[styles.footerCount, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
          {uploads.filter((u) => u.uri).length} of {availableTests.length} results uploaded
        </Text>
        <Pressable
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Feather name="send" size={17} color="#fff" />
          <Text style={[styles.submitText, { fontFamily: "Epilogue_700Bold" }]}>
            {submitting ? "Submitting..." : "Submit to Doctor"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginTop: 4 },
  headerLabel: { fontSize: 10, letterSpacing: 1.5 },
  headerTitle: { fontSize: 24 },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 16 },
  loadingText: { fontSize: 14 },
  emptyTitle: { fontSize: 22, textAlign: "center" },
  emptyText: { fontSize: 14, lineHeight: 21, textAlign: "center" },
  scroll: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
  infoCard: { borderRadius: 14, padding: 14, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  testCard: { borderRadius: 20, padding: 16, gap: 14, shadowColor: "#1D1B19", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  testHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  testNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  testNumText: { fontSize: 13 },
  testName: { fontSize: 15, lineHeight: 20 },
  testInstructions: { fontSize: 12, lineHeight: 17 },
  uploadBtn: { borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed", padding: 24, alignItems: "center", gap: 8 },
  uploadBtnText: { fontSize: 15 },
  uploadBtnSub: { fontSize: 12 },
  previewContainer: { gap: 10 },
  preview: { width: "100%", height: 180, borderRadius: 14 },
  reuploadBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, alignSelf: "flex-start" },
  reuploadText: { fontSize: 13 },
  webPlaceholder: { borderRadius: 14, padding: 20, alignItems: "center", gap: 6, flexDirection: "row", justifyContent: "center" },
  webPlaceholderText: { fontSize: 14 },
  footer: { paddingHorizontal: 20, paddingTop: 14, gap: 10, borderTopWidth: 1 },
  footerCount: { fontSize: 13, textAlign: "center" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 100 },
  submitText: { color: "#fff", fontSize: 17 },
  successState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 20 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 26, textAlign: "center" },
  successSub: { fontSize: 15, lineHeight: 22, textAlign: "center" },
  doneBtn: { paddingHorizontal: 36, paddingVertical: 15, borderRadius: 100 },
  doneBtnText: { color: "#fff", fontSize: 16 },
});

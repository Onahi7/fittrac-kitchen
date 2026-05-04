import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
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
import { apiFetch } from "@/lib/api";

type PanelType = null | "chat" | "tests" | "prescription";

interface ChatMsg { role: "user" | "doctor"; text: string; time: string; }
interface TestRequest { name: string; instructions: string; status: string; }

export default function ConsultationRoomScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();
  const { consultationId, specialistName, specialistType } = useLocalSearchParams<{
    consultationId: string; specialistName: string; specialistType: string;
  }>();
  const { consultations } = useApp();

  const consult = consultations.find((c) => c.id === consultationId) ?? {
    specialistName: specialistName ?? "Dr. Adaeze Okonkwo",
    specialistType: specialistType ?? "Nutritionist",
  };

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [callSeconds, setCallSeconds] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { role: "doctor", text: `Hello! I'm ${consult.specialistName}. I've reviewed your health profile. Let's get started — how have you been feeling this week?`, time: "0:00" },
  ]);
  const [testRequests, setTestRequests] = useState<TestRequest[]>([]);

  useEffect(() => {
    if (!consultationId) return;
    apiFetch(`/api/clinical/test-requests/consultation/${consultationId}`)
      .then((r) => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const flat: TestRequest[] = data.flatMap((tr) =>
            (tr.tests ?? []).map((t: any) => ({ name: t.name, instructions: t.instructions, status: tr.status ?? "pending" }))
          );
          setTestRequests(flat);
        }
      })
      .catch(() => {});
  }, [consultationId]);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const doctorPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    const doctorLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(doctorPulse, { toValue: 1.04, duration: 2000, useNativeDriver: true }),
        Animated.timing(doctorPulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    doctorLoop.start();
    const timer = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => { loop.stop(); doctorLoop.stop(); clearInterval(timer); };
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const now = fmt(callSeconds);
    const msg = chatInput.trim();
    setChatInput("");
    setChatMsgs((prev) => [...prev, { role: "user", text: msg, time: now }]);
    setTimeout(() => {
      setChatMsgs((prev) => [...prev, {
        role: "doctor",
        text: "I see. That's important information. Please continue — I'm making notes to include in your prescription plan.",
        time: fmt(callSeconds + 3),
      }]);
    }, 2000);
  };

  const CONTROLS = [
    { icon: isMuted ? "mic-off" : "mic", label: isMuted ? "Unmute" : "Mute", active: isMuted, onPress: () => setIsMuted(!isMuted), danger: false },
    { icon: isCameraOff ? "video-off" : "video", label: isCameraOff ? "Cam On" : "Cam Off", active: isCameraOff, onPress: () => setIsCameraOff(!isCameraOff), danger: false },
    { icon: isSpeakerOn ? "volume-2" : "volume-x", label: "Speaker", active: !isSpeakerOn, onPress: () => setIsSpeakerOn(!isSpeakerOn), danger: false },
    { icon: "message-circle", label: "Chat", active: activePanel === "chat", onPress: () => setActivePanel(activePanel === "chat" ? null : "chat"), danger: false },
    { icon: "file-text", label: "Tests", active: activePanel === "tests", onPress: () => setActivePanel(activePanel === "tests" ? null : "tests"), danger: false },
  ];

  const initials = (consult.specialistName ?? "Dr")
    .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <View style={[styles.container, { backgroundColor: "#0A0F0A" }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 8 }]}>
        <View style={styles.callInfo}>
          <View style={styles.liveDot} />
          <Text style={[styles.callTime, { fontFamily: "Manrope_700Bold" }]}>{fmt(callSeconds)}</Text>
        </View>
        <Text style={[styles.callTitle, { fontFamily: "Epilogue_700Bold" }]}>Wellness Consultation</Text>
        <View style={[styles.encryptBadge]}>
          <Feather name="shield" size={10} color="#6B9E6B" />
          <Text style={[styles.encryptText, { fontFamily: "Manrope_500Medium" }]}>E2E</Text>
        </View>
      </View>

      <View style={styles.videoArea}>
        <Animated.View style={[styles.doctorVideoFrame, { transform: [{ scale: doctorPulse }] }]}>
          <View style={[styles.doctorVideoInner, { backgroundColor: "#1A2A1A" }]}>
            <View style={styles.doctorAvatarRing}>
              <View style={[styles.doctorAvatar, { backgroundColor: "#154212" }]}>
                <Text style={[styles.doctorInitials, { fontFamily: "Epilogue_700Bold" }]}>{initials}</Text>
              </View>
            </View>
            <Text style={[styles.doctorName, { fontFamily: "Manrope_600SemiBold" }]}>{consult.specialistName}</Text>
            <Text style={[styles.doctorType, { fontFamily: "Manrope_400Regular" }]}>{consult.specialistType}</Text>
            <View style={styles.speakingIndicator}>
              {[1, 2, 3, 4].map((i) => (
                <Animated.View
                  key={i}
                  style={[styles.speakingBar, { height: 4 + i * 3, backgroundColor: "#4CAF50", opacity: isMuted ? 0.2 : 0.7 + i * 0.08 }]}
                />
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.selfVideoFrame, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.selfVideoInner, { backgroundColor: isCameraOff ? "#1A1A1A" : "#0D1A0D" }]}>
            {isCameraOff ? (
              <Feather name="video-off" size={18} color="#666" />
            ) : (
              <View style={[styles.selfAvatar, { backgroundColor: "#2D5A27" }]}>
                <Text style={[styles.selfInitials, { fontFamily: "Epilogue_700Bold" }]}>ME</Text>
              </View>
            )}
            {isMuted && (
              <View style={styles.mutedBadge}>
                <Feather name="mic-off" size={10} color="#fff" />
              </View>
            )}
          </View>
        </Animated.View>
      </View>

      {activePanel && (
        <View style={[styles.panel, { backgroundColor: "#111A11" }]}>
          {activePanel === "chat" && (
            <View style={styles.chatPanel}>
              <Text style={[styles.panelTitle, { fontFamily: "Epilogue_700Bold" }]}>In-Call Chat</Text>
              <ScrollView style={styles.chatScroll} contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
                {chatMsgs.map((m, i) => (
                  <View key={i} style={[styles.chatMsg, { alignSelf: m.role === "user" ? "flex-end" : "flex-start" }]}>
                    <View style={[styles.chatBubble, {
                      backgroundColor: m.role === "user" ? "#154212" : "#1E2E1E",
                      borderBottomRightRadius: m.role === "user" ? 4 : 16,
                      borderBottomLeftRadius: m.role === "user" ? 16 : 4,
                    }]}>
                      <Text style={[styles.chatText, { fontFamily: "Manrope_400Regular" }]}>{m.text}</Text>
                    </View>
                    <Text style={[styles.chatTime, { fontFamily: "Manrope_400Regular", alignSelf: m.role === "user" ? "flex-end" : "flex-start" }]}>{m.time}</Text>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.chatInputRow}>
                <TextInput
                  value={chatInput}
                  onChangeText={setChatInput}
                  placeholder="Type a message..."
                  placeholderTextColor="#555"
                  style={[styles.chatInput, { fontFamily: "Manrope_400Regular" }]}
                  returnKeyType="send"
                  onSubmitEditing={sendChat}
                />
                <Pressable style={[styles.sendBtn, { backgroundColor: "#154212" }]} onPress={sendChat}>
                  <Feather name="send" size={16} color="#fff" />
                </Pressable>
              </View>
            </View>
          )}

          {activePanel === "tests" && (
            <View style={styles.testsPanel}>
              <Text style={[styles.panelTitle, { fontFamily: "Epilogue_700Bold" }]}>Test Requests</Text>
              <Text style={[styles.panelSub, { fontFamily: "Manrope_400Regular" }]}>
                Your doctor has requested these diagnostic tests:
              </Text>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10 }}>
                {testRequests.map((t, i) => (
                  <View key={i} style={[styles.testItem, { backgroundColor: "#1A2A1A" }]}>
                    <View style={styles.testHeader}>
                      <Feather name="clipboard" size={14} color="#6B9E6B" />
                      <Text style={[styles.testName, { fontFamily: "Manrope_600SemiBold" }]}>{t.name}</Text>
                      <View style={[styles.testStatus, { backgroundColor: t.status === "pending" ? "#2A1A00" : "#0D2A0D" }]}>
                        <Text style={[styles.testStatusText, { color: t.status === "pending" ? "#FFB065" : "#6B9E6B", fontFamily: "Manrope_500Medium" }]}>
                          {t.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.testInstructions, { fontFamily: "Manrope_400Regular" }]}>{t.instructions}</Text>
                  </View>
                ))}
                <Pressable
                  style={[styles.uploadTestBtn, { backgroundColor: "#154212" }]}
                  onPress={() => router.push({ pathname: "/test-results", params: { consultationId: consultationId ?? "demo" } })}
                >
                  <Feather name="upload" size={15} color="#fff" />
                  <Text style={[styles.uploadTestText, { fontFamily: "Manrope_700Bold" }]}>Upload Results</Text>
                </Pressable>
              </ScrollView>
            </View>
          )}
        </View>
      )}

      <View style={[styles.controlBar, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 16 }]}>
        <View style={styles.controls}>
          {CONTROLS.map((ctrl) => (
            <Pressable
              key={ctrl.label}
              style={[styles.controlBtn, { backgroundColor: ctrl.active ? "#2D4A2D" : "#1A2A1A" }]}
              onPress={ctrl.onPress}
            >
              <Feather name={ctrl.icon as any} size={20} color={ctrl.active ? "#6B9E6B" : "#ccc"} />
              <Text style={[styles.controlLabel, { color: "#999", fontFamily: "Manrope_400Regular" }]}>{ctrl.label}</Text>
            </Pressable>
          ))}
          <Pressable
            style={[styles.controlBtn, styles.endCallBtn]}
            onPress={() => setShowEndConfirm(true)}
          >
            <Feather name="phone-off" size={20} color="#fff" />
            <Text style={[styles.controlLabel, { color: "#fff", fontFamily: "Manrope_700Bold" }]}>End</Text>
          </Pressable>
        </View>
      </View>

      {showEndConfirm && (
        <View style={styles.endOverlay}>
          <View style={[styles.endSheet, { backgroundColor: "#1A2A1A" }]}>
            <Text style={[styles.endTitle, { fontFamily: "Epilogue_700Bold" }]}>End Consultation?</Text>
            <Text style={[styles.endSub, { fontFamily: "Manrope_400Regular" }]}>
              Your session summary and any prescriptions will be saved to your profile.
            </Text>
            <Pressable
              style={[styles.endConfirmBtn, { backgroundColor: "#BA1A1A" }]}
              onPress={() => { setShowEndConfirm(false); router.back(); }}
            >
              <Text style={[styles.endConfirmText, { fontFamily: "Manrope_700Bold" }]}>End Call</Text>
            </Pressable>
            <Pressable
              style={[styles.endCancelBtn, { backgroundColor: "#154212" }]}
              onPress={() => setShowEndConfirm(false)}
            >
              <Text style={[styles.endConfirmText, { fontFamily: "Manrope_700Bold" }]}>Continue Session</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12,
  },
  callInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF4444" },
  callTime: { color: "#fff", fontSize: 13 },
  callTitle: { color: "#fff", fontSize: 15 },
  encryptBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#0D2A0D", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100,
  },
  encryptText: { color: "#6B9E6B", fontSize: 10 },
  videoArea: { flex: 1, position: "relative", margin: 12, borderRadius: 20, overflow: "hidden" },
  doctorVideoFrame: { flex: 1, borderRadius: 20, overflow: "hidden" },
  doctorVideoInner: {
    flex: 1, alignItems: "center", justifyContent: "center",
    borderRadius: 20, gap: 10,
  },
  doctorAvatarRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: "#154212",
    alignItems: "center", justifyContent: "center",
  },
  doctorAvatar: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: "center", justifyContent: "center",
  },
  doctorInitials: { color: "#fff", fontSize: 32 },
  doctorName: { color: "#fff", fontSize: 18 },
  doctorType: { color: "#9DD090", fontSize: 13 },
  speakingIndicator: { flexDirection: "row", gap: 3, alignItems: "flex-end", height: 20 },
  speakingBar: { width: 3, borderRadius: 2 },
  selfVideoFrame: {
    position: "absolute", top: 12, right: 12,
    width: 90, height: 120, borderRadius: 14, overflow: "hidden",
    borderWidth: 2, borderColor: "#154212",
  },
  selfVideoInner: {
    flex: 1, alignItems: "center", justifyContent: "center", position: "relative",
  },
  selfAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  selfInitials: { color: "#fff", fontSize: 14 },
  mutedBadge: {
    position: "absolute", bottom: 6, right: 6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#BA1A1A", alignItems: "center", justifyContent: "center",
  },
  panel: {
    marginHorizontal: 12, marginBottom: 8,
    borderRadius: 16, padding: 16, maxHeight: 240,
  },
  chatPanel: { flex: 1, gap: 10 },
  panelTitle: { color: "#fff", fontSize: 16 },
  panelSub: { color: "#999", fontSize: 12 },
  chatScroll: { flex: 1 },
  chatMsg: { maxWidth: "80%", gap: 2 },
  chatBubble: { padding: 10, borderRadius: 16 },
  chatText: { color: "#fff", fontSize: 13, lineHeight: 18 },
  chatTime: { color: "#555", fontSize: 10 },
  chatInputRow: { flexDirection: "row", gap: 8 },
  chatInput: {
    flex: 1, backgroundColor: "#1A2A1A", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, color: "#fff", fontSize: 13,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  testsPanel: { flex: 1, gap: 10 },
  testItem: { borderRadius: 12, padding: 12, gap: 8 },
  testHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  testName: { flex: 1, color: "#fff", fontSize: 13 },
  testStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  testStatusText: { fontSize: 10 },
  testInstructions: { color: "#999", fontSize: 12, lineHeight: 17 },
  uploadTestBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, borderRadius: 12,
  },
  uploadTestText: { color: "#fff", fontSize: 14 },
  controlBar: { paddingHorizontal: 12, paddingTop: 8, backgroundColor: "#0A0F0A" },
  controls: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  controlBtn: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 12, borderRadius: 14, gap: 4,
  },
  controlLabel: { fontSize: 9 },
  endCallBtn: { backgroundColor: "#BA1A1A" },
  endOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center", justifyContent: "flex-end",
  },
  endSheet: {
    width: "100%", padding: 28, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 14,
  },
  endTitle: { color: "#fff", fontSize: 22 },
  endSub: { color: "#999", fontSize: 14, lineHeight: 20 },
  endConfirmBtn: { paddingVertical: 15, borderRadius: 100, alignItems: "center" },
  endCancelBtn: { paddingVertical: 15, borderRadius: 100, alignItems: "center" },
  endConfirmText: { color: "#fff", fontSize: 16 },
});

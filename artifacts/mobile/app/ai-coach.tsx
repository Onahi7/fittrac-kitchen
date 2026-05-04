import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
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
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { apiFetch } from "@/lib/api";

interface ChatMessage { role: "user" | "assistant"; content: string; timestamp: string; }

const QUICK_PROMPTS = [
  "What should I eat today for my condition?",
  "How can I lower my blood pressure with food?",
  "Give me a 3-day meal plan for diabetes",
  "What Nigerian foods help with weight loss?",
  "Is Egusi soup good for my liver?",
  "How much water should I drink?",
];

function TypingIndicator({ colors }: { colors: any }) {
  const dot1 = useRef(new (require("react-native").Animated.Value)(0)).current;
  const dot2 = useRef(new (require("react-native").Animated.Value)(0)).current;
  const dot3 = useRef(new (require("react-native").Animated.Value)(0)).current;
  const { Animated } = require("react-native");

  useEffect(() => {
    const anim = (d: any, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(d, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
    anim(dot1, 0).start();
    anim(dot2, 200).start();
    anim(dot3, 400).start();
  }, []);

  return (
    <View style={[typingStyles.container, { backgroundColor: colors.surfaceContainerLow }]}>
      {[dot1, dot2, dot3].map((d, i) => (
        <Animated.View key={i} style={[typingStyles.dot, { backgroundColor: colors.primary, transform: [{ translateY: d }] }]} />
      ))}
    </View>
  );
}

const typingStyles = StyleSheet.create({
  container: { flexDirection: "row", gap: 4, padding: 14, borderRadius: 16, alignSelf: "flex-start", alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

export default function AICoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, currentWeight, todayNutrition, todayWater, todayExercise, weightLogs } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const healthContext = {
    conditions: profile.conditions,
    currentWeight,
    todayCalories: todayNutrition?.calories ?? 0,
    todayWater,
    todayExerciseMinutes: todayExercise.minutes,
    recentWeightTrend: weightLogs.slice(-3).map((l) => l.weight),
  };

  const sendMessage = async (text: string) => {
    const userText = text.trim();
    if (!userText) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const now = new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = { role: "user", content: userText, timestamp: now };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInput("");
    setIsTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await apiFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMsgs.map((m) => ({ role: m.role, content: m.content })),
          healthContext,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      const assistantTimestamp = new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });

      setIsTyping(false);
      setMessages((prev) => [...prev, { role: "assistant", content: "", timestamp: assistantTimestamp }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.content) {
              assistantText += parsed.content;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { ...copy[copy.length - 1], content: assistantText };
                return copy;
              });
              scrollRef.current?.scrollToEnd({ animated: false });
            }
          } catch {}
        }
      }
    } catch {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please check your connection and try again.",
          timestamp: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "web" ? 80 : 0}
    >
      <View style={[styles.header, {
        paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
        backgroundColor: colors.background,
        borderBottomColor: colors.surfaceContainerHigh,
      }]}>
        <Pressable style={[styles.backBtn, { backgroundColor: colors.surfaceContainer }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={[styles.headerAvatar, { backgroundColor: colors.primaryContainer }]}>
          <Text style={[styles.headerAvatarText, { fontFamily: "Epilogue_700Bold", color: "#fff" }]}>V</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Vitara AI Coach</Text>
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: "#4CAF50" }]} />
            <Text style={[styles.onlineText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
              {profile.conditions.length > 0 ? `Personalised for ${profile.conditions[0]}` : "Your health coach"}
            </Text>
          </View>
        </View>
        <View style={[styles.conditionChip, { backgroundColor: colors.primaryContainer }]}>
          <Feather name="heart" size={12} color="#fff" />
          <Text style={[styles.conditionText, { fontFamily: "Manrope_600SemiBold", color: "#fff" }]}>
            {profile.conditions.length} condition{profile.conditions.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={[styles.chatContent, {
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 80,
        }]}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.vitaraHero, { backgroundColor: colors.primaryContainer }]}>
              <Text style={styles.vitaraEmoji}>🌿</Text>
              <Text style={[styles.vitaraTitle, { color: "#fff", fontFamily: "Epilogue_700Bold" }]}>Vitara</Text>
              <Text style={[styles.vitaraSubtitle, { color: "rgba(255,255,255,0.75)", fontFamily: "Manrope_400Regular" }]}>
                Your personalised Nigerian health coach. Ask me anything about your diet, conditions, or wellness goals.
              </Text>
            </View>
            <Text style={[styles.promptsLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
              SUGGESTED QUESTIONS
            </Text>
            <View style={styles.promptsGrid}>
              {QUICK_PROMPTS.map((p) => (
                <Pressable
                  key={p}
                  style={[styles.promptChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => sendMessage(p)}
                >
                  <Text style={[styles.promptText, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}>{p}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <View key={i} style={[styles.msgRow, { justifyContent: isUser ? "flex-end" : "flex-start" }]}>
              {!isUser && (
                <View style={[styles.assistantAvatar, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={styles.assistantAvatarText}>V</Text>
                </View>
              )}
              <View style={styles.msgContent}>
                <View style={[styles.bubble, {
                  backgroundColor: isUser ? colors.primary : colors.card,
                  borderBottomRightRadius: isUser ? 4 : 20,
                  borderBottomLeftRadius: isUser ? 20 : 4,
                  maxWidth: "85%",
                }]}>
                  <Text style={[styles.msgText, {
                    color: isUser ? "#fff" : colors.onSurface,
                    fontFamily: "Manrope_400Regular",
                  }]}>
                    {msg.content || (isTyping && i === messages.length - 1 ? "" : "…")}
                  </Text>
                </View>
                <Text style={[styles.msgTime, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular", alignSelf: isUser ? "flex-end" : "flex-start" }]}>
                  {msg.timestamp}
                </Text>
              </View>
            </View>
          );
        })}

        {isTyping && <TypingIndicator colors={colors} />}
      </ScrollView>

      <View style={[styles.inputBar, {
        backgroundColor: colors.background,
        borderTopColor: colors.surfaceContainerHigh,
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 8,
      }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask Vitara anything about your health..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.textInput, {
            backgroundColor: colors.surfaceContainer,
            color: colors.onSurface,
            fontFamily: "Manrope_400Regular",
          }]}
          multiline
          maxLength={500}
          returnKeyType="send"
          blurOnSubmit
          onSubmitEditing={() => sendMessage(input)}
        />
        <Pressable
          style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.surfaceContainerHigh }]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || isTyping}
        >
          <Feather name="send" size={18} color={input.trim() ? "#fff" : colors.outlineVariant} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  headerAvatarText: { fontSize: 18 },
  headerTitle: { fontSize: 17 },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5 },
  onlineText: { fontSize: 12 },
  conditionChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  conditionText: { fontSize: 11 },
  chatArea: { flex: 1 },
  chatContent: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
  emptyState: { gap: 20 },
  vitaraHero: {
    borderRadius: 20, padding: 24, alignItems: "center", gap: 10,
  },
  vitaraEmoji: { fontSize: 40 },
  vitaraTitle: { fontSize: 28 },
  vitaraSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  promptsLabel: { fontSize: 11, letterSpacing: 1 },
  promptsGrid: { gap: 10 },
  promptChip: { padding: 14, borderRadius: 14, borderWidth: 1 },
  promptText: { fontSize: 14, lineHeight: 20 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgContent: { gap: 3, maxWidth: "85%" },
  assistantAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  assistantAvatarText: { fontSize: 13, color: "#fff", fontFamily: "Epilogue_700Bold" },
  bubble: { padding: 14, borderRadius: 20 },
  msgText: { fontSize: 14, lineHeight: 21 },
  msgTime: { fontSize: 10 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1 },
  textInput: {
    flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, maxHeight: 120, minHeight: 44,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 0 },
});

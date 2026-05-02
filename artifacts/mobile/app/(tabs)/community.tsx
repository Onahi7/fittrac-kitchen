import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

const ACHIEVEMENTS = [
  { id: "first_step", emoji: "🌱", title: "First Step", desc: "Completed onboarding", earned: true },
  { id: "hydration_hero", emoji: "💧", title: "Hydration Hero", desc: "7-day water streak", earned: true },
  { id: "clean_plate", emoji: "🍛", title: "Clean Plate", desc: "Ordered 5 healthy meals", earned: true },
  { id: "iron_will", emoji: "🏋️", title: "Iron Will", desc: "7-day exercise streak", earned: false },
  { id: "doctors_pet", emoji: "🩺", title: "Doctor's Pet", desc: "Booked first consult", earned: false },
  { id: "scale_warrior", emoji: "⚖️", title: "Scale Warrior", desc: "Logged weight 7 days", earned: false },
  { id: "fuel_up", emoji: "⚡", title: "Fuel Up", desc: "Logged exercise 5×", earned: true },
  { id: "community_star", emoji: "⭐", title: "Community Star", desc: "Shared first milestone", earned: false },
  { id: "half_century", emoji: "🎯", title: "Half Century", desc: "50 healthy meal orders", earned: false },
];

const SEED_POSTS = [
  {
    id: "p1", userAlias: "Mama Tola", conditionTag: "Hypertension",
    content: "Finally hit my water goal for 7 days straight! The Zobo detox drink from Fittrac really helped. BP reading was 124/82 this morning 🎉",
    type: "milestone" as const, date: "2h ago", likes: 24, liked: false, replies: 7,
  },
  {
    id: "p2", userAlias: "Emeka O.", conditionTag: "Diabetes",
    content: "Anyone tried the Fonio + Garden Egg stew? Just got my HbA1c back — 6.4%! Down from 7.8% three months ago. Diet change WORKS.",
    type: "insight" as const, date: "4h ago", likes: 41, liked: false, replies: 12,
  },
  {
    id: "p3", userAlias: "Adaeze K.", conditionTag: "Weight Loss",
    content: "Week 6 update: -3.2kg! I've been using the calorie tracking and eating the low-GI lunch packs. Dr. Adaeze's advice was spot on 💪",
    type: "milestone" as const, date: "Yesterday", likes: 58, liked: true, replies: 19,
  },
  {
    id: "p4", userAlias: "Seun B.", conditionTag: "Liver Health",
    content: "Question for the community: is it better to eat Ugba (oil bean) in the morning or evening for liver support? My nutritionist suggested morning but curious what others do.",
    type: "question" as const, date: "Yesterday", likes: 12, liked: false, replies: 23,
  },
  {
    id: "p5", userAlias: "Fatima A.", conditionTag: "Hypertension",
    content: "Moringa leaf soup three times this week + walking 30 mins daily. Feeling so much more energetic. Fittrac's exercise tracker kept me accountable!",
    type: "insight" as const, date: "2 days ago", likes: 33, liked: false, replies: 8,
  },
];

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  milestone: { bg: "#E8F5E9", text: "#154212" },
  insight: { bg: "#FFF3E0", text: "#8B4513" },
  question: { bg: "#E3F2FD", text: "#1565C0" },
  meal: { bg: "#F3E5F5", text: "#6A1B9A" },
};

const CONDITION_AVATAR_COLORS: Record<string, string> = {
  "Hypertension": "#154212",
  "Diabetes": "#8B500A",
  "Weight Loss": "#2D5A27",
  "Liver Health": "#493700",
  "Allergies": "#1565C0",
};

export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { orders, consultations, todayExercise, todayWater } = useApp();

  const [posts, setPosts] = useState(SEED_POSTS);
  const [activeTab, setActiveTab] = useState<"achievements" | "feed">("achievements");
  const [shareInput, setShareInput] = useState("");
  const [showShare, setShowShare] = useState(false);

  const earnedCount = ACHIEVEMENTS.filter((a) => a.earned).length;

  const handleLike = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const handleShare = () => {
    if (!shareInput.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPosts((prev) => [
      {
        id: `u${Date.now()}`,
        userAlias: "You",
        conditionTag: "Wellness",
        content: shareInput.trim(),
        type: "milestone",
        date: "Just now",
        likes: 0,
        liked: false,
        replies: 0,
      },
      ...prev,
    ]);
    setShareInput("");
    setShowShare(false);
    setActiveTab("feed");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, {
        paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
        backgroundColor: colors.background,
        borderBottomColor: colors.surfaceContainerHigh,
      }]}>
        <View>
          <Text style={[styles.headerLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
            FITTRAC KITCHEN
          </Text>
          <Text style={[styles.headerTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Community</Text>
        </View>
        <Pressable
          style={[styles.shareBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowShare(true)}
        >
          <Feather name="edit-2" size={14} color="#fff" />
          <Text style={[styles.shareBtnText, { fontFamily: "Manrope_700Bold" }]}>Share</Text>
        </Pressable>
      </View>

      <View style={[styles.tabRow, { borderBottomColor: colors.surfaceContainerHigh }]}>
        {(["achievements", "feed"] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabBtn, {
              borderBottomColor: activeTab === tab ? colors.primary : "transparent",
              borderBottomWidth: 2,
            }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabLabel, {
              color: activeTab === tab ? colors.primary : colors.mutedForeground,
              fontFamily: activeTab === tab ? "Manrope_700Bold" : "Manrope_500Medium",
            }]}>
              {tab === "achievements" ? `Achievements (${earnedCount})` : "Community Feed"}
            </Text>
          </Pressable>
        ))}
      </View>

      {showShare && (
        <View style={[styles.shareCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.shareTitle, { color: colors.onSurface, fontFamily: "Epilogue_600SemiBold" }]}>
            Share your health milestone
          </Text>
          <TextInput
            value={shareInput}
            onChangeText={setShareInput}
            placeholder="What health win are you celebrating today?"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.shareInput, {
              backgroundColor: colors.surfaceContainerLow,
              color: colors.onSurface,
              fontFamily: "Manrope_400Regular",
              borderColor: colors.border,
            }]}
            multiline
            maxLength={280}
          />
          <View style={styles.shareActions}>
            <Pressable
              style={[styles.shareCancelBtn, { borderColor: colors.outlineVariant }]}
              onPress={() => { setShowShare(false); setShareInput(""); }}
            >
              <Text style={[styles.shareCancelText, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.sharePostBtn, { backgroundColor: colors.primary }]}
              onPress={handleShare}
            >
              <Text style={[styles.sharePostText, { fontFamily: "Manrope_700Bold" }]}>Post</Text>
            </Pressable>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, {
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 80,
        }]}
      >
        {activeTab === "achievements" && (
          <View style={styles.achievementsContent}>
            <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
              {[
                { label: "Earned", value: String(earnedCount), icon: "award" as const },
                { label: "Orders", value: String(orders.length), icon: "shopping-bag" as const },
                { label: "Consults", value: String(consultations.length), icon: "video" as const },
                { label: "Workouts", value: String(todayExercise.workouts), icon: "zap" as const },
              ].map((s) => (
                <View key={s.label} style={styles.statItem}>
                  <Feather name={s.icon} size={18} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>Your Badges</Text>

            <View style={styles.badgeGrid}>
              {ACHIEVEMENTS.map((ach) => (
                <View
                  key={ach.id}
                  style={[styles.badgeCard, {
                    backgroundColor: ach.earned ? colors.card : colors.surfaceContainerLow,
                    borderColor: ach.earned ? colors.primary : "transparent",
                    borderWidth: ach.earned ? 1.5 : 0,
                    opacity: ach.earned ? 1 : 0.5,
                  }]}
                >
                  <Text style={[styles.badgeEmoji, { opacity: ach.earned ? 1 : 0.4 }]}>{ach.emoji}</Text>
                  <Text style={[styles.badgeTitle, { color: colors.onSurface, fontFamily: "Manrope_700Bold" }]}>{ach.title}</Text>
                  <Text style={[styles.badgeDesc, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>{ach.desc}</Text>
                  {ach.earned && (
                    <View style={[styles.earnedDot, { backgroundColor: colors.primary }]}>
                      <Feather name="check" size={8} color="#fff" />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === "feed" && (
          <View style={styles.feedContent}>
            {posts.map((post) => {
              const typeStyle = TYPE_COLORS[post.type] ?? TYPE_COLORS["insight"];
              const avatarColor = CONDITION_AVATAR_COLORS[post.conditionTag] ?? "#154212";
              const initials = post.userAlias.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
              return (
                <View key={post.id} style={[styles.postCard, { backgroundColor: colors.card }]}>
                  <View style={styles.postHeader}>
                    <View style={[styles.postAvatar, { backgroundColor: avatarColor }]}>
                      <Text style={[styles.postAvatarText, { fontFamily: "Epilogue_700Bold" }]}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.postAlias, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>{post.userAlias}</Text>
                      <View style={styles.postMeta}>
                        <View style={[styles.conditionTag, { backgroundColor: `${avatarColor}15` }]}>
                          <Text style={[styles.conditionTagText, { color: avatarColor, fontFamily: "Manrope_600SemiBold" }]}>{post.conditionTag}</Text>
                        </View>
                        <Text style={[styles.postDate, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>{post.date}</Text>
                      </View>
                    </View>
                    <View style={[styles.typeTag, { backgroundColor: typeStyle.bg }]}>
                      <Text style={[styles.typeTagText, { color: typeStyle.text, fontFamily: "Manrope_700Bold" }]}>
                        {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.postContent, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}>
                    {post.content}
                  </Text>

                  <View style={styles.postActions}>
                    <Pressable style={styles.actionBtn} onPress={() => handleLike(post.id)}>
                      <Feather
                        name="heart"
                        size={16}
                        color={post.liked ? "#E53935" : colors.mutedForeground}
                        style={{ opacity: post.liked ? 1 : 0.6 }}
                      />
                      <Text style={[styles.actionCount, {
                        color: post.liked ? "#E53935" : colors.mutedForeground,
                        fontFamily: "Manrope_500Medium",
                      }]}>
                        {post.likes}
                      </Text>
                    </Pressable>
                    <Pressable style={styles.actionBtn}>
                      <Feather name="message-circle" size={16} color={colors.mutedForeground} style={{ opacity: 0.6 }} />
                      <Text style={[styles.actionCount, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
                        {post.replies}
                      </Text>
                    </Pressable>
                    <Pressable style={styles.actionBtn}>
                      <Feather name="share-2" size={16} color={colors.mutedForeground} style={{ opacity: 0.6 }} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontSize: 26, lineHeight: 30 },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100 },
  shareBtnText: { color: "#fff", fontSize: 13 },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 20 },
  tabBtn: { flex: 1, paddingVertical: 13, alignItems: "center" },
  tabLabel: { fontSize: 14 },
  shareCard: { margin: 16, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1 },
  shareTitle: { fontSize: 16 },
  shareInput: { borderRadius: 12, padding: 14, fontSize: 14, lineHeight: 20, minHeight: 80, borderWidth: 1 },
  shareActions: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
  shareCancelBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 100, borderWidth: 1 },
  shareCancelText: { fontSize: 14 },
  sharePostBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 100 },
  sharePostText: { color: "#fff", fontSize: 14 },
  scroll: { paddingHorizontal: 16, paddingTop: 16 },
  achievementsContent: { gap: 20 },
  statsRow: { borderRadius: 16, padding: 16, flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center", gap: 4 },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 11 },
  sectionTitle: { fontSize: 20 },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  badgeCard: {
    width: "47%", borderRadius: 16, padding: 14, alignItems: "center", gap: 6, position: "relative",
    shadowColor: "#1D1B19", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  badgeEmoji: { fontSize: 32 },
  badgeTitle: { fontSize: 13, textAlign: "center" },
  badgeDesc: { fontSize: 11, textAlign: "center", lineHeight: 15 },
  earnedDot: {
    position: "absolute", top: 8, right: 8,
    width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center",
  },
  feedContent: { gap: 14 },
  postCard: {
    borderRadius: 18, padding: 16, gap: 12,
    shadowColor: "#1D1B19", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  postHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  postAvatarText: { color: "#fff", fontSize: 14 },
  postAlias: { fontSize: 14 },
  postMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  conditionTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  conditionTagText: { fontSize: 10 },
  postDate: { fontSize: 11 },
  typeTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  typeTagText: { fontSize: 9 },
  postContent: { fontSize: 14, lineHeight: 21 },
  postActions: { flexDirection: "row", gap: 20 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { fontSize: 13 },
});

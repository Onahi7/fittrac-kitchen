import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
  { id: "first_order", emoji: "🛒", title: "First Order", desc: "Placed your first healthy meal order", category: "order" },
  { id: "hydration_hero", emoji: "💧", title: "Hydration Hero", desc: "Log 8 glasses of water in a day", category: "health" },
  { id: "clean_plate", emoji: "🍛", title: "Clean Plate", desc: "Order 5 healthy meals", category: "nutrition" },
  { id: "iron_will", emoji: "🏋️", title: "Iron Will", desc: "Log exercise 7 days in a row", category: "fitness" },
  { id: "doctors_pet", emoji: "🩺", title: "Doctor's Pet", desc: "Book your first consultation", category: "health" },
  { id: "scale_warrior", emoji: "⚖️", title: "Scale Warrior", desc: "Log your weight 7 days in a row", category: "health" },
  { id: "fuel_up", emoji: "⚡", title: "Fuel Up", desc: "Log exercise 5 times", category: "fitness" },
  { id: "community_star", emoji: "⭐", title: "Community Star", desc: "Share your first milestone", category: "social" },
  { id: "half_century", emoji: "🎯", title: "Half Century", desc: "Place 50 healthy meal orders", category: "order" },
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
  "Wellness": "#5C6BC0",
};

interface Post {
  id: string; userAlias: string; conditionTag: string; content: string;
  type: "milestone" | "meal" | "insight" | "question";
  date: string; likes: number; liked: boolean; replies: number;
}

export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, consultations, todayExercise, weightLogs } = useApp();

  const [posts, setPosts] = useState<Post[]>([
    {
      id: "seed1", userAlias: "Chidi A.", conditionTag: "Diabetes",
      content: "Day 14 on the Fittrac meal plan — my fasting blood sugar dropped from 148 to 112! The Ofe Onugbu was a game changer 🙏",
      type: "milestone", date: "2h ago", likes: 24, liked: false, replies: 5,
    },
    {
      id: "seed2", userAlias: "Ngozi F.", conditionTag: "Hypertension",
      content: "Quick tip: I replaced my evening rice with the Moi Moi & Ugba combo and my BP readings have been consistently better this week.",
      type: "insight", date: "5h ago", likes: 31, liked: false, replies: 8,
    },
    {
      id: "seed3", userAlias: "Emeka O.", conditionTag: "Weight Loss",
      content: "Lost 3.2kg this month eating real Nigerian food. Who said you have to starve to lose weight? 💪",
      type: "milestone", date: "1d ago", likes: 47, liked: false, replies: 12,
    },
    {
      id: "seed4", userAlias: "Amaka B.", conditionTag: "Liver Health",
      content: "Does anyone have experience with the Bitter Leaf soup for liver support? My nutritionist recommended it but I want to hear real stories.",
      type: "question", date: "1d ago", likes: 9, liked: false, replies: 14,
    },
    {
      id: "seed5", userAlias: "Tunde K.", conditionTag: "Wellness",
      content: "Had my first telemedicine consultation today. Dr. Adeyemi was thorough and my new meal plan feels very doable. Excited to start!",
      type: "meal", date: "2d ago", likes: 18, liked: false, replies: 3,
    },
    {
      id: "seed6", userAlias: "Fatima M.", conditionTag: "Allergies",
      content: "Finally found a Nigerian diet that works around my groundnut allergy. The Egusi-free options here are 🔥",
      type: "insight", date: "3d ago", likes: 22, liked: false, replies: 6,
    },
  ]);
  const [activeTab, setActiveTab] = useState<"achievements" | "feed">("achievements");
  const [shareInput, setShareInput] = useState("");
  const [showShare, setShowShare] = useState(false);

  const computeEarned = (id: string): boolean => {
    switch (id) {
      case "first_order": return orders.length >= 1;
      case "clean_plate": return orders.length >= 5;
      case "half_century": return orders.length >= 50;
      case "doctors_pet": return consultations.length >= 1;
      case "fuel_up": return todayExercise.workouts >= 5;
      case "iron_will": return todayExercise.workouts >= 7;
      case "community_star": return posts.some((p) => p.userAlias === "You");
      case "scale_warrior": return weightLogs.length >= 7;
      default: return false;
    }
  };

  const earnedCount = ACHIEVEMENTS.filter((a) => computeEarned(a.id)).length;

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
              {tab === "achievements" ? `Achievements (${earnedCount}/${ACHIEVEMENTS.length})` : "Community Feed"}
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
              {ACHIEVEMENTS.map((ach) => {
                const earned = computeEarned(ach.id);
                return (
                  <View
                    key={ach.id}
                    style={[styles.badgeCard, {
                      backgroundColor: earned ? colors.card : colors.surfaceContainerLow,
                      borderColor: earned ? colors.primary : "transparent",
                      borderWidth: earned ? 1.5 : 0,
                      opacity: earned ? 1 : 0.5,
                    }]}
                  >
                    <Text style={[styles.badgeEmoji, { opacity: earned ? 1 : 0.4 }]}>{ach.emoji}</Text>
                    <Text style={[styles.badgeTitle, { color: colors.onSurface, fontFamily: "Manrope_700Bold" }]}>{ach.title}</Text>
                    <Text style={[styles.badgeDesc, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>{ach.desc}</Text>
                    {earned && (
                      <View style={[styles.earnedDot, { backgroundColor: colors.primary }]}>
                        <Feather name="check" size={8} color="#fff" />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {activeTab === "feed" && (
          <View style={styles.feedContent}>
            {posts.length === 0 ? (
              <View style={styles.emptyFeed}>
                <View style={[styles.emptyFeedIcon, { backgroundColor: colors.surfaceContainerLow }]}>
                  <Feather name="users" size={36} color={colors.outlineVariant} />
                </View>
                <Text style={[styles.emptyFeedTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
                  No posts yet
                </Text>
                <Text style={[styles.emptyFeedText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                  Be the first to share a health milestone with the community. Your story could inspire someone else on their wellness journey.
                </Text>
                <Pressable
                  style={[styles.firstPostBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setShowShare(true)}
                >
                  <Feather name="edit-2" size={15} color="#fff" />
                  <Text style={[styles.firstPostText, { fontFamily: "Manrope_700Bold" }]}>Share Your Win</Text>
                </Pressable>
              </View>
            ) : (
              posts.map((post) => {
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
              })
            )}
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
  tabLabel: { fontSize: 13 },
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
  emptyFeed: { alignItems: "center", paddingVertical: 48, gap: 16 },
  emptyFeedIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyFeedTitle: { fontSize: 22 },
  emptyFeedText: { fontSize: 14, lineHeight: 21, textAlign: "center", paddingHorizontal: 16 },
  firstPostBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100 },
  firstPostText: { color: "#fff", fontSize: 14 },
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

import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");

const SLIDES = [
  {
    id: "welcome",
    badge: "PRIVACY-FIRST ARCHITECTURE",
    badgeIcon: "shield" as const,
    icon: "🌿",
    title: "The Earth's\nApothecary.",
    subtitle: "Your Health, Our Secret.",
    body: "Start your journey instantly — no tracking required. Your wellness is a private conversation between you and nature.",
    features: [
      { icon: "book-open" as const, label: "Indigenous Wisdom" },
      { icon: "lock" as const, label: "Zero Data Leak" },
    ],
    bgTop: "#154212",
    bgBottom: "#FFF8F4",
  },
  {
    id: "heritage",
    badge: "OUR CULINARY HERITAGE",
    badgeIcon: "map-pin" as const,
    icon: "🫕",
    title: "A Journey Through\nNigeria's Kitchen.",
    subtitle: "Regional flavours. Real healing.",
    body: "Every meal is crafted from Nigeria's three great culinary traditions, prepared within 24 hours for maximum botanical potency.",
    features: [
      { icon: "clock" as const, label: "24-Hour Fresh Prep" },
      { icon: "users" as const, label: "500+ Wellness Travelers" },
    ],
    bgTop: "#8b500a",
    bgBottom: "#FFF8F4",
  },
  {
    id: "getstarted",
    badge: "PERSONALISED WELLNESS",
    badgeIcon: "star" as const,
    icon: "🩺",
    title: "Taste the Future\nof Wellness.",
    subtitle: "Nigerian cuisine built around your health.",
    body: "Personalised meal plans, real-time health tracking, and clinical consultation — all powered by Nigerian culinary wisdom.",
    features: [
      { icon: "activity" as const, label: "Health Tracking" },
      { icon: "heart" as const, label: "Clinical Support" },
    ],
    bgTop: "#2d5a27",
    bgBottom: "#FFF8F4",
  },
];

const REGIONS = [
  { emoji: "🌾", name: "Northern", desc: "Savannah Grains\n& Spices", dish: "Suya & Masa" },
  { emoji: "🌿", name: "Eastern", desc: "Lush Palms\n& Leafy Greens", dish: "Ugu & Oha" },
  { emoji: "🔥", name: "Western", desc: "Coastlines\n& Rich Legumes", dish: "Efo Riro & Ewedu" },
];

export default function OnboardingWelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const goToSlide = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_W, animated: true });
    setActiveIndex(index);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      goToSlide(activeIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem("fk_intro_seen", "1");
    router.replace("/register");
  };

  const handleLogin = async () => {
    await AsyncStorage.setItem("fk_intro_seen", "1");
    router.replace("/login");
  };

  const slide = SLIDES[activeIndex];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setActiveIndex(idx);
        }}
        style={styles.scroll}
      >
        {SLIDES.map((s, idx) => (
          <SlideContent
            key={s.id}
            slide={s}
            isHeritage={s.id === "heritage"}
            colors={colors}
            insets={insets}
          />
        ))}
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
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => goToSlide(i)}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === activeIndex ? colors.primary : colors.outlineVariant,
                    width: i === activeIndex ? 24 : 8,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.nextBtn,
            { backgroundColor: slide.bgTop, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleNext}
        >
          <Text style={[styles.nextBtnText, { fontFamily: "Epilogue_700Bold" }]}>
            {activeIndex < SLIDES.length - 1 ? "Continue" : "Create Account"}
          </Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </Pressable>

        <View style={styles.loginRow}>
          <Text style={[styles.loginText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            Already have an account?
          </Text>
          <Pressable onPress={handleLogin}>
            <Text style={[styles.loginLink, { color: colors.primary, fontFamily: "Manrope_700Bold" }]}>
              Sign in
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function SlideContent({
  slide,
  isHeritage,
  colors,
  insets,
}: {
  slide: (typeof SLIDES)[0];
  isHeritage: boolean;
  colors: any;
  insets: any;
}) {
  return (
    <View style={[styles.slide, { width: SCREEN_W }]}>
      <View style={[styles.slideHeader, { backgroundColor: slide.bgTop }]}>
        <View style={{ paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 24, paddingHorizontal: 28, paddingBottom: 40 }}>
          <View style={styles.badgeRow}>
            <Feather name={slide.badgeIcon} size={12} color="rgba(255,255,255,0.7)" />
            <Text style={[styles.badgeText, { fontFamily: "Manrope_600SemiBold" }]}>
              {slide.badge}
            </Text>
          </View>
          <Text style={[styles.emoji, { marginVertical: 16 }]}>{slide.icon}</Text>
          <Text style={[styles.slideTitle, { fontFamily: "Epilogue_700Bold" }]}>
            {slide.title}
          </Text>
          <Text style={[styles.slideSubtitle, { fontFamily: "Manrope_500Medium" }]}>
            {slide.subtitle}
          </Text>
        </View>
      </View>

      <View style={[styles.slideBody, { backgroundColor: colors.background }]}>
        <Text style={[styles.bodyText, { color: colors.onSurfaceVariant, fontFamily: "Manrope_400Regular" }]}>
          {slide.body}
        </Text>

        {isHeritage ? (
          <View style={styles.regionsRow}>
            {REGIONS.map((r) => (
              <View key={r.name} style={[styles.regionCard, { backgroundColor: colors.surfaceContainer }]}>
                <Text style={styles.regionEmoji}>{r.emoji}</Text>
                <Text style={[styles.regionName, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>
                  {r.name}
                </Text>
                <Text style={[styles.regionDesc, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                  {r.desc}
                </Text>
                <Text style={[styles.regionDish, { color: colors.secondary, fontFamily: "Manrope_600SemiBold" }]}>
                  {r.dish}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.features}>
            {slide.features.map((f) => (
              <View key={f.label} style={[styles.featureChip, { backgroundColor: colors.surfaceContainer }]}>
                <Feather name={f.icon} size={15} color={slide.bgTop} />
                <Text style={[styles.featureLabel, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
                  {f.label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  slide: { flex: 1 },
  slideHeader: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1.2,
  },
  emoji: { fontSize: 52 },
  slideTitle: {
    fontSize: 36,
    lineHeight: 42,
    color: "#fff",
    marginBottom: 8,
  },
  slideSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 22,
  },
  slideBody: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    gap: 20,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 23,
  },
  features: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 100,
  },
  featureLabel: { fontSize: 14 },
  regionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  regionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    gap: 4,
    alignItems: "center",
  },
  regionEmoji: { fontSize: 28, marginBottom: 4 },
  regionName: { fontSize: 13, textAlign: "center" },
  regionDesc: { fontSize: 11, textAlign: "center", lineHeight: 15 },
  regionDish: { fontSize: 11, textAlign: "center", marginTop: 2 },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingBottom: 4,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    borderRadius: 100,
  },
  nextBtnText: { color: "#fff", fontSize: 17 },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  loginText: { fontSize: 14 },
  loginLink: { fontSize: 14 },
});

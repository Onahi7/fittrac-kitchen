import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HealthTag } from "@/components/HealthTag";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getMealById } from "@/constants/data";

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addToBasket, basket } = useApp();
  const [selectedType, setSelectedType] = useState<
    "breakfast" | "lunch" | "dinner"
  >("lunch");

  const meal = getMealById(id ?? "");

  if (!meal) {
    return (
      <View
        style={[styles.notFound, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.notFoundText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
          Meal not found
        </Text>
      </View>
    );
  }

  const inBasket = basket.some(
    (i) => i.meal.id === meal.id && i.mealType === selectedType
  );

  const handleAddToBasket = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const mealTypeToUse =
      meal.mealType === "drink"
        ? selectedType
        : (meal.mealType as "breakfast" | "lunch" | "dinner");
    addToBasket({ meal, mealType: mealTypeToUse, quantity: 1 });
    router.push("/checkout");
  };

  const NUTRIENT_TYPES =
    meal.mealType === "drink"
      ? (["breakfast", "lunch", "dinner"] as const)
      : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100,
          },
        ]}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={meal.image}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View
            style={[
              styles.imageOverlay,
              {
                paddingTop:
                  insets.top + (Platform.OS === "web" ? 67 : 0) + 12,
              },
            ]}
          >
            <Pressable
              style={[
                styles.backBtn,
                { backgroundColor: "rgba(255,248,244,0.9)" },
              ]}
              onPress={() => router.back()}
            >
              <Feather name="arrow-left" size={20} color={colors.onSurface} />
            </Pressable>
            <Pressable
              style={[
                styles.backBtn,
                { backgroundColor: "rgba(255,248,244,0.9)" },
              ]}
              onPress={() => router.push("/checkout")}
            >
              <Feather name="shopping-bag" size={20} color={colors.onSurface} />
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          <View
            style={[
              styles.tagBanner,
              { backgroundColor: colors.tertiaryFixed },
            ]}
          >
            <Text
              style={[
                styles.tagBannerText,
                { color: colors.tertiary, fontFamily: "Manrope_700Bold" },
              ]}
            >
              THE HEALING PLATE
            </Text>
          </View>

          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.mealName,
                  { color: colors.onSurface, fontFamily: "Epilogue_700Bold" },
                ]}
              >
                {meal.name}
              </Text>
              <Text
                style={[
                  styles.mealDesc,
                  {
                    color: colors.mutedForeground,
                    fontFamily: "Manrope_400Regular",
                  },
                ]}
              >
                {meal.description}
              </Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text
              style={[
                styles.price,
                { color: colors.onSurface, fontFamily: "Epilogue_700Bold" },
              ]}
            >
              ₦{meal.price.toLocaleString()}
            </Text>
            <Text
              style={[
                styles.portion,
                {
                  color: colors.mutedForeground,
                  fontFamily: "Manrope_400Regular",
                },
              ]}
            >
              STANDARD PORTION
            </Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={14} color={colors.secondary} />
              <Text
                style={[
                  styles.rating,
                  {
                    color: colors.onSurface,
                    fontFamily: "Manrope_600SemiBold",
                  },
                ]}
              >
                4.9
              </Text>
              <Text
                style={[
                  styles.ratingCount,
                  {
                    color: colors.mutedForeground,
                    fontFamily: "Manrope_400Regular",
                  },
                ]}
              >
                (124 Reviews)
              </Text>
            </View>
          </View>

          <View style={[styles.sectionDivider, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[styles.sectionLabel, { color: colors.onSurface, fontFamily: "Epilogue_600SemiBold" }]}>
              Nutrient Profile
            </Text>
          </View>

          <View style={styles.nutrientGrid}>
            {[
              { label: "ENERGY", value: meal.calories, unit: "kcal" },
              { label: "PROTEIN", value: meal.protein, unit: "g" },
              { label: "CARBS", value: meal.carbs, unit: "g" },
              { label: "FIBRE", value: meal.fiber, unit: "g" },
            ].map((n) => (
              <View
                key={n.label}
                style={[
                  styles.nutrientItem,
                  { backgroundColor: colors.surfaceContainer },
                ]}
              >
                <Text
                  style={[
                    styles.nutrientValue,
                    {
                      color: colors.onSurface,
                      fontFamily: "Epilogue_700Bold",
                    },
                  ]}
                >
                  {n.value}
                  <Text style={{ fontSize: 14, fontFamily: "Manrope_400Regular" }}>
                    {n.unit}
                  </Text>
                </Text>
                <Text
                  style={[
                    styles.nutrientLabel,
                    {
                      color: colors.mutedForeground,
                      fontFamily: "Manrope_500Medium",
                    },
                  ]}
                >
                  {n.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.indexRow}>
            <View style={styles.indexItem}>
              <Text style={[styles.indexLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                Glycaemic Index & Sodium
              </Text>
              <Text style={[styles.indexValue, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
                Sodium Level ({meal.sodiumLevel})
              </Text>
            </View>
            <View
              style={[
                styles.indexBadge,
                {
                  backgroundColor:
                    meal.glycemicIndex === "Low"
                      ? "#E8F5E9"
                      : meal.glycemicIndex === "Medium"
                      ? "#FFF8E1"
                      : "#FFEBEE",
                },
              ]}
            >
              <Text
                style={[
                  styles.indexBadgeText,
                  {
                    color:
                      meal.glycemicIndex === "Low"
                        ? colors.primary
                        : meal.glycemicIndex === "Medium"
                        ? colors.secondary
                        : colors.destructive,
                    fontFamily: "Manrope_700Bold",
                  },
                ]}
              >
                GI: {meal.glycemicIndex}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.impactCard,
              { backgroundColor: colors.primaryContainer },
            ]}
          >
            <Text
              style={[
                styles.impactLabel,
                {
                  color: colors.onPrimaryContainer,
                  fontFamily: "Manrope_700Bold",
                },
              ]}
            >
              HEALTH IMPACT
            </Text>
            <Text
              style={[
                styles.impactText,
                {
                  color: colors.onPrimaryContainer,
                  fontFamily: "Manrope_400Regular",
                },
              ]}
            >
              {meal.healthImpact}
            </Text>
          </View>

          <View style={[styles.sectionDivider, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[styles.sectionLabel, { color: colors.onSurface, fontFamily: "Epilogue_600SemiBold" }]}>
              Pre-order for Tomorrow
            </Text>
          </View>

          {meal.mealType !== "drink" && (
            <View style={styles.mealTypeRow}>
              {(["breakfast", "lunch", "dinner"] as const).map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.mealTypeBtn,
                    {
                      backgroundColor:
                        selectedType === type
                          ? colors.primary
                          : colors.surfaceContainer,
                    },
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text
                    style={[
                      styles.mealTypeBtnText,
                      {
                        color:
                          selectedType === type
                            ? "#fff"
                            : colors.mutedForeground,
                        fontFamily:
                          selectedType === type
                            ? "Manrope_700Bold"
                            : "Manrope_500Medium",
                      },
                    ]}
                  >
                    {type.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={[styles.sectionDivider, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[styles.sectionLabel, { color: colors.onSurface, fontFamily: "Epilogue_600SemiBold" }]}>
              Delivery Method
            </Text>
          </View>

          <View style={styles.deliveryRow}>
            {[
              { key: "delivery", icon: "truck", label: "Home Delivery", sub: "Delivered between 7-10 & 12-5 PM" },
              { key: "pickup", icon: "map-pin", label: "On-site Pickup", sub: "Ready at Victoria Island Kitchen" },
            ].map((d) => (
              <View
                key={d.key}
                style={[
                  styles.deliveryCard,
                  {
                    backgroundColor:
                      d.key === "delivery"
                        ? colors.surfaceContainer
                        : colors.background,
                    borderColor:
                      d.key === "delivery"
                        ? colors.primary
                        : colors.outlineVariant,
                    borderWidth: d.key === "delivery" ? 1.5 : 1,
                  },
                ]}
              >
                <Feather
                  name={d.icon as any}
                  size={20}
                  color={
                    d.key === "delivery" ? colors.primary : colors.mutedForeground
                  }
                />
                <Text
                  style={[
                    styles.deliveryLabel,
                    {
                      color: d.key === "delivery" ? colors.primary : colors.onSurface,
                      fontFamily: "Manrope_600SemiBold",
                    },
                  ]}
                >
                  {d.label}
                </Text>
                <Text
                  style={[
                    styles.deliverySub,
                    {
                      color: colors.mutedForeground,
                      fontFamily: "Manrope_400Regular",
                    },
                  ]}
                >
                  {d.sub}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.sectionDivider, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[styles.sectionLabel, { color: colors.onSurface, fontFamily: "Epilogue_600SemiBold" }]}>
              Healing Ingredients
            </Text>
          </View>

          <View style={styles.ingredientsList}>
            {meal.healingIngredients.map((ing) => (
              <View key={ing} style={styles.ingredientRow}>
                <View style={[styles.ingredientDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.ingredientText, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}>
                  {ing}
                </Text>
              </View>
            ))}
          </View>

          {meal.chefNote && (
            <View
              style={[
                styles.chefNote,
                { backgroundColor: colors.tertiaryFixed },
              ]}
            >
              <Text style={[styles.chefNoteLabel, { color: colors.tertiary, fontFamily: "Manrope_700Bold" }]}>
                CHEF'S APOTHECARY NOTE
              </Text>
              <Text style={[styles.chefNoteText, { color: colors.tertiary, fontFamily: "Manrope_400Regular" }]}>
                {meal.chefNote}
              </Text>
            </View>
          )}

          <View style={styles.tagsRow}>
            {meal.tags.map((tag) => (
              <HealthTag key={tag} tag={tag} />
            ))}
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
              backgroundColor: inBasket ? colors.primaryContainer : colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={handleAddToBasket}
        >
          <Feather name="shopping-bag" size={18} color="#fff" />
          <Text style={[styles.ctaBtnText, { fontFamily: "Epilogue_700Bold" }]}>
            {inBasket ? "In Basket — View Checkout" : `Confirm Order ₦${meal.price.toLocaleString()}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {},
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 16 },
  imageWrapper: { position: "relative" },
  heroImage: { width: "100%", height: 300 },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 20, gap: 16 },
  tagBanner: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  tagBannerText: { fontSize: 10, letterSpacing: 1.5 },
  titleRow: { flexDirection: "row", gap: 12 },
  mealName: { fontSize: 28, lineHeight: 34 },
  mealDesc: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  price: { fontSize: 26 },
  portion: { fontSize: 10, letterSpacing: 1 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  rating: { fontSize: 14 },
  ratingCount: { fontSize: 13 },
  sectionDivider: { borderRadius: 12, padding: 14 },
  sectionLabel: { fontSize: 18 },
  nutrientGrid: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  nutrientItem: {
    flex: 1,
    minWidth: "22%",
    borderRadius: 14,
    padding: 14,
    gap: 4,
    alignItems: "center",
  },
  nutrientValue: { fontSize: 22, lineHeight: 28 },
  nutrientLabel: { fontSize: 10, letterSpacing: 0.8 },
  indexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  indexItem: { flex: 1, gap: 3 },
  indexLabel: { fontSize: 12 },
  indexValue: { fontSize: 14 },
  indexBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },
  indexBadgeText: { fontSize: 13 },
  impactCard: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  impactLabel: { fontSize: 10, letterSpacing: 1.5 },
  impactText: { fontSize: 14, lineHeight: 20 },
  mealTypeRow: { flexDirection: "row", gap: 8 },
  mealTypeBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 100,
    alignItems: "center",
  },
  mealTypeBtnText: { fontSize: 12, letterSpacing: 0.5 },
  deliveryRow: { flexDirection: "row", gap: 12 },
  deliveryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    alignItems: "center",
  },
  deliveryLabel: { fontSize: 14, textAlign: "center" },
  deliverySub: { fontSize: 11, textAlign: "center", lineHeight: 16 },
  ingredientsList: { gap: 8 },
  ingredientRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  ingredientDot: { width: 6, height: 6, borderRadius: 3 },
  ingredientText: { fontSize: 14 },
  chefNote: { borderRadius: 14, padding: 14, gap: 6 },
  chefNoteLabel: { fontSize: 10, letterSpacing: 1.5 },
  chefNoteText: { fontSize: 13, lineHeight: 19 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
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
});

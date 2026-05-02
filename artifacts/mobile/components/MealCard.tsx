import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { HealthTag } from "./HealthTag";
import type { Meal } from "@/constants/types";

interface MealCardProps {
  meal: Meal;
  showTypeBadge?: boolean;
}

export function MealCard({ meal, showTypeBadge = true }: MealCardProps) {
  const colors = useColors();
  const router = useRouter();
  const { addToBasket, basket } = useApp();

  const inBasket = basket.some((i) => i.meal.id === meal.id);

  const handleAdd = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    addToBasket({ meal, mealType: meal.mealType as "breakfast" | "lunch" | "dinner", quantity: 1 });
  };

  const mealTypeLabel: Record<string, string> = {
    breakfast: "BREAKFAST",
    lunch: "LUNCH",
    dinner: "DINNER",
    drink: "DRINK",
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, opacity: pressed ? 0.95 : 1 },
      ]}
      onPress={() =>
        router.push({ pathname: "/meal/[id]", params: { id: meal.id } })
      }
    >
      <View style={styles.imageContainer}>
        <Image source={meal.image as any} style={styles.image} resizeMode="cover" />
        {showTypeBadge && (
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor:
                  meal.mealType === "drink"
                    ? colors.tertiaryFixed
                    : colors.primaryContainer,
              },
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                {
                  color:
                    meal.mealType === "drink"
                      ? colors.tertiary
                      : colors.onPrimaryContainer,
                },
              ]}
            >
              {mealTypeLabel[meal.mealType]}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.tagsRow}>
          {meal.tags.slice(0, 2).map((tag) => (
            <HealthTag key={tag} tag={tag} small />
          ))}
        </View>

        <Text
          style={[styles.name, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}
          numberOfLines={2}
        >
          {meal.name}
        </Text>
        <Text
          style={[styles.description, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}
          numberOfLines={2}
        >
          {meal.description}
        </Text>

        <View style={styles.footer}>
          <View>
            <Text
              style={[styles.price, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}
            >
              ₦{meal.price.toLocaleString()}
            </Text>
            <Text style={[styles.calories, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
              {meal.calories} kcal
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.addBtn,
              {
                backgroundColor: inBasket
                  ? colors.onPrimaryContainer
                  : colors.primary,
                transform: [{ scale: pressed ? 0.9 : 1 }],
              },
            ]}
            onPress={handleAdd}
          >
            <Feather
              name={inBasket ? "check" : "plus"}
              size={18}
              color="#fff"
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#1D1B19",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 180,
  },
  typeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  typeBadgeText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    letterSpacing: 1,
  },
  content: {
    padding: 16,
    gap: 6,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 18,
    lineHeight: 24,
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  price: {
    fontSize: 20,
    lineHeight: 24,
  },
  calories: {
    fontSize: 12,
    marginTop: 1,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});

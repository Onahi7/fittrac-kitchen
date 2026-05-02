import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { TAG_COLORS } from "@/constants/data";

interface HealthTagProps {
  tag: string;
  small?: boolean;
}

export function HealthTag({ tag, small }: HealthTagProps) {
  const colors = TAG_COLORS[tag] ?? { bg: "#EDE7E3", text: "#45483F" };
  return (
    <View
      style={[
        styles.tag,
        { backgroundColor: colors.bg },
        small && styles.small,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: colors.text },
          small && styles.smallText,
        ]}
        numberOfLines={1}
      >
        {tag}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: "flex-start",
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.2,
  },
  smallText: {
    fontSize: 10,
  },
});

import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRider } from "@/context/RiderContext";
import { useColors } from "@/hooks/useColors";

export default function RiderTabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const isDark = useColorScheme() === "dark";
  const { activeOrder } = useRider();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.tabBarBackground,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          paddingBottom: insets.bottom,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBarBackground }]} />
          ) : null,
        tabBarLabelStyle: { fontFamily: "Manrope_500Medium", fontSize: 10 },
      }}
    >
      <Tabs.Screen name="rider-home" options={{ title: "Home", tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} /> }} />
      <Tabs.Screen
        name="rider-delivery"
        options={{
          title: "Delivery",
          tabBarBadge: activeOrder ? "!" : undefined,
          tabBarIcon: ({ color }) => <Feather name="navigation" size={22} color={color} />,
        }}
      />
      <Tabs.Screen name="rider-earnings" options={{ title: "Earnings", tabBarIcon: ({ color }) => <Feather name="credit-card" size={22} color={color} /> }} />
      <Tabs.Screen name="rider-profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} /> }} />
    </Tabs>
  );
}

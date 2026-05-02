import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useColors } from "@/hooks/useColors";
import { useClinicalAuth } from "@/context/ClinicalAuthContext";

export default function ClinicalTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const safeAreaInsets = useSafeAreaInsets();
  const { clinicalStaff } = useClinicalAuth();

  const isDoctor = clinicalStaff?.role === "doctor";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.tabBarBackground,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          paddingBottom: safeAreaInsets.bottom,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBarBackground }]} />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: "Manrope_500Medium",
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="cl-schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color }) => <Feather name="calendar" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cl-patients"
        options={{
          title: isDoctor ? "Patients" : "Clients",
          tabBarIcon: ({ color }) => <Feather name="users" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cl-tools"
        options={{
          title: isDoctor ? "Labs" : "Plans",
          tabBarIcon: ({ color }) => (
            <Feather name={isDoctor ? "clipboard" : "book-open"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cl-profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

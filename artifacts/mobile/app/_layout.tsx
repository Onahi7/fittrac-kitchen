import { useFonts } from "expo-font";
import {
  Epilogue_400Regular,
  Epilogue_600SemiBold,
  Epilogue_700Bold,
} from "@expo-google-fonts/epilogue";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ClinicalAuthProvider, useClinicalAuth } from "@/context/ClinicalAuthContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function NavigationGuard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isLoading: appLoading } = useApp();
  const { clinicalStaff, isLoading: clinicalLoading } = useClinicalAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || appLoading || clinicalLoading) return;

    const inClinicalTabs = segments[0] === "(clinical-tabs)";
    const inClinicalLogin = segments[0] === "clinical-login";
    const inLogin = segments[0] === "login";
    const inRegister = segments[0] === "register";
    const inOnboarding = segments[0] === "onboarding";
    const inAuthFlow = inLogin || inRegister || inOnboarding || inClinicalLogin;

    if (clinicalStaff) {
      if (!inClinicalTabs) router.replace("/(clinical-tabs)/cl-schedule");
    } else if (!isAuthenticated) {
      if (!inAuthFlow) router.replace("/login");
    } else {
      if (inAuthFlow || inClinicalTabs) router.replace("/(tabs)");
    }
  }, [isAuthenticated, authLoading, appLoading, clinicalStaff, clinicalLoading, segments]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <NavigationGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(clinical-tabs)" />
        <Stack.Screen name="clinical-login" options={{ presentation: "card" }} />
        <Stack.Screen name="meal/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="checkout" options={{ presentation: "card" }} />
        <Stack.Screen name="order-success" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="wellness" options={{ presentation: "card" }} />
        <Stack.Screen name="exercise" options={{ presentation: "card" }} />
        <Stack.Screen name="water" options={{ presentation: "card" }} />
        <Stack.Screen name="notifications" options={{ presentation: "card" }} />
        <Stack.Screen name="ai-coach" options={{ presentation: "card" }} />
        <Stack.Screen name="consultation-room" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="test-results" options={{ presentation: "card" }} />
        <Stack.Screen name="prescription" options={{ presentation: "card" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Epilogue_400Regular,
    Epilogue_600SemiBold,
    Epilogue_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <AppProvider>
            <ClinicalAuthProvider>
              <QueryClientProvider client={queryClient}>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </QueryClientProvider>
            </ClinicalAuthProvider>
          </AppProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

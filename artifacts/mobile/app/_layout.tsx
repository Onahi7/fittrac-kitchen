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
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ClinicalAuthProvider, useClinicalAuth } from "@/context/ClinicalAuthContext";
import { RiderProvider, useRider } from "@/context/RiderContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function NavigationGuard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isLoading: appLoading } = useApp();
  const { clinicalStaff, isLoading: clinicalLoading } = useClinicalAuth();
  const { rider, isLoading: riderLoading } = useRider();
  const segments = useSegments();
  const router = useRouter();
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("fk_intro_seen").then((val) => {
      setHasSeenIntro(val === "1");
    });
  }, []);

  useEffect(() => {
    if (authLoading || appLoading || clinicalLoading || riderLoading || hasSeenIntro === null) return;

    const currentSegment = segments[0] as string | undefined;
    const inClinicalTabs = currentSegment === "(clinical-tabs)";
    const inClinicalPatient = currentSegment === "clinical-patient";
    const inClinicalWorkspace = currentSegment === "consultation-room";
    const inClinicalLogin = currentSegment === "clinical-login";
    const inRiderTabs = currentSegment === "(rider-tabs)";
    const inRiderLogin = currentSegment === "rider-login";
    const inStaffLogin = currentSegment === "staff-login";
    const inLogin = currentSegment === "login";
    const inRegister = currentSegment === "register";
    const inOnboarding = currentSegment === "onboarding";
    const inIntro = currentSegment === "onboarding-welcome";
    const inAuthFlow = inLogin || inRegister || inOnboarding || inClinicalLogin || inRiderLogin || inStaffLogin || inIntro;

    if (clinicalStaff) {
      if (!inClinicalTabs && !inClinicalPatient && !inClinicalWorkspace) {
        router.replace("/(clinical-tabs)/cl-home");
      }
    } else if (rider) {
      if (!inRiderTabs) {
        router.replace("/(rider-tabs)/rider-home");
      }
    } else if (!isAuthenticated) {
      if (!inAuthFlow) {
        if (!hasSeenIntro) {
          router.replace("/onboarding-welcome" as any);
        } else {
          router.replace("/login");
        }
      }
    } else {
      if (inAuthFlow || inClinicalTabs || inRiderTabs) router.replace("/(tabs)");
    }
  }, [isAuthenticated, authLoading, appLoading, clinicalStaff, clinicalLoading, rider, riderLoading, segments, hasSeenIntro]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <NavigationGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding-welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(clinical-tabs)" />
        <Stack.Screen name="(rider-tabs)" />
        <Stack.Screen name="clinical-login" options={{ presentation: "card" }} />
        <Stack.Screen name="rider-login" options={{ presentation: "card" }} />
        <Stack.Screen name="staff-login" options={{ presentation: "card" }} />
        <Stack.Screen name="clinical-patient/[id]" options={{ presentation: "card" }} />
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
        <Stack.Screen name="delivery-tracking" options={{ presentation: "card" }} />
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
              <RiderProvider>
                <QueryClientProvider client={queryClient}>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <KeyboardProvider>
                      <RootLayoutNav />
                    </KeyboardProvider>
                  </GestureHandlerRootView>
                </QueryClientProvider>
              </RiderProvider>
            </ClinicalAuthProvider>
          </AppProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

import { useProfileHydrated, useProfileStore } from "@/store/profileStore";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrated = useProfileHydrated();
  const onboardingDone = useProfileStore((state) => state.onboardingDone);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const ready = hydrated && fontsLoaded;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Protected guard={!onboardingDone}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>

      <Stack.Protected guard={onboardingDone}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="budget" />
        <Stack.Screen name="progress" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="glossary" />
        <Stack.Screen name="parent" />
      </Stack.Protected>
    </Stack>
  );
}

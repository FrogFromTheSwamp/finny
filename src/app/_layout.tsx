import { useParentSession } from "@/api/parentSession";
import { useServerConnection } from "@/api/useServerConnection";
import { useGameHydrated } from "@/game/store/gameStore";
import { useAppModeStore } from "@/store/appModeStore";
import { useProfileHydrated, useProfileStore } from "@/store/profileStore";
import { useHydrated } from "@/store/useHydrated";
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
  const gameHydrated = useGameHydrated();
  const onboardingDone = useProfileStore((state) => state.onboardingDone);
  const storedMode = useAppModeStore((state) => state.mode);
  const modeHydrated = useHydrated(useAppModeStore);
  const parentHydrated = useHydrated(useParentSession);
  const parentLoggedIn = useParentSession((state) => !!state.refreshToken);
  // У тех, кто ставил приложение до появления режимов, онбординг уже пройден — это ребёнок
  const mode = storedMode ?? (onboardingDone ? "child" : null);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const ready =
    hydrated && gameHydrated && modeHydrated && parentHydrated && fontsLoaded;

  // Регистрация на сервере — только когда ребёнок прошёл онбординг (есть имя и цвет питомца)
  useServerConnection(ready && mode === "child" && onboardingDone);

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
        animation: "fade_from_bottom",
        animationDuration: 220,
      }}
    >
      {/* Новое устройство: выбор «ребёнок или взрослый» */}
      <Stack.Protected guard={mode === null}>
        <Stack.Screen name="who" />
      </Stack.Protected>

      {/* Режим взрослого */}
      <Stack.Protected guard={mode === "parent" && !parentLoggedIn}>
        <Stack.Screen name="parent-auth" />
      </Stack.Protected>
      <Stack.Protected guard={mode === "parent" && parentLoggedIn}>
        <Stack.Screen name="family" />
        <Stack.Screen name="family-link" />
      </Stack.Protected>

      {/* Режим ребёнка */}
      <Stack.Protected guard={mode === "child" && !onboardingDone}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>

      <Stack.Protected guard={mode === "child" && onboardingDone}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="budget" />
        <Stack.Screen name="progress" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="streak" />
        <Stack.Screen name="glossary" />
        <Stack.Screen name="parent" />
        <Stack.Screen name="lesson/[id]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="lesson-complete" />
        <Stack.Screen name="chapter-complete" options={{ gestureEnabled: false }} />
        <Stack.Screen name="goal-editor" />
        <Stack.Screen name="goal-detail" />
        <Stack.Screen name="budget-plan" options={{ gestureEnabled: false }} />
        <Stack.Screen name="history" />
        <Stack.Screen name="food-shop" />
        <Stack.Screen name="invite-parent" />
      </Stack.Protected>
    </Stack>
  );
}

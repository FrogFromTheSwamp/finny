import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useProfileHydrated, useProfileStore } from '@/store/profileStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrated = useProfileHydrated();
  const onboardingDone = useProfileStore((state) => state.onboardingDone);

  useEffect(() => {
    if (hydrated) {
      SplashScreen.hideAsync();
    }
  }, [hydrated]);

  if (!hydrated) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
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
import { Stack } from "expo-router";

export const unstable_settings = {
  initialRouteName: "welcome",
};

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="pet-hatch" options={{ animation: "none" }} />
    </Stack>
  );
}

import { Stack } from "expo-router";
import { KeyboardProvider } from "react-native-keyboard-controller";

export const unstable_settings = {
  initialRouteName: "welcome",
};

export default function OnboardingLayout() {
  return (
    <KeyboardProvider preload={false}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="pet-hatch" options={{ animation: "none" }} />
      </Stack>
    </KeyboardProvider>
  );
}

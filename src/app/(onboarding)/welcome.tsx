import meadowBg from "@/assets/background/meadow.png";
import finniLogo from "@/assets/logo/finni-logo.png";
import { BackgroundScreen } from "@/ui/BackgroundScreen";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const SPLASH_DURATION_MS = 3000;

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/enterName");
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <BackgroundScreen
      source={meadowBg}
      contentStyle={{ justifyContent: "center" }}
    >
      <Animated.Image
        entering={FadeIn.duration(500)}
        exiting={FadeOut.duration(300)}
        source={finniLogo}
        style={styles.logo}
        resizeMode="contain"
      />
    </BackgroundScreen>
  );
}

const styles = StyleSheet.create({
  logo: { width: "80%", height: 140, alignSelf: "center" },
});

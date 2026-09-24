import meadowBg from "@/assets/background/meadow.png";
import burstImage from "@/assets/pet/egg-burst.png";
import petImage from "@/assets/pet/pet-reveal.png";
import { HATCH_STAGES } from "@/content/hatchStages";
import { useProfileStore } from "@/store/profileStore";
import { BackgroundScreen } from "@/ui/BackgroundScreen";
import { Button } from "@/ui/Button";
import { PetStage } from "@/ui/PetStage";
import { TextField } from "@/ui/TextField";
import { colors, fontSize, spacing } from "@/ui/theme";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  BounceIn,
  FadeIn,
  FadeInUp,
  FadeOut,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const BURST_DURATION_MS = 900;
const NAME_FORM_DELAY_MS = 500;
const PET_SIZE = 220;

type Phase = "cracking" | "bursting" | "revealed";

export default function PetHatchScreen() {
  const completeOnboarding = useProfileStore(
    (state) => state.completeOnboarding,
  );

  const [tapCount, setTapCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("cracking");
  const [showNameForm, setShowNameForm] = useState(false);
  const [petName, setPetName] = useState("");

  const rotate = useSharedValue(0);
  const eggStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  const handleTap = () => {
    if (phase !== "cracking") return;

    const nextCount = tapCount + 1;

    if (nextCount >= HATCH_STAGES.length) {
      setPhase("bursting");
      return;
    }

    setTapCount(nextCount);
    rotate.value = withSequence(
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
  };

  useEffect(() => {
    if (phase !== "bursting") return;
    const timer = setTimeout(() => setPhase("revealed"), BURST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "revealed") return;
    const timer = setTimeout(() => setShowNameForm(true), NAME_FORM_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const canConfirm = petName.trim().length > 0;

  return (
    <BackgroundScreen source={meadowBg} contentStyle={styles.layout}>
      {phase === "cracking" && (
        <>
          <Text style={styles.hint}>{HATCH_STAGES[tapCount].caption}</Text>
          <View style={styles.imageSlot}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Постучать по яйцу"
              onPress={handleTap}
            >
              <Animated.Image
                source={HATCH_STAGES[tapCount].image}
                resizeMode="contain"
                style={[styles.image, eggStyle]}
              />
            </Pressable>
          </View>
        </>
      )}

      {phase === "bursting" && (
        <Animated.Image
          // entering={ZoomIn.springify().damping(10)}
          // exiting={FadeOut.duration(700)}
          entering={FadeIn}
          source={burstImage}
          resizeMode="cover"
          style={styles.absoluteFillObject}
        />
      )}

      {phase === "revealed" && (
        <View style={styles.revealedContainer}>
          <PetStage>
            <Animated.Image
              entering={BounceIn.duration(600)}
              source={petImage}
              resizeMode="contain"
              style={styles.absoluteFillObject}
            />
          </PetStage>

          {showNameForm && (
            <Animated.View
              entering={FadeInUp.duration(400)}
              style={styles.footer}
            >
              <Text style={styles.hint}>
                Какой хорошенький! Как его назовёшь?
              </Text>
              <TextField
                value={petName}
                onChangeText={setPetName}
                placeholder="Имя персонажа"
                maxLength={20}
              />
              <Button
                label="Начать игру"
                disabled={!canConfirm}
                onPress={() => completeOnboarding(petName.trim())}
              />
            </Animated.View>
          )}
        </View>
      )}
    </BackgroundScreen>
  );
}

const styles = StyleSheet.create({
  layout: { justifyContent: "space-between" },
  hint: { fontSize: fontSize.heading, color: colors.text, textAlign: "center" },
  imageSlot: { flex: 1, justifyContent: "center" },
  image: { width: PET_SIZE, height: 260, alignSelf: "center" },
  revealedContainer: { flex: 1 },
  petPinned: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    width: PET_SIZE,
    height: PET_SIZE,
    alignSelf: "center",
    transform: [{ translateY: -PET_SIZE / 2 }],
  },
  footer: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    gap: spacing.md,
  },
  absoluteFillObject: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});

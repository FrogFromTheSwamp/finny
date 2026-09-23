import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import meadowBg from '@/assets/background/meadow.png';
import eggImage from '@/assets/pet/egg.png';
import { BackgroundScreen } from '@/ui/BackgroundScreen';
import { colors, fontSize, spacing } from '@/ui/theme';

const HATCH_TAPS_REQUIRED = 5;
const EXIT_DELAY_MS = 500;

export default function PetHatchScreen() {
  const router = useRouter();
  const [tapCount, setTapCount] = useState(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  const eggStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }, { scale: scale.value }],
  }));

  const hatched = tapCount >= HATCH_TAPS_REQUIRED;

  const handleTap = () => {
    if (hatched) return;

    const nextCount = tapCount + 1;
    setTapCount(nextCount);

    if (nextCount < HATCH_TAPS_REQUIRED) {
      rotate.value = withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    } else {
      scale.value = withSequence(
        withTiming(1.15, { duration: 200 }),
        withTiming(0, { duration: 300 }),
      );
      setTimeout(() => router.replace('/pet-name'), EXIT_DELAY_MS);
    }
  };

  return (
    <BackgroundScreen source={meadowBg} contentStyle={styles.layout}>
      <Text style={styles.hint}>Кликай, чтобы помочь ему вылупиться!</Text>

      <View style={styles.eggSlot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Постучать по яйцу"
          onPress={handleTap}
        >
          <Animated.Image
            source={eggImage}
            resizeMode="contain"
            style={[styles.egg, eggStyle]}
          />
        </Pressable>
      </View>
    </BackgroundScreen>
  );
}

const styles = StyleSheet.create({
  layout: { justifyContent: 'flex-start' },
  hint: { fontSize: fontSize.heading, color: colors.text, textAlign: 'center' },
  eggSlot: { flex: 1, justifyContent: 'center' },
  egg: { width: 180, height: 220, alignSelf: 'center' },
});
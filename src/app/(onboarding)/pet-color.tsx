import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { BounceIn, FadeInUp } from 'react-native-reanimated';
import meadowBg from '@/assets/background/meadow.png';
import eggImage from '@/assets/pet/egg-stage-0.png';
import ArrowImage from '@/assets/symbols/arrow.svg';
import { BackgroundScreen } from '@/ui/BackgroundScreen';
import { PET_COLOR_OPTIONS } from '@/content/petColors';
import { colors, fontSize, MIN_TOUCH_SIZE, spacing } from '@/ui/theme';
import { useProfileStore } from '@/store/profileStore';

const REVEAL_DELAY_MS = 700;

export default function PetColorScreen() {
  const router = useRouter();
  const petColorId = useProfileStore((state) => state.petColorId);
  const setPetColor = useProfileStore((state) => state.setPetColor);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const canContinue = petColorId !== '';

  return (
    <BackgroundScreen source={meadowBg} contentStyle={styles.layout}>
      <View style={styles.titleSlot}>
        {revealed && (
          <Animated.Text entering={FadeInUp.duration(300)} style={styles.title}>
            Выбери цвет твоего будущего питомца
          </Animated.Text>
        )}
      </View>

      <Animated.Image
        entering={BounceIn.duration(700)}
        source={eggImage}
        style={styles.egg}
        resizeMode="contain"
      />

      <View style={styles.footerSlot}>
        {revealed && (
          <Animated.View entering={FadeInUp.duration(400)} style={styles.footer}>
            <View style={styles.palette}>
              {PET_COLOR_OPTIONS.map((option) => {
                const selected = option.id === petColorId;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected }}
                    onPress={() => setPetColor(option.id)}
                    style={[
                      styles.swatch,
                      { backgroundColor: option.hex },
                      selected && styles.swatchSelected,
                    ]}
                  />
                );
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="К следующему шагу"
              disabled={!canContinue}
              onPress={() => router.push('/pet-hatch')}
              style={[styles.arrow, !canContinue && styles.arrowDisabled]}
            >
              <ArrowImage width={26} />
            </Pressable>
          </Animated.View>
        )}
      </View>
    </BackgroundScreen>
  );
}

const styles = StyleSheet.create({
  layout: { justifyContent: 'space-between' },
  titleSlot: { minHeight: 60 },
  title: { fontSize: fontSize.heading, color: colors.text, textAlign: 'center' },
  egg: { width: 180, height: 220, alignSelf: 'center' },
  footerSlot: { minHeight: MIN_TOUCH_SIZE, justifyContent: 'flex-end' },
  footer: { gap: spacing.md },
  palette: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  swatch: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: 2,
    borderWidth: 6,
    borderColor: colors.background,
  },
  swatchSelected: { borderColor: colors.text, borderWidth: 6 },
  arrow: {
    alignSelf: 'flex-end',
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: MIN_TOUCH_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  arrowDisabled: { opacity: 0.4 },
  arrowText: { color: colors.onPrimary, fontSize: 20 },
});
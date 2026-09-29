import { useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import handPointer from '@/assets/library/ui/arrows/arrow-hint.png';

type Props = {
  style?: StyleProp<ViewStyle>;
  rotate?: string;
};

export function TutorialHand({ style, rotate = '0deg' }: Props) {
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(withTiming(6, { duration: 450 }), withTiming(0, { duration: 450 })),
      -1,
      true,
    );
  }, [bounce]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }, { rotate }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, style, animatedStyle]}>
      <Image source={handPointer} style={styles.hand} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute' },
  hand: { width: 40, height: 40 },
});

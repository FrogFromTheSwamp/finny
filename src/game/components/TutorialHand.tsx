import hand from '@/assets/library/ui/tap-hand.png';
import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

export function TutorialHand({ style, rotate = '0deg' }: { style?: StyleProp<ViewStyle>; rotate?: string }) {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -8, duration: 520, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 520, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);
  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, style, { transform: [{ translateY: bob }, { rotate }] }]}>
      <Image source={hand} style={styles.image} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', zIndex: 50, width: 58, height: 70 },
  image: { width: '100%', height: '100%' },
});

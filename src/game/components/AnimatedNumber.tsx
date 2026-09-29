import { useEffect, useRef, useState } from 'react';
import { Animated, Text, type StyleProp, type TextStyle } from 'react-native';

export function AnimatedNumber({ value, style }: { value: number; style?: StyleProp<TextStyle> }) {
  const animated = useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const listener = animated.addListener(({ value: next }) => setDisplay(Math.round(next)));
    return () => animated.removeListener(listener);
  }, [animated]);

  useEffect(() => {
    const animation = Animated.timing(animated, { toValue: value, duration: 220, useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [animated, value]);

  return <Text style={style}>{display}</Text>;
}

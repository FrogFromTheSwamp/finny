import type { ReactNode } from 'react';
import { ImageBackground, StyleSheet, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '@/ui/theme';

type Props = {
  source: ImageSourcePropType;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function BackgroundScreen({ source, children, contentStyle }: Props) {
  return (
    <ImageBackground source={source} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <SafeAreaView edges={['bottom']} style={[styles.content, contentStyle]}>
          {children}
        </SafeAreaView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1, padding: spacing.md, gap: spacing.md, justifyContent: 'flex-end' },
});
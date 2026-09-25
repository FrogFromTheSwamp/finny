import { spacing } from '@/ui/theme';
import type { ReactNode } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  source: ImageSourcePropType;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};


export function BackgroundScreen({ source, children, contentStyle }: Props) {
  return (
    <ImageBackground source={source} style={styles.background} resizeMode="cover">
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.safe}>
          <SafeAreaView edges={['bottom']} style={[styles.content, contentStyle]}>
            {children}
          </SafeAreaView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1, padding: spacing.md, gap: spacing.md, justifyContent: 'flex-end' },
});
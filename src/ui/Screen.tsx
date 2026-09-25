import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing } from '@/ui/theme';
import { AppText } from '@/ui/AppText';

type Props = {
  title?: string;
  children: ReactNode;
};

export function Screen({ title, children }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {title ? <AppText variant='title'>{title}</AppText> : null}
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.md, gap: spacing.md, justifyContent: 'center' },
  title: { fontSize: fontSize.title, color: colors.text, textAlign: 'center' },
});
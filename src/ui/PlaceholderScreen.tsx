import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, MIN_TOUCH_SIZE, spacing } from '@/ui/theme';
import { AppText } from '@/ui/AppText'

type ScreenLink = {
  label: string;
  href: Href;
  replace?: boolean;
};

type Props = {
  title: string;
  links?: ScreenLink[];
  showBack?: boolean;
};

export function PlaceholderScreen({ title, links = [], showBack = true }: Props) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <AppText variant='title' style={styles.title}>{title}</AppText>

        {links.map((link) => (
          <Pressable
            key={link.label}
            style={styles.button}
            onPress={() =>
              link.replace ? router.replace(link.href) : router.push(link.href)
            }
          >
            <AppText variant='button' style={styles.buttonText}>{link.label}</AppText>
          </Pressable>
        ))}

        {showBack && router.canGoBack() && (
          <Pressable
            style={[styles.button, styles.secondary]}
            onPress={() => router.back()}
          >
            <AppText variant='button' style={styles.secondaryText}>Назад</AppText>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.md, gap: spacing.md, justifyContent: 'center' },
  title: { fontSize: fontSize.title, color: colors.text, textAlign: 'center' },
  button: {
    minHeight: MIN_TOUCH_SIZE,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  buttonText: { fontSize: fontSize.body, color: colors.onPrimary },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  secondaryText: { fontSize: fontSize.body, color: colors.primary },
});
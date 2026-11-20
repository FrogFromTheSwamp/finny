/**
 * Самый первый экран на новом устройстве: «Кто будет играть?».
 * Ребёнок уходит в привычный онбординг с питомцем, взрослый — во вход в аккаунт.
 * Детям 7–8 лет проще выбрать по картинке, поэтому главное здесь — картинки.
 */
import adultArt from '@/assets/library/characters/adult/purple/neutral.png';
import childArt from '@/assets/library/characters/child/orange/happy.png';
import finnyLogo from '@/assets/branding/finny-logo.png';
import meadowBg from '@/assets/library/scenes/field.png';
import { useAppModeStore, type AppMode } from '@/store/appModeStore';
import { AppText } from '@/ui/AppText';
import { BackgroundScreen } from '@/ui/BackgroundScreen';
import { colors, spacing } from '@/ui/theme';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

function Choice({ image, label, hint, onPress }: {
  image: ImageSourcePropType;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image source={image} style={styles.art} resizeMode="contain" />
      <AppText variant="heading" style={styles.center}>{label}</AppText>
      <AppText style={[styles.center, styles.hint]}>{hint}</AppText>
    </Pressable>
  );
}

export default function WhoScreen() {
  const router = useRouter();
  const setMode = useAppModeStore((s) => s.setMode);

  const choose = (mode: AppMode) => {
    setMode(mode);
    router.replace('/'); // стартовый экран сам решит, куда вести дальше
  };

  return (
    <BackgroundScreen source={meadowBg} contentStyle={styles.content}>
      <Image source={finnyLogo} style={styles.logo} resizeMode="contain" />
      <AppText variant="title" style={styles.center}>Кто будет играть?</AppText>
      <View style={styles.row}>
        <Choice image={childArt} label="Я ребёнок" hint="Заведу питомца" onPress={() => choose('child')} />
        <Choice image={adultArt} label="Я взрослый" hint="Слежу за успехами" onPress={() => choose('parent')} />
      </View>
    </BackgroundScreen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', gap: spacing.lg },
  logo: { width: '70%', height: 110, alignSelf: 'center' },
  row: { flexDirection: 'row', gap: spacing.md },
  card: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  pressed: { transform: [{ scale: 0.96 }] },
  art: { width: 110, height: 110 },
  center: { textAlign: 'center' },
  hint: { color: colors.textMuted, fontSize: 14 },
});

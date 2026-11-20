/**
 * Главный экран взрослого: список привязанных детей.
 * Здесь же позже появится дашборд прогресса по навыкам (неделя 5).
 */
import brownPet from '@/assets/library/characters/child/brown/neutral.png';
import greenPet from '@/assets/library/characters/child/green/neutral.png';
import magentaPet from '@/assets/library/characters/child/magenta/neutral.png';
import orangePet from '@/assets/library/characters/child/orange/neutral.png';
import purplePet from '@/assets/library/characters/child/purple/neutral.png';
import { ApiError } from '@/api/client';
import { fetchParentMe, logoutParent, useParentSession } from '@/api/parentSession';
import type { ParentMe } from '@/api/types';
import { useAppModeStore } from '@/store/appModeStore';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { colors, spacing } from '@/ui/theme';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PET_ART: Record<string, ImageSourcePropType> = {
  brown: brownPet,
  green: greenPet,
  magenta: magentaPet,
  orange: orangePet,
  purple: purplePet,
};

export default function FamilyScreen() {
  const router = useRouter();
  const setMode = useAppModeStore((s) => s.setMode);
  const cachedName = useParentSession((s) => s.name);
  const [me, setMe] = useState<ParentMe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Обновляем список каждый раз, когда экран снова виден (например, после добавления ребёнка)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(null);
      fetchParentMe()
        .then((data) => active && setMe(data))
        .catch((e) => {
          if (!active) return;
          setError(
            e instanceof ApiError && e.isNetworkError
              ? 'Нет связи с сервером. Показать список детей пока не получится.'
              : 'Не удалось загрузить данные.',
          );
        })
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, []),
  );

  const logout = async () => {
    await logoutParent();
    setMode(null);
    router.replace('/');
  };

  const name = me?.name ?? cachedName;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title">{name ? `Здравствуйте, ${name}!` : 'Здравствуйте!'}</AppText>

        {loading && !me ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <AppText style={styles.error}>{error}</AppText> : null}

        {me && me.children.length === 0 ? (
          <View style={styles.card}>
            <AppText variant="label">Пока здесь никого нет</AppText>
            <AppText style={styles.muted}>
              Попросите ребёнка открыть в Finny «Настройки → Пригласить взрослого» и нажмите
              «Добавить ребёнка», чтобы ввести код с его экрана.
            </AppText>
          </View>
        ) : null}

        {me?.children.map((child) => (
          <View key={child.id} style={[styles.card, styles.childRow]}>
            <Image source={PET_ART[child.pet_color ?? ''] ?? brownPet} style={styles.pet} resizeMode="contain" />
            <View style={styles.childText}>
              <AppText variant="heading">{child.pet_name ?? 'Питомец'}</AppText>
              <AppText style={styles.muted}>
                С вами с {new Date(child.linked_at).toLocaleDateString('ru-RU')}
              </AppText>
              <AppText style={styles.muted}>Прогресс по навыкам появится здесь скоро</AppText>
            </View>
          </View>
        ))}

        <Button label="Добавить ребёнка" onPress={() => router.push('/family-link')} />
        <Button label="Выйти из аккаунта" variant="secondary" onPress={logout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  card: { padding: spacing.md, gap: spacing.xs, borderRadius: 16, backgroundColor: colors.surface },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  childText: { flex: 1, gap: 2 },
  pet: { width: 72, height: 72 },
  muted: { color: colors.textMuted },
  error: { color: colors.danger },
});

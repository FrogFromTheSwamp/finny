/**
 * Экран ребёнка «Пригласить родителя»: показывает одноразовый код,
 * который взрослый вводит у себя в приложении. Код живёт 15 минут.
 */
import { requestLinkCode } from '@/api/childSession';
import { ApiError } from '@/api/client';
import type { LinkCode } from '@/api/types';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { colors, spacing } from '@/ui/theme';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

function formatLeft(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export default function InviteParentScreen() {
  const router = useRouter();
  const [code, setCode] = useState<LinkCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCode(await requestLinkCode());
    } catch (e) {
      setCode(null);
      setError(
        e instanceof ApiError && e.isNetworkError
          ? 'Нужен интернет. Подключись к Wi-Fi и попробуй ещё раз.'
          : 'Не получилось создать код. Попробуй ещё раз.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Обратный отсчёт до конца жизни кода
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const msLeft = code ? new Date(code.expires_at).getTime() - now : 0;
  const expired = !!code && msLeft <= 0;

  return (
    <Screen title="Пригласить взрослого">
      <AppText style={styles.center}>
        Покажи этот код маме, папе или другому взрослому. Пусть введёт его у себя в приложении Finny.
      </AppText>

      <View style={styles.codeBox}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : code && !expired ? (
          <>
            <AppText style={styles.code} accessibilityLabel={`Код ${code.code.split('').join(' ')}`}>
              {code.code.slice(0, 3)} {code.code.slice(3)}
            </AppText>
            <AppText style={styles.muted}>Код работает ещё {formatLeft(msLeft)}</AppText>
          </>
        ) : expired ? (
          <AppText style={styles.muted}>Время кода вышло. Нажми «Новый код».</AppText>
        ) : (
          <AppText style={[styles.muted, styles.error]}>{error}</AppText>
        )}
      </View>

      <Button label="Новый код" onPress={load} disabled={loading} />
      <Button label="Назад" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  codeBox: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  code: { fontSize: 48, letterSpacing: 6, fontWeight: '700', color: colors.primary },
  muted: { color: colors.textMuted, textAlign: 'center' },
  error: { color: colors.danger },
});

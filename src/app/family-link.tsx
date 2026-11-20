/**
 * Взрослый вводит код с экрана ребёнка и даёт согласие на обработку данных.
 */
import { ApiError } from '@/api/client';
import { linkChild } from '@/api/parentSession';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/TextField';
import { colors, spacing } from '@/ui/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function explain(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) return 'Нет связи с сервером. Проверьте интернет.';
    if (error.status === 404) return 'Код не подошёл или устарел. Попросите ребёнка нажать «Новый код».';
    return error.message; // например, «Слишком много неверных попыток…»
  }
  return 'Что-то пошло не так. Попробуйте ещё раз.';
}

export default function FamilyLinkScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedName, setLinkedName] = useState<string | null>(null);
  const [alreadyLinked, setAlreadyLinked] = useState(false);

  const digits = code.replace(/\D/g, '');
  const canSubmit = digits.length === 6 && consent && !busy;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const child = await linkChild(digits);
      setAlreadyLinked(!!child.already_linked);
      setLinkedName(child.pet_name ?? 'Питомец');
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  };

  if (linkedName) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <AppText variant="title">{alreadyLinked ? 'Уже в списке' : 'Готово!'}</AppText>
          <AppText>
            {alreadyLinked
              ? `${linkedName} уже был в вашем списке — добавлять второй раз не нужно.`
              : `${linkedName} теперь в вашем списке. Прогресс ребёнка будет появляться у вас автоматически.`}
          </AppText>
          <Button label="К списку детей" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText variant="title">Добавить ребёнка</AppText>
        <AppText style={styles.muted}>
          На телефоне ребёнка: «Настройки → Пригласить взрослого». Введите 6 цифр с его экрана.
        </AppText>

        <TextField label="Код" value={code} onChangeText={setCode} placeholder="123 456" keyboardType="number-pad" maxLength={7} />

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consent }}
          onPress={() => setConsent((v) => !v)}
          style={styles.consentRow}
        >
          <View style={[styles.box, consent && styles.boxChecked]}>
            {consent ? <AppText style={styles.check}>✓</AppText> : null}
          </View>
          <AppText style={styles.consentText}>
            Я родитель или законный представитель ребёнка и согласен(на) на обработку данных
            о его игровом прогрессе в приложении Finny.
          </AppText>
        </Pressable>

        {error ? <AppText style={styles.error}>{error}</AppText> : null}

        <Button label={busy ? 'Проверяю…' : 'Добавить'} onPress={submit} disabled={!canSubmit} />
        <Button label="Назад" variant="secondary" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, flexGrow: 1, justifyContent: 'center' },
  muted: { color: colors.textMuted },
  consentRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  box: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  boxChecked: { backgroundColor: colors.primary },
  check: { color: colors.onPrimary, fontSize: 16, lineHeight: 18 },
  consentText: { flex: 1, fontSize: 14 },
  error: { color: colors.danger },
});

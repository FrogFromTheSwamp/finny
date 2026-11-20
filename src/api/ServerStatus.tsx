/**
 * Блок «Связь с сервером» для экрана настроек: показывает, зарегистрирован ли
 * профиль, и позволяет проверить связь. Удобно при разработке и для демонстрации.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { fetchChildProfile, useServerSession } from '@/api/childSession';
import { API_URL } from '@/api/config';
import { flushLearning, useLearningOutbox } from '@/api/learningOutbox';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';

export function ServerStatus() {
  const childId = useServerSession((s) => s.childId);
  const lastError = useServerSession((s) => s.lastError);
  const lastContactAt = useServerSession((s) => s.lastContactAt);
  const queued = useLearningOutbox((s) => s.events.length);
  const sentTotal = useLearningOutbox((s) => s.sentTotal);
  const flushError = useLearningOutbox((s) => s.lastFlushError);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const check = async () => {
    setChecking(true);
    setResult(null);
    try {
      await flushLearning(); // заодно отправим накопленные ответы
      const profile = await fetchChildProfile();
      setResult(`Сервер узнал питомца «${profile.pet_name ?? 'без имени'}»`);
    } catch (error) {
      setResult(error instanceof Error ? error.message : String(error));
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.box}>
      <AppText variant="label">Связь с сервером</AppText>
      <AppText style={styles.small}>Адрес: {API_URL}</AppText>
      <AppText style={styles.small}>
        {childId ? `Профиль: ${childId.slice(0, 8)}…` : 'Профиль ещё не зарегистрирован'}
      </AppText>
      {lastContactAt ? (
        <AppText style={styles.small}>
          Последняя связь: {new Date(lastContactAt).toLocaleString('ru-RU')}
        </AppText>
      ) : null}
      {lastError ? <AppText style={[styles.small, styles.error]}>Ошибка: {lastError}</AppText> : null}
      <AppText style={styles.small}>
        Ответов в очереди: {queued} · отправлено на сервер: {sentTotal}
      </AppText>
      {flushError ? <AppText style={[styles.small, styles.error]}>Отправка: {flushError}</AppText> : null}
      {result ? <AppText style={styles.small}>{result}</AppText> : null}
      <Button label={checking ? 'Проверяю…' : 'Проверить связь'} onPress={check} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 6, padding: 12, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.04)' },
  small: { fontSize: 13 },
  error: { color: '#B3261E' },
});

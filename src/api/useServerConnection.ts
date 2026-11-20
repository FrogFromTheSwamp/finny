/**
 * Связь с сервером на уровне всего приложения: при запуске и при каждом
 * возвращении в приложение убеждаемся, что ребёнок зарегистрирован.
 * и отправляем накопленные ответы.
 */
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { ensureChildRegistered } from '@/api/childSession';
import { flushLearning } from '@/api/learningOutbox';
import { useProfileStore } from '@/store/profileStore';

export function useServerConnection(enabled: boolean) {
  const petName = useProfileStore((s) => s.petName);
  const petColorId = useProfileStore((s) => s.petColorId);

  useEffect(() => {
    if (!enabled) return;
    const connect = () => {
      // Сначала пропуск, потом отправка накопленных ответов
      void ensureChildRegistered({ petName, petColorId }).then(flushLearning);
    };
    connect();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') connect();
    });
    return () => subscription.remove();
  }, [enabled, petName, petColorId]);
}

/**
 * Связь с сервером на уровне всего приложения: при запуске и при каждом
 * возвращении в приложение убеждаемся, что ребёнок зарегистрирован.
 * Позже сюда же добавится отправка накопленных ответов.
 */
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { ensureChildRegistered } from '@/api/childSession';
import { useProfileStore } from '@/store/profileStore';

export function useServerConnection(enabled: boolean) {
  const petName = useProfileStore((s) => s.petName);
  const petColorId = useProfileStore((s) => s.petColorId);

  useEffect(() => {
    if (!enabled) return;
    const connect = () => {
      void ensureChildRegistered({ petName, petColorId });
    };
    connect();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') connect();
    });
    return () => subscription.remove();
  }, [enabled, petName, petColorId]);
}

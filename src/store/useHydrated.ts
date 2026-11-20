import { useEffect, useState } from 'react';

/**
 * Любой zustand-стор с persist. S — тип его состояния: функция подстраивается
 * под конкретный стор (generic), поэтому подходит и режиму приложения,
 * и сессии родителя, и любому другому сохраняемому стору.
 */
type PersistedStore<S> = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (listener: (state: S) => void) => () => void;
  };
};

/** true, когда сохранённое состояние стора уже подгружено из памяти телефона. */
export function useHydrated<S>(store: PersistedStore<S>): boolean {
  const [hydrated, setHydrated] = useState(store.persist.hasHydrated());
  useEffect(() => {
    const unsubscribe = store.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(store.persist.hasHydrated());
    return unsubscribe;
  }, [store]);
  return hydrated;
}

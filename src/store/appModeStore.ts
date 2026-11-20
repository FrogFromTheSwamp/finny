/**
 * Режим приложения на этом устройстве: детский (питомец и уроки)
 * или родительский (аккаунт взрослого и прогресс детей).
 * Выбирается один раз на первом экране «Кто будет играть?».
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AppMode = 'child' | 'parent';

type AppModeState = {
  mode: AppMode | null;
  setMode: (mode: AppMode | null) => void;
};

export const useAppModeStore = create<AppModeState>()(
  persist(
    (set) => ({
      mode: null,
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'finny-app-mode',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

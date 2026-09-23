import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ProfileState = {
  playerName: string;
  petName: string;
  petColorId: string;
  onboardingDone: boolean;
  setPlayerName: (name: string) => void;
  setPetColor: (colorId: string) => void;
  completeOnboarding: (petName: string) => void;
  resetProfile: () => void;
};

const initialData = {
  playerName: '',
  petName: '',
  petColorId: '',
  onboardingDone: false,
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      ...initialData,
      setPlayerName: (playerName) => set({ playerName }),
      setPetColor: (petColorId) => set({ petColorId }),
      completeOnboarding: (petName) => set({ petName, onboardingDone: true }),
      resetProfile: () => set(initialData),
    }),
    {
      name: 'finny-profile', // ключ в AsyncStorage
      version: 1, // пригодится, если структура данных изменится
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// Чтение из AsyncStorage асинхронное, поэтому нужно знать,
// когда данные уже восстановлены.
export function useProfileHydrated() {
  const [hydrated, setHydrated] = useState(useProfileStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = useProfileStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    setHydrated(useProfileStore.persist.hasHydrated());
    return unsubscribe;
  }, []);

  return hydrated;
}
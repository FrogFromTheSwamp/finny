import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PetColorId } from '@/content/petColors';

type ProfileState = {
  playerName: string;
  petName: string;
  petColorId: PetColorId | '';
  onboardingDone: boolean;

  setPlayerName: (name: string) => void;
  setPetColor: (colorId: PetColorId) => void;
  completeOnboarding: (petName: string) => void;
  resetProfile: () => void;
};

const initialData: Pick<
  ProfileState,
  'playerName' | 'petName' | 'petColorId' | 'onboardingDone'
> = {
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

      completeOnboarding: (petName) =>
        set({
          petName,
          onboardingDone: true,
        }),

      resetProfile: () => set(initialData),
    }),

    {
      name: 'finny-profile',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function useProfileHydrated() {
  const [hydrated, setHydrated] = useState(
    useProfileStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsubscribe =
      useProfileStore.persist.onFinishHydration(() =>
        setHydrated(true),
      );

    setHydrated(
      useProfileStore.persist.hasHydrated(),
    );

    return unsubscribe;
  }, []);

  return hydrated;
}
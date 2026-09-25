import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PetColorId } from '@/content/petColors';
import { TEST_DATA_ENABLED, TEST_DATA_SEED, TEST_DATA_SESSION, TEST_PROFILE } from '@/game/testData';

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
  playerName: TEST_DATA_ENABLED ? TEST_PROFILE.playerName : '',
  petName: TEST_DATA_ENABLED ? TEST_PROFILE.petName : '',
  petColorId: TEST_DATA_ENABLED ? TEST_PROFILE.petColorId : '',
  onboardingDone: TEST_DATA_ENABLED,
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
      name: TEST_DATA_ENABLED ? `finny-profile-test-${TEST_DATA_SEED}-${TEST_DATA_SESSION}` : 'finny-profile',
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { PetColorId } from "@/content/petColors";
import {
  TEST_DATA_ENABLED,
  TEST_DATA_SEED,
  TEST_DATA_SESSION,
  TEST_PROFILE,
} from "@/game/testData";

type ProfileState = {
  playerName: string;
  petName: string;
  petColorId: PetColorId | "";
  onboardingDone: boolean;
  tutorialFeedDone: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;

  setPlayerName: (name: string) => void;
  setPetColor: (colorId: PetColorId) => void;
  completeOnboarding: (petName: string) => void;
  resetProfile: () => void;
  completeTutorialFeed: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
};

const initialData: Pick<
  ProfileState,
  | "playerName"
  | "petName"
  | "petColorId"
  | "onboardingDone"
  | "tutorialFeedDone"
  | "notificationsEnabled"
  | "soundEnabled"
> = {
  playerName: TEST_DATA_ENABLED ? TEST_PROFILE.playerName : "",
  petName: TEST_DATA_ENABLED ? TEST_PROFILE.petName : "",
  petColorId: TEST_DATA_ENABLED ? TEST_PROFILE.petColorId : "",
  onboardingDone: TEST_DATA_ENABLED,
  tutorialFeedDone: TEST_DATA_ENABLED,
  notificationsEnabled: true,
  soundEnabled: false,
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

      completeTutorialFeed: () => set({ tutorialFeedDone: true }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),

      resetProfile: () => set(initialData),
    }),

    {
      name: TEST_DATA_ENABLED
        ? `finny-profile-test-${TEST_DATA_SEED}-${TEST_DATA_SESSION}`
        : "finny-profile",
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
    const unsubscribe = useProfileStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );

    setHydrated(useProfileStore.persist.hasHydrated());

    return unsubscribe;
  }, []);

  return hydrated;
}

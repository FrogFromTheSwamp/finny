import { create } from 'zustand';
export type TutorialHintId = 'tab-food' | 'tab-wardrobe';

type TutorialHintState = {
  activeHint: TutorialHintId | null;
  showHint: (id: TutorialHintId) => void;
  clearHint: () => void;
};

export const useTutorialHintStore = create<TutorialHintState>((set) => ({
  activeHint: null,
  showHint: (id) => set({ activeHint: id }),
  clearHint: () => set({ activeHint: null }),
}));

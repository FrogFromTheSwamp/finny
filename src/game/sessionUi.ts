// Navigation can remount a screen. Keep lightweight UI position for this app session.
export const sessionUi = {
  learnScrollY: 0,
  goalsScrollY: 0,
  goalsCardsScrollX: 0,
  wardrobeIndex: null as number | null,
  foodCategory: null as string | null,
  lessonStep: {} as Record<string, number>,
};

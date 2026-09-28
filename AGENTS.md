# Finny project notes

- Expo Router, React Native, TypeScript.
- Alias `@/` points to `src/`.
- Persistent state: `src/game/store/gameStore.ts` and `src/store/profileStore.ts`.
- Learning definitions: `src/features/learning/content.ts`; interactive mechanics live in `src/app/lesson/[id].tsx`.
- Goal catalog: `src/features/goals/catalog.ts`.
- Reusable budget controls: `src/features/budget/BudgetControls.tsx`.
- Runtime visual assets: `src/assets/library/` and `src/assets/branding/` only.
- Do not restore legacy asset folders or add full-screen design screenshots as runtime UI.
- Preserve stable entity IDs when changing only filenames; persisted AsyncStorage data may depend on them.
- First-run economy is intentional: 0 -> daily +10 -> apple -5 -> 5 -> dotted hat 16 -> shortage 11 -> first goal target 15.
- Pet grows after chapter `budget` is completed.

# Finny implementation guide

The app is a local-first Expo Router game. Preserve the existing onboarding, home, food and shop flows. Learning, savings goals and budget planning share `useGameStore`; actions must remain connected across tabs and persist through AsyncStorage. Prefer data-driven lesson content and reusable components over duplicated screens.

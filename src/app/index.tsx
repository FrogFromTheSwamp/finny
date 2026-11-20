import { Redirect } from 'expo-router';

import { useParentSession } from '@/api/parentSession';
import { useAppModeStore } from '@/store/appModeStore';
import { useProfileStore } from '@/store/profileStore';

/** Стартовая точка: решает, какой экран показать, по режиму устройства. */
export default function Index() {
  const onboardingDone = useProfileStore((state) => state.onboardingDone);
  const storedMode = useAppModeStore((state) => state.mode);
  const parentLoggedIn = useParentSession((state) => !!state.refreshToken);
  const mode = storedMode ?? (onboardingDone ? 'child' : null);

  if (mode === null) return <Redirect href="/who" />;
  if (mode === 'parent') return <Redirect href={parentLoggedIn ? '/family' : '/parent-auth'} />;
  return <Redirect href={onboardingDone ? '/home' : '/welcome'} />;
}

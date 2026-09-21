import { Redirect } from 'expo-router';
import { useProfileStore } from '@/store/profileStore';

export default function Index() {
  const onboardingDone = useProfileStore((state) => state.onboardingDone);
  return <Redirect href={onboardingDone ? '/home' : '/welcome'} />;
}
import { PlaceholderScreen } from '@/ui/PlaceholderScreen';

export default function WelcomeScreen() {
  return (
    <PlaceholderScreen
      title="Знакомство"
      links={[{ label: 'Дальше', href: '/profile' }]}
    />
  );
}
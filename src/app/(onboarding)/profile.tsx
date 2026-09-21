import { PlaceholderScreen } from '@/ui/PlaceholderScreen';

export default function ProfileScreen() {
  return (
    <PlaceholderScreen
      title="Профиль"
      links={[{ label: 'Дальше', href: '/pet' }]}
    />
  );
}
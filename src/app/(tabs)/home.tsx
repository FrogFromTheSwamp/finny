import { PlaceholderScreen } from '@/ui/PlaceholderScreen';

export default function HomeScreen() {
  return (
    <PlaceholderScreen
      title="Главный экран"
      showBack={false}
      links={[
        { label: 'План бюджета', href: '/budget' },
        { label: 'Прогресс', href: '/progress' },
        { label: 'Настройки', href: '/settings' },
      ]}
    />
  );
}
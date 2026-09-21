import { PlaceholderScreen } from '@/ui/PlaceholderScreen';
import { useProfileStore } from '@/store/profileStore';

export default function HomeScreen() {
  const playerName = useProfileStore((state) => state.playerName);
  const petName = useProfileStore((state) => state.petName);

  return (
    <PlaceholderScreen
      title={`Привет, ${playerName}! Питомец: ${petName}`}
      showBack={false}
      links={[
        { label: 'План бюджета', href: '/budget' },
        { label: 'Прогресс', href: '/progress' },
        { label: 'Настройки', href: '/settings' },
      ]}
    />
  );
}
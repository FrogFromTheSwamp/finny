import { PlaceholderScreen } from '@/ui/PlaceholderScreen';

export default function PetScreen() {
  return (
    <PlaceholderScreen
      title="Создание питомца"
      links={[{ label: 'Начать игру', href: '/home', replace: true }]}
    />
  );
}
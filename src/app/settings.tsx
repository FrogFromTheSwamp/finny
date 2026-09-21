import { PlaceholderScreen } from '@/ui/PlaceholderScreen';

export default function SettingsScreen() {
  return (
    <PlaceholderScreen
      title="Настройки"
      links={[
        { label: 'Раздел для взрослого', href: '/parent' },
        { label: 'Справочник', href: '/glossary' },
      ]}
    />
  );
}
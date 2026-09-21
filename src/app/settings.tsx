import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { useProfileStore } from '@/store/profileStore';

export default function SettingsScreen() {
  const router = useRouter();
  const resetProfile = useProfileStore((state) => state.resetProfile);

  const confirmReset = () => {
    Alert.alert('Сбросить профиль?', 'Питомец и весь прогресс будут удалены.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Сбросить', style: 'destructive', onPress: resetProfile },
    ]);
  };

  return (
    <Screen title="Настройки">
      <Button label="Раздел для взрослого" onPress={() => router.push('/parent')} />
      <Button label="Справочник" onPress={() => router.push('/glossary')} />
      <Button label="Сбросить профиль" onPress={confirmReset} />
      <Button label="Назад" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
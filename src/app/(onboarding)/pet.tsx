import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { TextField } from '@/ui/TextField';
import { useProfileStore } from '@/store/profileStore';

export default function PetScreen() {
  const router = useRouter();
  const completeOnboarding = useProfileStore((state) => state.completeOnboarding);
  const [petName, setPetName] = useState('');

  const canContinue = petName.trim().length > 0;

  return (
    <Screen title="Создай питомца">
      <TextField
        label="Имя питомца"
        value={petName}
        onChangeText={setPetName}
        maxLength={20}
      />
      <Button
        label="Начать игру"
        disabled={!canContinue}
        onPress={() => completeOnboarding(petName.trim())}
      />
      <Button label="Назад" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
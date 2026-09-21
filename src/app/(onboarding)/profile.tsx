import { useRouter } from 'expo-router';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { TextField } from '@/ui/TextField';
import { useProfileStore } from '@/store/profileStore';

export default function ProfileScreen() {
  const router = useRouter();
  const playerName = useProfileStore((state) => state.playerName);
  const setPlayerName = useProfileStore((state) => state.setPlayerName);

  const canContinue = playerName.trim().length > 0;

  return (
    <Screen title="Как тебя зовут?">
      <TextField
        label="Игровое имя"
        value={playerName}
        onChangeText={setPlayerName}
        maxLength={20}
      />
      <Button label="Дальше" disabled={!canContinue} onPress={() => router.push('/pet')} />
      <Button label="Назад" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
import { useRouter } from 'expo-router';
import meadowBg from '@/assets/background/meadow.png';
import { BackgroundScreen } from '@/ui/BackgroundScreen';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/TextField';
import { useProfileStore } from '@/store/profileStore';

export default function EnterNameScreen() {
  const router = useRouter();
  const playerName = useProfileStore((state) => state.playerName);
  const setPlayerName = useProfileStore((state) => state.setPlayerName);

  const canContinue = playerName.trim().length > 0;

  return (
    <BackgroundScreen source={meadowBg}>
      <TextField
        label="Придумай игровое имя"
        value={playerName}
        onChangeText={setPlayerName}
        placeholder="Никнейм"
        maxLength={20}
      />
      <Button
        label="К следующему шагу!"
        disabled={!canContinue}
        onPress={() => router.push('/pet')}
      />
    </BackgroundScreen>
  );
}
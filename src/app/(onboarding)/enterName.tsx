import meadowBg from "@/assets/background/meadow.png";
import { useProfileStore } from "@/store/profileStore";
import { AppText } from "@/ui/AppText";
import { BackgroundScreen } from "@/ui/BackgroundScreen";
import { Button } from "@/ui/Button";
import { TextField } from "@/ui/TextField";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";

export default function EnterNameScreen() {
  const router = useRouter();
  const playerName = useProfileStore((state) => state.playerName);
  const setPlayerName = useProfileStore((state) => state.setPlayerName);

  const canContinue = playerName.trim().length > 0;

  return (
    <BackgroundScreen source={meadowBg}>
      <AppText variant="title" style={[styles.title]}>
        Придумай игровое имя
      </AppText>
      <TextField
        value={playerName}
        onChangeText={setPlayerName}
        placeholder="Никнейм"
        maxLength={20}
      />
      <Button
        label="К следующему шагу!"
        disabled={!canContinue}
        onPress={() => router.push("/pet-color")}
      />
    </BackgroundScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    top: 20,
    marginHorizontal: 16,
    position: "absolute",
    textAlign: "left",
  },
});

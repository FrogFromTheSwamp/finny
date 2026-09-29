import meadowBg from "@/assets/library/scenes/field.png";
import { useProfileStore } from "@/store/profileStore";
import { AppText } from "@/ui/AppText";
import { Button } from "@/ui/Button";
import { TextField } from "@/ui/TextField";
import { useRouter } from "expo-router";
import { ImageBackground, StyleSheet, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function EnterNameScreen() {
  const router = useRouter();
  const playerName = useProfileStore((state) => state.playerName);
  const setPlayerName = useProfileStore((state) => state.setPlayerName);
  const insets = useSafeAreaInsets();

  const canContinue = playerName.trim().length > 0;

  return (
    <View style={styles.screen}>
      <ImageBackground source={meadowBg} resizeMode="cover" style={StyleSheet.absoluteFill} />
      <SafeAreaView edges={["top"]} style={styles.titleArea} pointerEvents="box-none">
        <AppText variant="title" style={styles.title}>Придумай игровое имя</AppText>
      </SafeAreaView>
      <KeyboardStickyView style={styles.form} offset={{ closed: -(insets.bottom + 16), opened: 0 }}>
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
      </KeyboardStickyView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#79ADD0" },
  titleArea: { paddingHorizontal: 16 },
  title: {
    marginTop: 20,
    textAlign: "left",
  },
  form: { position: "absolute", left: 16, right: 16, bottom: 0, gap: 16 },
});

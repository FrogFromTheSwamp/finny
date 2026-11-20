import { useServerSession } from "@/api/childSession";
import { ServerStatus } from "@/api/ServerStatus";
import { useGameStore } from "@/game/store/gameStore";
import { useProfileStore } from "@/store/profileStore";
import { Button } from "@/ui/Button";
import { Screen } from "@/ui/Screen";
import { useRouter } from "expo-router";
import { Alert } from "react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const resetProfile = useProfileStore((state) => state.resetProfile);
  const resetGame = useGameStore((state) => state.resetGame);
  const clearServerSession = useServerSession((state) => state.clear);

  const confirmReset = () => {
    Alert.alert("Сбросить профиль?", "Питомец и весь прогресс будут удалены.", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Сбросить",
        style: "destructive",
        onPress: () => {
          resetGame();
          resetProfile();
          // Новый питомец — новый профиль на сервере
          clearServerSession();
          router.replace("/welcome");
        },
      },
    ]);
  };

  return (
    <Screen title="Настройки">
      <ServerStatus />
      <Button
        label="Пригласить взрослого"
        onPress={() => router.push("/invite-parent")}
      />
      <Button
        label="Раздел для взрослого"
        onPress={() => router.push("/parent")}
      />
      <Button label="Справочник" onPress={() => router.push("/glossary")} />
      <Button label="Сбросить профиль" onPress={confirmReset} />
      <Button label="Назад" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

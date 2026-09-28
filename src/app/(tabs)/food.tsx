import kitchen from "@/assets/library/scenes/kitchen.png";
import plusIcon from "@/assets/library/ui/plus.png";
import type { PetColorId } from "@/content/petColors";
import { FOOD_BY_ID, FOOD_ITEMS, type FoodId } from "@/game/catalog";
import { GameHud } from "@/game/components/GameHud";
import { PetWithHat } from "@/game/components/PetWithHat";
import { TutorialHand } from "@/game/components/TutorialHand";
import { showGameDialog } from "@/game/services/dialogService";
import { useGameStore } from "@/game/store/gameStore";
import { useProfileStore } from "@/store/profileStore";
import { fontFamily } from "@/ui/theme";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

export default function FoodScreen() {
  const inventory = useGameStore((s) => s.inventory);
  const tutorialStage = useGameStore((s) => s.tutorialStage);
  const setTutorialStage = useGameStore((s) => s.setTutorialStage);
  const feed = useGameStore((s) => s.feed);
  const hunger = useGameStore((s) => s.hunger);
  const color = (useProfileStore((s) => s.petColorId) || "brown") as PetColorId;
  const petName = useProfileStore((s) => s.petName || "Финни");
  const available = useMemo(
    () => FOOD_ITEMS.filter((item) => (inventory[item.id] ?? 0) > 0),
    [inventory],
  );
  const [selected, setSelected] = useState<FoodId | null>(
    available[0]?.id ?? null,
  );
  const [eating, setEating] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const lift = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const selectedItem = selected ? FOOD_BY_ID[selected] : null;

  useEffect(() => {
    if (!selected || (inventory[selected] ?? 0) <= 0) {
      setSelected(available[0]?.id ?? null);
    }
  }, [available, inventory, selected]);

  const doFeed = () => {
    if (!selectedItem || eating) return;
    if (hunger >= 100) {
      showGameDialog(`${petName} уже сыт! Можно вернуться к еде чуть позже.`, {
        title: "Сытость 100%",
      });
      return;
    }
    setEating(true);
    setMouthOpen(true);
    lift.setValue({ x: 0, y: 0 });
    scale.setValue(1);
    Animated.parallel([
      Animated.timing(lift, {
        toValue: { x: 0, y: -180 },
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(260),
        Animated.timing(scale, {
          toValue: 0.15,
          duration: 260,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      const ok = feed(selectedItem.id);
      setEating(false);
      setMouthOpen(false);
      lift.setValue({ x: 0, y: 0 });
      scale.setValue(1);
      if (ok) {
        if (tutorialStage === 4 && selectedItem.id === "apple") {
          setTutorialStage(5);
          setTimeout(() => router.replace("/(tabs)/home"), 250);
        }
        const next = available.find(
          (item) =>
            item.id !== selectedItem.id && (inventory[item.id] ?? 0) > 0,
        );
        if ((inventory[selectedItem.id] ?? 0) <= 1)
          setSelected(next?.id ?? null);
      }
    });
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={kitchen}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <GameHud />
      <View style={styles.petArea}>
        <PetWithHat color={color} isEating={mouthOpen} />
      </View>
      {selectedItem ? (
        <Pressable
          style={styles.plateArea}
          onPress={doFeed}
          android_ripple={{ color: "transparent" }}
        >
          <Animated.Image
            source={selectedItem.image}
            style={[
              styles.plateFood,
              {
                transform: [
                  { translateX: lift.x },
                  { translateY: lift.y },
                  { scale },
                ],
              },
            ]}
            resizeMode="contain"
          />
          {tutorialStage === 4 && selectedItem.id === "apple" ? <TutorialHand style={styles.plateHand} rotate="-15deg" /> : null}
        </Pressable>
      ) : (
        <View style={styles.inventoryPanel}>
          <Pressable onPress={() => { if (tutorialStage === 2) setTutorialStage(3); router.push("/food-shop"); }} style={styles.plusWrap}>
            <Image source={plusIcon} style={styles.plusIcon} resizeMode="contain" />
            {tutorialStage === 2 ? <TutorialHand style={styles.plusHand} rotate="-18deg" /> : null}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#B69A7C" },
  petArea: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "54%",
    alignItems: "center",
  },
  plateArea: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "70%",
    alignItems: "center",
    height: 120,
    backgroundColor: "transparent",
  },
  plateFood: {
    width: 68,
    height: 68,
    backgroundColor: "transparent",
  },
  plusWrap: { position: "relative", width: 74, height: 74, alignItems: "center", justifyContent: "center" },
  plusIcon: { width: 64, height: 64 },
  plusHand: { top: -54, right: -35 },
  plateHand: { top: 12, right: "28%" },
  inventoryPanel: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 120,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  inventoryRow: { gap: 8, paddingRight: 8 },
  foodChip: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: "#F9EFE9",
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  foodChipActive: { borderColor: "#4B7A2C", backgroundColor: "#EEF3E9" },
  foodIcon: { width: 44, height: 44 },
  countBadge: {
    position: "absolute",
    right: -3,
    bottom: -3,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#C8BEB4",
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { fontFamily: fontFamily.bold, color: "#2A1105", fontSize: 11 },
});

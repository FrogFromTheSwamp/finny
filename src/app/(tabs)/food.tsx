import kitchen from "@/assets/game/rooms/kitchen.png";
import type { PetColorId } from "@/content/petColors";
import { FOOD_BY_ID, FOOD_ITEMS, type FoodId } from "@/game/catalog";
import { GameHud } from "@/game/components/GameHud";
import { PetSprite } from "@/game/components/PetSprite";
import { showGameDialog } from "@/game/services/dialogService";
import { useGameStore } from "@/game/store/gameStore";
import { useProfileStore } from "@/store/profileStore";
import { fontFamily } from "@/ui/theme";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Plus from '@/assets/symbols/plus.svg'
import { router } from "expo-router";

export default function FoodScreen() {
  const inventory = useGameStore((s) => s.inventory);
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
  const lift = useRef(new Animated.Value(0)).current;
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
    lift.setValue(0);
    scale.setValue(1);
    Animated.parallel([
      Animated.timing(lift, {
        toValue: -145,
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
      lift.setValue(0);
      scale.setValue(1);
      if (ok) {
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
        <PetSprite color={color} isEating={eating} />
      </View>
      {selectedItem ? (
        <Pressable style={styles.plateArea} onPress={doFeed}>
          <Animated.Image
            source={selectedItem.image}
            style={[
              styles.plateFood,
              { transform: [{ translateY: lift }, { scale }] },
            ]}
            resizeMode="contain"
          />
          <Text style={styles.tapLabel}>
            {eating ? "Ням!" : "Нажми, чтобы покормить"}
          </Text>
        </Pressable>
      ) : null}
      <View style={styles.inventoryPanel}>
        {available.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.inventoryRow}
          >
            {available.map((item) => {
              const count = inventory[item.id] ?? 0;
              const active = selected === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelected(item.id)}
                  style={[styles.foodChip, active && styles.foodChipActive]}
                >
                  <Image
                    source={item.image}
                    style={styles.foodIcon}
                    resizeMode="contain"
                  />
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{count}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <Pressable onPress={() => {router.push('/(tabs)/shop')}}>
            <Plus />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#B69A7C" },
  petArea: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "53%",
    alignItems: "center",
  },
  plateArea: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "70%",
    alignItems: "center",
    height: 120,
  },
  plateFood: { width: 68, height: 68 },
  tapLabel: {
    marginTop: 2,
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: "#3B1606",
    backgroundColor: "rgba(255,255,255,0.88)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  inventoryPanel: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 80,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  panelTitle: {
    fontFamily: fontFamily.bold,
    color: "#2A1105",
    fontSize: 13,
    marginBottom: 6,
  },
  inventoryRow: { gap: 8, paddingRight: 8 },
  foodChip: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: "#F4EFE9",
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
  empty: {
    fontFamily: fontFamily.medium,
    color: "#66554A",
    fontSize: 13,
    paddingVertical: 10,
  },
});

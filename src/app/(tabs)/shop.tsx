import { useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import wardrobeRoom from "@/assets/game/rooms/wardrobe.png";
import categoryHatIcon from "@/assets/game/ui/category-hat-icon.png";
import type { PetColorId } from "@/content/petColors";
import { GameHud } from "@/game/components/GameHud";
import { PetWithHat } from "@/game/components/PetWithHat";
import { showGameDialog } from "@/game/services/dialogService";
import { useGameStore } from "@/game/store/gameStore";
import { HATS } from "@/game/wardrobe";
import { useProfileStore } from "@/store/profileStore";
import { fontFamily } from "@/ui/theme";

export default function WardrobeShopScreen() {
  const color = (useProfileStore((s) => s.petColorId) || "brown") as PetColorId;
  const coins = useGameStore((s) => s.coins);
  const equippedHat = useGameStore((s) => s.equippedHat);
  const ownedHats = useGameStore((s) => s.ownedHats);
  const equipHat = useGameStore((s) => s.equipHat);
  const purchaseHat = useGameStore((s) => s.purchaseHat);

  const [index, setIndex] = useState(() => {
    const found = HATS.findIndex((h) => h.id === equippedHat);
    return found === -1 ? 0 : found;
  });

  const hat = HATS[index]!;
  const owned = hat.id === "none" || ownedHats.includes(hat.id);

  const move = (delta: number) => {
    const next = (index + delta + HATS.length) % HATS.length;
    setIndex(next);
    const nextHat = HATS[next]!;
    if (nextHat.id === "none" || ownedHats.includes(nextHat.id)) {
      equipHat(nextHat.id);
    }
  };

  const handleBuy = () => {
    if (owned) return;
    if (!purchaseHat(hat.id)) {
      showGameDialog(
        `${hat.name} стоит ${hat.price} монет, а у тебя ${coins}.`,
        {
          title: "Не хватает монет",
        },
      );
    }
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={wardrobeRoom}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <GameHud showHunger={false} />

      <View style={styles.petArea}>
        <PetWithHat color={color} hatId={hat.id} />
      </View>

      <View style={styles.categoryIcon}>
        <Image
          source={categoryHatIcon}
          style={styles.categoryIconImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.categoryBox}>
        <Pressable
          onPress={() => move(-1)}
          style={styles.arrow}
          accessibilityRole="button"
          accessibilityLabel="Предыдущий предмет"
        >
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>

        <Pressable
          onPress={handleBuy}
          disabled={owned}
          style={styles.itemSlot}
          accessibilityRole="button"
          accessibilityLabel={
            hat.id === "none"
              ? "Без шляпки"
              : owned
                ? `${hat.name}, уже куплено`
                : `Купить ${hat.name} за ${hat.price} монет`
          }
        >
          <Image
            source={hat.previewImage}
            style={styles.itemImage}
            resizeMode="contain"
          />
          {!owned && hat.price > 0 ? (
            <View style={styles.price}>
              <Text style={styles.priceText}>{hat.price}</Text>
              <Text style={styles.priceCoin}>●</Text>
            </View>
          ) : null}
        </Pressable>

        <Pressable
          onPress={() => move(1)}
          style={styles.arrow}
          accessibilityRole="button"
          accessibilityLabel="Следующий предмет"
        >
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  petArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "22%",
    alignItems: "center",
  },

  categoryIcon: {
    position: "absolute",
    top: "38%",
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIconImage: { width: "100%", height: "100%" },

  categoryBox: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 110,
    height: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arrow: {
    width: 46,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    fontFamily: fontFamily.bold,
    fontSize: 50,
    color: "#4B7A2C",
    lineHeight: 52,
  },
  itemSlot: {
    width: 120,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  itemImage: { width: 72, height: 72 },
  price: {
    marginTop: 6,
    minWidth: 52,
    height: 25,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#BBAE9E",
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  priceText: {
    fontFamily: fontFamily.semiBold,
    color: "#2A1105",
    fontSize: 12,
  },
  priceCoin: { color: "#F2A900", fontSize: 13 },
});

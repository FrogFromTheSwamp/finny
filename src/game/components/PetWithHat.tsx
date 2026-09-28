import type { StyleProp, ViewStyle } from "react-native";
import { Image, StyleSheet, View } from "react-native";

import type { PetColorId } from "@/content/petColors";
import { PetSprite } from "@/game/components/PetSprite";
import { useGameStore } from "@/game/store/gameStore";
import { HAT_BY_ID, type HatId } from "@/game/wardrobe";

type Props = {
  color: PetColorId;
  isEating?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  hatId?: HatId;
};

// Питомец + надетая шляпа (если есть). Читает equippedHat из gameStore
// сам, поэтому его достаточно один раз подставить вместо голого
// PetSprite на любом экране — шляпа будет видна везде одинаково,
// без ручной синхронизации между экранами.
export function PetWithHat({ color, isEating, onPress, style, hatId }: Props) {
  const equippedHat = useGameStore((s) => s.equippedHat);
  const hat = HAT_BY_ID[hatId ?? equippedHat] ?? HAT_BY_ID.none;

  return (
    <View style={[styles.wrap, style]}>
      <PetSprite
        color={color}
        isEating={isEating}
        onPress={onPress}
        style={styles.pet}
      />
      {hat.wornImage && hat.attachment ? (
        <View style={[styles.hatLayer, styles.nonInteractive]}>
          <Image
            source={hat.wornImage}
            resizeMode="contain"
            style={[
              styles.hat,
              hat.attachment.align === "right"
                ? styles.hatRight
                : styles.hatCenter,
              { transform: [{ rotate: `${hat.attachment.rotation}deg` }] },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative", width: "80%", height: 170 },
  pet: { width: "100%" },
  hatLayer: { ...StyleSheet.absoluteFill },
  nonInteractive: { pointerEvents: "none" },
  hat: { position: "absolute", width: 90, height: 90 },
  hatCenter: { top: -34, alignSelf: "center" },
  hatRight: { top: -20, right: 28 },
});

import type { StyleProp, ViewStyle } from 'react-native';
import { Image, StyleSheet, View } from 'react-native';
import type { PetColorId } from '@/content/petColors';
import { PetSprite, type PetEmotion } from '@/game/components/PetSprite';
import { useGameStore } from '@/game/store/gameStore';
import { HAT_BY_ID, type HatId } from '@/game/wardrobe';

type Props = {
  color: PetColorId;
  emotion?: PetEmotion;
  isEating?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  hatId?: HatId;
  forceGrown?: boolean;
  forceChild?: boolean;
};

export function PetWithHat({ color, emotion, isEating, onPress, style, hatId, forceGrown, forceChild }: Props) {
  const equippedHat = useGameStore((s) => s.equippedHat);
  const chapterCompleted = useGameStore((s) => s.completedChapters.includes('budget'));
  const grown = forceChild ? false : (forceGrown ?? chapterCompleted);
  const hat = HAT_BY_ID[hatId ?? equippedHat] ?? HAT_BY_ID.none;

  return (
    <View style={[styles.wrap, grown && styles.grownWrap, style]}>
      <PetSprite color={color} grown={grown} emotion={emotion} isEating={isEating} onPress={onPress} style={styles.pet} />
      {hat.wornImage && hat.attachment ? (
        <View pointerEvents="none" style={styles.hatLayer}>
          <Image
            source={hat.wornImage}
            resizeMode="contain"
            style={[
              styles.hat,
              grown && styles.grownHat,
              hat.attachment.align === 'right'
                ? (grown ? styles.grownHatRight : styles.hatRight)
                : (grown ? styles.grownHatCenter : styles.hatCenter),
              { transform: [{ rotate: `${hat.attachment.rotation}deg` }] },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', width: '80%', height: 170 },
  grownWrap: { height: 205 },
  pet: { width: '100%' },
  hatLayer: { ...StyleSheet.absoluteFill },
  hat: { position: 'absolute', width: 90, height: 90 },
  grownHat: { width: 104, height: 104 },
  hatCenter: { top: -34, alignSelf: 'center' },
  hatRight: { top: -20, right: 28 },
  grownHatCenter: { top: -23, alignSelf: 'center' },
  grownHatRight: { top: -9, right: 23 },
});

import type { PetColorId } from '@/content/petColors';
import { PetSprite, type PetEmotion } from '@/game/components/PetSprite';
import { useGameStore } from '@/game/store/gameStore';
import { HAT_BY_ID, type HatAttachment, type HatId } from '@/game/wardrobe';
import { useEffect, useRef } from 'react';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { Animated, StyleSheet, View } from 'react-native';

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
          <WornHat key={hat.id} source={hat.wornImage} attachment={hat.attachment} grown={grown} />
        </View>
      ) : null}
    </View>
  );
}

function WornHat({ source, attachment, grown }: { source: ImageSourcePropType; attachment: HatAttachment; grown: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return <Animated.Image source={source} resizeMode="contain" style={[
    styles.hat,
    grown && styles.grownHat,
    attachment.align === 'right' ? (grown ? styles.grownHatRight : styles.hatRight) : (grown ? styles.grownHatCenter : styles.hatCenter),
    attachment.offsetY ? { marginTop: attachment.offsetY } : null,
    { opacity, transform: [{ rotate: `${attachment.rotation}deg` }] },
  ]} />;
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', width: '80%', height: 170 },
  grownWrap: { height: 205 },
  pet: { width: '100%' },
  hatLayer: { ...StyleSheet.absoluteFill },
  hat: { position: 'absolute', width: 90, height: 90 },
  grownHat: { width: 104, height: 104 },
  hatCenter: { top: -34, alignSelf: 'center' },
  // Keep the brim centered on the head; the source PNGs already have a level brim.
  hatRight: { top: -42, left: '50%', marginLeft: -45 },
  grownHatCenter: { top: -23, alignSelf: 'center' },
  grownHatRight: { top: -58, left: '50%', marginLeft: -52 },
});

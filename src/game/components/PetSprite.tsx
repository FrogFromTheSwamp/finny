import { Image, Pressable, StyleSheet, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import petGreen from '@/assets/pet/pet-green.png';
import petBrown from '@/assets/pet/pet-brown.png';
import petOrange from '@/assets/pet/pet-orange.png';
import petMagenta from '@/assets/pet/pet-magenta.png';
import petPurple from '@/assets/pet/pet-purple.png';
import eatBrown from '@/assets/game/characters/pet-brown-eating.png';
import eatGreen from '@/assets/game/characters/pet-green-eating.png';
import eatOrange from '@/assets/game/characters/pet-orange-eating.png';
import eatMagenta from '@/assets/game/characters/pet-magenta-eating.png';
import eatPurple from '@/assets/game/characters/pet-purple-eating.png';
import type { PetColorId } from '@/content/petColors';

const normal: Record<PetColorId, ImageSourcePropType> = {
  brown: petBrown, green: petGreen, orange: petOrange, magenta: petMagenta, purple: petPurple,
};
const eating: Record<PetColorId, ImageSourcePropType> = {
  brown: eatBrown, green: eatGreen, orange: eatOrange, magenta: eatMagenta, purple: eatPurple,
};

type Props = { color: PetColorId; isEating?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle> };

export function PetSprite({ color, isEating = false, onPress, style }: Props) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.wrap, style]}>
      <Image source={(isEating ? eating : normal)[color]} style={styles.image} resizeMode="contain" />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  wrap: { width: 205, height: 170, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
});

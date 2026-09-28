import type { PetColorId } from '@/content/petColors';
import { Image, Pressable, StyleSheet, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';

import childBrownNeutral from '@/assets/library/characters/child/brown/neutral.png';
import childBrownHappy from '@/assets/library/characters/child/brown/happy.png';
import childBrownEat from '@/assets/library/characters/child/brown/eat.png';
import childBrownBlink from '@/assets/library/characters/child/brown/blink.png';
import childBrownBlow from '@/assets/library/characters/child/brown/blow.png';
import childGreenNeutral from '@/assets/library/characters/child/green/neutral.png';
import childGreenHappy from '@/assets/library/characters/child/green/happy.png';
import childGreenEat from '@/assets/library/characters/child/green/eat.png';
import childGreenBlink from '@/assets/library/characters/child/green/blink.png';
import childGreenBlow from '@/assets/library/characters/child/green/blow.png';
import childOrangeNeutral from '@/assets/library/characters/child/orange/neutral.png';
import childOrangeHappy from '@/assets/library/characters/child/orange/happy.png';
import childOrangeEat from '@/assets/library/characters/child/orange/eat.png';
import childOrangeBlink from '@/assets/library/characters/child/orange/blink.png';
import childOrangeBlow from '@/assets/library/characters/child/orange/blow.png';
import childMagentaNeutral from '@/assets/library/characters/child/magenta/neutral.png';
import childMagentaHappy from '@/assets/library/characters/child/magenta/happy.png';
import childMagentaEat from '@/assets/library/characters/child/magenta/eat.png';
import childMagentaBlink from '@/assets/library/characters/child/magenta/blink.png';
import childMagentaBlow from '@/assets/library/characters/child/magenta/blow.png';
import childPurpleNeutral from '@/assets/library/characters/child/purple/neutral.png';
import childPurpleHappy from '@/assets/library/characters/child/purple/happy.png';
import childPurpleEat from '@/assets/library/characters/child/purple/eat.png';
import childPurpleBlink from '@/assets/library/characters/child/purple/blink.png';
import childPurpleBlow from '@/assets/library/characters/child/purple/blow.png';

import adultBrownNeutral from '@/assets/library/characters/adult/brown/neutral.png';
import adultBrownEat from '@/assets/library/characters/adult/brown/eat.png';
import adultBrownSad from '@/assets/library/characters/adult/brown/sad.png';
import adultBrownThink from '@/assets/library/characters/adult/brown/think.png';
import adultBrownBlow from '@/assets/library/characters/adult/brown/blow.png';
import adultGreenNeutral from '@/assets/library/characters/adult/green/neutral.png';
import adultGreenEat from '@/assets/library/characters/adult/green/eat.png';
import adultGreenSad from '@/assets/library/characters/adult/green/sad.png';
import adultGreenThink from '@/assets/library/characters/adult/green/think.png';
import adultGreenBlow from '@/assets/library/characters/adult/green/blow.png';
import adultOrangeNeutral from '@/assets/library/characters/adult/orange/neutral.png';
import adultOrangeEat from '@/assets/library/characters/adult/orange/eat.png';
import adultOrangeSad from '@/assets/library/characters/adult/orange/sad.png';
import adultOrangeThink from '@/assets/library/characters/adult/orange/think.png';
import adultOrangeBlow from '@/assets/library/characters/adult/orange/blow.png';
import adultMagentaNeutral from '@/assets/library/characters/adult/magenta/neutral.png';
import adultMagentaEat from '@/assets/library/characters/adult/magenta/eat.png';
import adultMagentaSad from '@/assets/library/characters/adult/magenta/sad.png';
import adultMagentaThink from '@/assets/library/characters/adult/magenta/think.png';
import adultMagentaBlow from '@/assets/library/characters/adult/magenta/blow.png';
import adultPurpleNeutral from '@/assets/library/characters/adult/purple/neutral.png';
import adultPurpleEat from '@/assets/library/characters/adult/purple/eat.png';
import adultPurpleSad from '@/assets/library/characters/adult/purple/sad.png';
import adultPurpleThink from '@/assets/library/characters/adult/purple/think.png';
import adultPurpleBlow from '@/assets/library/characters/adult/purple/blow.png';

export type PetEmotion = 'neutral' | 'happy' | 'eat' | 'blink' | 'blow' | 'sad' | 'think';

type StageSet = Partial<Record<PetEmotion, ImageSourcePropType>> & { neutral: ImageSourcePropType };

const child: Record<PetColorId, StageSet> = {
  brown: { neutral: childBrownNeutral, happy: childBrownHappy, eat: childBrownEat, blink: childBrownBlink, blow: childBrownBlow },
  green: { neutral: childGreenNeutral, happy: childGreenHappy, eat: childGreenEat, blink: childGreenBlink, blow: childGreenBlow },
  orange: { neutral: childOrangeNeutral, happy: childOrangeHappy, eat: childOrangeEat, blink: childOrangeBlink, blow: childOrangeBlow },
  magenta: { neutral: childMagentaNeutral, happy: childMagentaHappy, eat: childMagentaEat, blink: childMagentaBlink, blow: childMagentaBlow },
  purple: { neutral: childPurpleNeutral, happy: childPurpleHappy, eat: childPurpleEat, blink: childPurpleBlink, blow: childPurpleBlow },
};

const adult: Record<PetColorId, StageSet> = {
  brown: { neutral: adultBrownNeutral, eat: adultBrownEat, sad: adultBrownSad, think: adultBrownThink, blow: adultBrownBlow },
  green: { neutral: adultGreenNeutral, eat: adultGreenEat, sad: adultGreenSad, think: adultGreenThink, blow: adultGreenBlow },
  orange: { neutral: adultOrangeNeutral, eat: adultOrangeEat, sad: adultOrangeSad, think: adultOrangeThink, blow: adultOrangeBlow },
  magenta: { neutral: adultMagentaNeutral, eat: adultMagentaEat, sad: adultMagentaSad, think: adultMagentaThink, blow: adultMagentaBlow },
  purple: { neutral: adultPurpleNeutral, eat: adultPurpleEat, sad: adultPurpleSad, think: adultPurpleThink, blow: adultPurpleBlow },
};

type Props = {
  color: PetColorId;
  emotion?: PetEmotion;
  isEating?: boolean;
  grown?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function PetSprite({ color, emotion = 'neutral', isEating = false, grown = false, onPress, style }: Props) {
  const requested: PetEmotion = isEating ? 'eat' : emotion;
  const set = grown ? adult[color] : child[color];
  const source = set[requested] ?? set.neutral;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.wrap, grown && styles.grownWrap, style]}>
      <Image source={source} style={[styles.image, grown && styles.grownImage]} resizeMode="contain" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '80%', height: 170, alignItems: 'center', justifyContent: 'center' },
  grownWrap: { height: 205 },
  image: { width: '76%', height: '76%' },
  grownImage: { width: '88%', height: '88%' },
});

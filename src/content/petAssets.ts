import type { ImageSourcePropType } from 'react-native';

import brown1 from '@/assets/library/characters/eggs/brown/stage-1.png';
import brown2 from '@/assets/library/characters/eggs/brown/stage-2.png';
import brown3 from '@/assets/library/characters/eggs/brown/stage-3.png';
import brown4 from '@/assets/library/characters/eggs/brown/stage-4.png';
import brown5 from '@/assets/library/characters/eggs/brown/stage-5.png';
import brownBurst from '@/assets/library/characters/eggs/brown/burst.png';
import brownPet from '@/assets/library/characters/child/brown/neutral.png';

import green1 from '@/assets/library/characters/eggs/green/stage-1.png';
import green2 from '@/assets/library/characters/eggs/green/stage-2.png';
import green3 from '@/assets/library/characters/eggs/green/stage-3.png';
import green4 from '@/assets/library/characters/eggs/green/stage-4.png';
import green5 from '@/assets/library/characters/eggs/green/stage-5.png';
import greenBurst from '@/assets/library/characters/eggs/green/burst.png';
import greenPet from '@/assets/library/characters/child/green/neutral.png';

import magenta1 from '@/assets/library/characters/eggs/magenta/stage-1.png';
import magenta2 from '@/assets/library/characters/eggs/magenta/stage-2.png';
import magenta3 from '@/assets/library/characters/eggs/magenta/stage-3.png';
import magenta4 from '@/assets/library/characters/eggs/magenta/stage-4.png';
import magenta5 from '@/assets/library/characters/eggs/magenta/stage-5.png';
import magentaBurst from '@/assets/library/characters/eggs/magenta/burst.png';
import magentaPet from '@/assets/library/characters/child/magenta/neutral.png';

import orange1 from '@/assets/library/characters/eggs/orange/stage-1.png';
import orange2 from '@/assets/library/characters/eggs/orange/stage-2.png';
import orange3 from '@/assets/library/characters/eggs/orange/stage-3.png';
import orange4 from '@/assets/library/characters/eggs/orange/stage-4.png';
import orange5 from '@/assets/library/characters/eggs/orange/stage-5.png';
import orangeBurst from '@/assets/library/characters/eggs/orange/burst.png';
import orangePet from '@/assets/library/characters/child/orange/neutral.png';

import purple1 from '@/assets/library/characters/eggs/purple/stage-1.png';
import purple2 from '@/assets/library/characters/eggs/purple/stage-2.png';
import purple3 from '@/assets/library/characters/eggs/purple/stage-3.png';
import purple4 from '@/assets/library/characters/eggs/purple/stage-4.png';
import purple5 from '@/assets/library/characters/eggs/purple/stage-5.png';
import purpleBurst from '@/assets/library/characters/eggs/purple/burst.png';
import purplePet from '@/assets/library/characters/child/purple/neutral.png';

import type { PetColorId } from '@/content/petColors';

type PetAssetSet = {
  eggStages: readonly ImageSourcePropType[];
  burst: ImageSourcePropType;
  pet: ImageSourcePropType;
};

export const PET_ASSETS: Record<PetColorId, PetAssetSet> = {
  brown: { eggStages: [brown1, brown2, brown3, brown4, brown5], burst: brownBurst, pet: brownPet },
  green: { eggStages: [green1, green2, green3, green4, green5], burst: greenBurst, pet: greenPet },
  orange: { eggStages: [orange1, orange2, orange3, orange4, orange5], burst: orangeBurst, pet: orangePet },
  magenta: { eggStages: [magenta1, magenta2, magenta3, magenta4, magenta5], burst: magentaBurst, pet: magentaPet },
  purple: { eggStages: [purple1, purple2, purple3, purple4, purple5], burst: purpleBurst, pet: purplePet },
};

import type { ImageSourcePropType } from 'react-native';

import eggBrownBurst from '@/assets/pet/egg-brown-burst.png';
import eggBrownStage0 from '@/assets/pet/egg-brown-stage-0.png';
import eggBrownStage1 from '@/assets/pet/egg-brown-stage-1.png';
import eggBrownStage2 from '@/assets/pet/egg-brown-stage-2.png';
import eggBrownStage3 from '@/assets/pet/egg-brown-stage-3.png';
import eggBrownStage4 from '@/assets/pet/egg-brown-stage-4.png';

import eggGreenBurst from '@/assets/pet/egg-green-burst.png';
import eggGreenStage0 from '@/assets/pet/egg-green-stage-0.png';
import eggGreenStage1 from '@/assets/pet/egg-green-stage-1.png';
import eggGreenStage2 from '@/assets/pet/egg-green-stage-2.png';
import eggGreenStage3 from '@/assets/pet/egg-green-stage-3.png';
import eggGreenStage4 from '@/assets/pet/egg-green-stage-4.png';

import eggMagentaBurst from '@/assets/pet/egg-magenta-burst.png';
import eggMagentaStage0 from '@/assets/pet/egg-magenta-stage-0.png';
import eggMagentaStage1 from '@/assets/pet/egg-magenta-stage-1.png';
import eggMagentaStage2 from '@/assets/pet/egg-magenta-stage-2.png';
import eggMagentaStage3 from '@/assets/pet/egg-magenta-stage-3.png';
import eggMagentaStage4 from '@/assets/pet/egg-magenta-stage-4.png';

import eggOrangeBurst from '@/assets/pet/egg-orange-burst.png';
import eggOrangeStage0 from '@/assets/pet/egg-orange-stage-0.png';
import eggOrangeStage1 from '@/assets/pet/egg-orange-stage-1.png';
import eggOrangeStage2 from '@/assets/pet/egg-orange-stage-2.png';
import eggOrangeStage3 from '@/assets/pet/egg-orange-stage-3.png';
import eggOrangeStage4 from '@/assets/pet/egg-orange-stage-4.png';

import eggPurpleBurst from '@/assets/pet/egg-purple-burst.png';
import eggPurpleStage0 from '@/assets/pet/egg-purple-stage-0.png';
import eggPurpleStage1 from '@/assets/pet/egg-purple-stage-1.png';
import eggPurpleStage2 from '@/assets/pet/egg-purple-stage-2.png';
import eggPurpleStage3 from '@/assets/pet/egg-purple-stage-3.png';
import eggPurpleStage4 from '@/assets/pet/egg-purple-stage-4.png';

import petBrown from '@/assets/pet/pet-brown.png';
import petGreen from '@/assets/pet/pet-green.png';
import petMagenta from '@/assets/pet/pet-magenta.png';
import petOrange from '@/assets/pet/pet-orange.png';
import petPurple from '@/assets/pet/pet-purple.png';

import type { PetColorId } from '@/content/petColors';

type PetAssetSet = {
    eggStages: readonly ImageSourcePropType[];
    burst: ImageSourcePropType;
    pet: ImageSourcePropType;
};

export const PET_ASSETS: Record<PetColorId, PetAssetSet> = {
    green: {
        eggStages: [
            eggGreenStage0,
            eggGreenStage1,
            eggGreenStage2,
            eggGreenStage3,
            eggGreenStage4,
        ],
        burst: eggGreenBurst,
        pet: petGreen,
    },

    brown: {
        eggStages: [
            eggBrownStage0,
            eggBrownStage1,
            eggBrownStage2,
            eggBrownStage3,
            eggBrownStage4,
        ],
        burst: eggBrownBurst,
        pet: petBrown,
    },

    orange: {
        eggStages: [
            eggOrangeStage0,
            eggOrangeStage1,
            eggOrangeStage2,
            eggOrangeStage3,
            eggOrangeStage4,
        ],
        burst: eggOrangeBurst,
        pet: petOrange,
    },

    magenta: {
        eggStages: [
            eggMagentaStage0,
            eggMagentaStage1,
            eggMagentaStage2,
            eggMagentaStage3,
            eggMagentaStage4,
        ],
        burst: eggMagentaBurst,
        pet: petMagenta,
    },

    purple: {
        eggStages: [
            eggPurpleStage0,
            eggPurpleStage1,
            eggPurpleStage2,
            eggPurpleStage3,
            eggPurpleStage4,
        ],
        burst: eggPurpleBurst,
        pet: petPurple,
    },
};
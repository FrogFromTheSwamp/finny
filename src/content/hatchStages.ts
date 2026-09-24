import type { ImageSourcePropType } from 'react-native';
import eggStage0 from '@/assets/pet/egg-stage-0.png';
import eggStage1 from '@/assets/pet/egg-stage-1.png';
import eggStage2 from '@/assets/pet/egg-stage-2.png';
import eggStage3 from '@/assets/pet/egg-stage-3.png';
import eggStage4 from '@/assets/pet/egg-stage-4.png';

export type HatchStage = {
  image: ImageSourcePropType;
  caption: string;
};

export const HATCH_STAGES: HatchStage[] = [
  { image: eggStage0, caption: 'Кликай, чтобы помочь ему вылупиться!' },
  { image: eggStage1, caption: 'О, появилась первая трещинка!' },
  { image: eggStage2, caption: 'Кто же там прячется?' },
  { image: eggStage3, caption: 'Шевелится!' },
  { image: eggStage4, caption: 'Последний рывок!' },
];
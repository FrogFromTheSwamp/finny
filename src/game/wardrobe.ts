import type { ImageSourcePropType } from 'react-native';

import hatCap from '@/assets/library/wardrobe/items/green-cap.png';
import hatGold from '@/assets/library/wardrobe/items/gold-hat.png';
import hatDotted from '@/assets/library/wardrobe/items/blue-dotted-hat.png';
import hatPurple from '@/assets/library/wardrobe/items/violet-hat.png';

export type HatId = 'none' | 'dotted' | 'purple' | 'cap' | 'crown';

export type HatAttachment = {
  align: 'center' | 'right';
  rotation: number;
  offsetY?: number;
};

export type HatItem = {
  id: HatId;
  name: string;
  price: number;
  previewImage: ImageSourcePropType | null;
  wornImage: ImageSourcePropType | null;
  attachment: HatAttachment | null;
};

/**
 * Runtime hat catalogue. IDs are intentionally stable because they are stored
 * in AsyncStorage. Visuals come from the normalized Figma component library.
 */
export const HATS: HatItem[] = [
  {
    id: 'none',
    name: 'Без головного убора',
    price: 0,
    previewImage: null,
    wornImage: null,
    attachment: null,
  },
  {
    id: 'dotted',
    name: 'Колпак в точечку',
    price: 16,
    previewImage: hatDotted,
    wornImage: hatDotted,
    attachment: { align: 'right', rotation: 0 },
  },
  {
    id: 'purple',
    name: 'Фиолетовая шляпка',
    price: 40,
    previewImage: hatPurple,
    wornImage: hatPurple,
    attachment: { align: 'right', rotation: 0, offsetY: 7 },
  },
  {
    id: 'cap',
    name: 'Зелёная кепка',
    price: 32,
    previewImage: hatCap,
    wornImage: hatCap,
    attachment: { align: 'center', rotation: 0 },
  },
  {
    id: 'crown',
    name: 'Золотая шляпка',
    price: 45,
    previewImage: hatGold,
    wornImage: hatGold,
    attachment: { align: 'center', rotation: 0 },
  },
];

export const HAT_BY_ID = Object.fromEntries(HATS.map((h) => [h.id, h])) as Record<HatId, HatItem>;

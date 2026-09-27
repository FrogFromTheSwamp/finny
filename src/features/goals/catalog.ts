import type { ImageSourcePropType } from 'react-native';

import bicycle from '@/assets/items/bicycle.png';
import car from '@/assets/items/car.png';
import devices from '@/assets/items/devices.png';
import iceCream from '@/assets/items/ice-cream.png';
import partyHat from '@/assets/items/party-hat.png';
import teddy from '@/assets/items/teddy.png';

export type GoalTemplateId = 'party-hat' | 'bicycle' | 'devices' | 'teddy' | 'car' | 'ice-cream';

export type GoalTemplate = {
  id: GoalTemplateId;
  name: string;
  target: number;
  image: ImageSourcePropType;
};

export const GOAL_TEMPLATES: GoalTemplate[] = [
  { id: 'party-hat', name: 'Колпак к тортику', target: 15, image: partyHat },
  { id: 'bicycle', name: 'Велосипед', target: 120, image: bicycle },
  { id: 'devices', name: 'Новый гаджет', target: 150, image: devices },
  { id: 'teddy', name: 'Плюшевый мишка', target: 45, image: teddy },
  { id: 'car', name: 'Игрушечная машинка', target: 70, image: car },
  { id: 'ice-cream', name: 'Большое мороженое', target: 30, image: iceCream },
];

export const GOAL_TEMPLATE_BY_ID = Object.fromEntries(GOAL_TEMPLATES.map((item) => [item.id, item])) as Record<GoalTemplateId, GoalTemplate>;

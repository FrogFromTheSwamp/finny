import type { ImageSourcePropType } from 'react-native';

import bicycle from '@/assets/library/learning/items/bicycle.png';
import car from '@/assets/library/learning/items/car.png';
import laptop from '@/assets/library/learning/items/laptop.png';
import iceCream from '@/assets/library/learning/items/ice-cream.png';
import partyHat from '@/assets/library/wardrobe/items/blue-dotted-hat.png';
import teddy from '@/assets/library/learning/items/teddy.png';

export type GoalTemplateId = 'party-hat' | 'bicycle' | 'devices' | 'teddy' | 'car' | 'ice-cream';

export type GoalTemplate = {
  id: GoalTemplateId;
  name: string;
  target: number;
  image: ImageSourcePropType;
};

export const GOAL_TEMPLATES: GoalTemplate[] = [
  { id: 'party-hat', name: 'Колпак в точечку', target: 15, image: partyHat },
  { id: 'bicycle', name: 'Велосипед', target: 120, image: bicycle },
  { id: 'devices', name: 'Ноутбук', target: 150, image: laptop },
  { id: 'teddy', name: 'Плюшевый мишка', target: 45, image: teddy },
  { id: 'car', name: 'Игрушечная машинка', target: 70, image: car },
  { id: 'ice-cream', name: 'Большое мороженое', target: 30, image: iceCream },
];

export const GOAL_TEMPLATE_BY_ID = Object.fromEntries(GOAL_TEMPLATES.map((item) => [item.id, item])) as Record<GoalTemplateId, GoalTemplate>;

export function isGoalTemplateAvailable(
  templateId: GoalTemplateId,
  goals: readonly { templateId: GoalTemplateId }[],
  ownedHats: readonly string[],
) {
  if (goals.some((goal) => goal.templateId === templateId)) return false;
  if (templateId === 'party-hat' && ownedHats.includes('dotted')) return false;
  return true;
}

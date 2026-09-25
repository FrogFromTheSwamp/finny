import { FOOD_ITEMS, type FoodId } from '@/game/catalog';
import type { PetColorId } from '@/content/petColors';

export const TEST_DATA_ENABLED = process.env.EXPO_PUBLIC_FINNY_TEST_DATA === '1';
export const TEST_DATA_SEED = process.env.EXPO_PUBLIC_FINNY_TEST_SEED ?? 'finny-demo';
export const TEST_DATA_SESSION = process.env.EXPO_PUBLIC_FINNY_TEST_SESSION ?? 'default';

function hashSeed(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(hashSeed(TEST_DATA_SEED));
const pick = <T,>(items: readonly T[]) => items[Math.floor(random() * items.length)]!;
const int = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min;

const playerNames = ['Валя', 'Саша', 'Лера', 'Миша', 'Аня', 'Даня'];
const petNames = ['Финни', 'Плюш', 'Бублик', 'Тоша', 'Пиксель', 'Фунтик'];
const petColors: PetColorId[] = ['brown', 'green', 'orange', 'magenta', 'purple'];

export const TEST_PROFILE = {
  playerName: pick(playerNames),
  petName: pick(petNames),
  petColorId: pick(petColors),
  onboardingDone: true,
};

export function makeTestGameData() {
  const shuffled = [...FOOD_ITEMS].sort(() => random() - 0.5);
  const inventory: Partial<Record<FoodId, number>> = {};
  for (const item of shuffled.slice(0, int(4, 8))) inventory[item.id] = int(1, 3);
  const shopSelection = shuffled.slice(8, 8 + int(1, 4)).map((item) => item.id);
  return {
    coins: int(70, 320),
    level: int(1, 8),
    streakDays: int(1, 14),
    hunger: int(22, 88),
    inventory,
    shopSelection,
  };
}

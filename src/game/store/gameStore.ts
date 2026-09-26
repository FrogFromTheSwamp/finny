import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { FOOD_BY_ID, type FoodId } from '@/game/catalog';
import { makeTestGameData, TEST_DATA_ENABLED, TEST_DATA_SEED, TEST_DATA_SESSION } from '@/game/testData';

type Inventory = Partial<Record<FoodId, number>>;

type GameState = {
  coins: number;
  level: number;
  streakDays: number;
  hunger: number;
  inventory: Inventory;
  shopSelection: FoodId[];
  lastRewardDate: string;
  taskRewardsClaimed: string[];
  dailyActivity: { date: string; fed: number; purchased: number };
  addCoins: (amount: number) => void;
  setHunger: (value: number) => void;
  feed: (foodId: FoodId) => boolean;
  toggleShopSelection: (foodId: FoodId) => void;
  clearShopSelection: () => void;
  purchaseSelection: () => { ok: boolean; total: number };
  canClaimDailyReward: () => boolean;
  claimDailyReward: () => number;
  claimTaskReward: (id: string, amount: number) => boolean;
  resetGame: () => void;
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const test = TEST_DATA_ENABLED ? makeTestGameData() : null;
const initial = {
  coins: test?.coins ?? 0,
  level: test?.level ?? 1,
  streakDays: test?.streakDays ?? 0,
  hunger: test?.hunger ?? 58,
  inventory: test?.inventory ?? ({ } as Inventory),
  shopSelection: test?.shopSelection ?? [],
  lastRewardDate: '',
  taskRewardsClaimed: [] as string[],
  dailyActivity: { date: todayKey(), fed: 0, purchased: 0 },
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initial,
      addCoins: (amount) => set((state) => ({ coins: Math.max(0, state.coins + amount) })),
      setHunger: (value) => set({ hunger: Math.max(0, Math.min(100, value)) }),
      feed: (foodId) => {
        const count = get().inventory[foodId] ?? 0;
        if (count <= 0) return false;
        const item = FOOD_BY_ID[foodId];
        set((state) => {
          const today = todayKey();
          const activity = state.dailyActivity.date === today ? state.dailyActivity : { date: today, fed: 0, purchased: 0 };
          return {
            hunger: Math.min(100, state.hunger + item.nutrition),
            inventory: { ...state.inventory, [foodId]: count - 1 },
            dailyActivity: { ...activity, fed: activity.fed + 1 },
          };
        });
        return true;
      },
      toggleShopSelection: (foodId) => set((state) => ({
        shopSelection: state.shopSelection.includes(foodId)
          ? state.shopSelection.filter((id) => id !== foodId)
          : [...state.shopSelection, foodId],
      })),
      clearShopSelection: () => set({ shopSelection: [] }),
      purchaseSelection: () => {
        const ids = get().shopSelection;
        const total = ids.reduce((sum, id) => sum + FOOD_BY_ID[id].price, 0);
        if (!ids.length || total > get().coins) return { ok: false, total };
        const next = { ...get().inventory };
        ids.forEach((id) => { next[id] = (next[id] ?? 0) + 1; });
        set((state) => {
          const today = todayKey();
          const activity = state.dailyActivity.date === today ? state.dailyActivity : { date: today, fed: 0, purchased: 0 };
          return {
            coins: state.coins - total,
            inventory: next,
            shopSelection: [],
            dailyActivity: { ...activity, purchased: activity.purchased + ids.length },
          };
        });
        return { ok: true, total };
      },
      canClaimDailyReward: () => get().lastRewardDate !== todayKey(),
      claimDailyReward: () => {
        if (!get().canClaimDailyReward()) return 0;
        set((state) => ({ coins: state.coins + 25, streakDays: state.streakDays + 1, lastRewardDate: todayKey() }));
        return 25;
      },
      claimTaskReward: (id, amount) => {
        if (get().taskRewardsClaimed.includes(id)) return false;
        set((state) => ({ coins: state.coins + amount, taskRewardsClaimed: [...state.taskRewardsClaimed, id] }));
        return true;
      },
      resetGame: () => set(initial),
    }),
    {
      name: TEST_DATA_ENABLED ? `finny-game-test-${TEST_DATA_SEED}-${TEST_DATA_SESSION}` : 'finny-game',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

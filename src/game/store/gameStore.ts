import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { GoalTemplateId } from "@/features/goals/catalog";
import { FOOD_BY_ID, type FoodId } from "@/game/catalog";
import {
  makeTestGameData,
  TEST_DATA_ENABLED,
  TEST_DATA_SEED,
  TEST_DATA_SESSION,
} from "@/game/testData";
import { HAT_BY_ID, type HatId } from "@/game/wardrobe";

type Inventory = Partial<Record<FoodId, number>>;
export type BudgetPlan = { need: number; want: number; save: number };
export type GoalRecord = {
  id: string;
  templateId: GoalTemplateId;
  name: string;
  target: number;
  saved: number;
  createdAt: string;
  purchasedAt?: string;
};
export type MoneyTransaction = {
  id: string;
  title: string;
  amount: number;
  createdAt: string;
  kind:
    | "food"
    | "reward"
    | "goal-deposit"
    | "goal-withdraw"
    | "goal-purchase"
    | "wardrobe"
    | "other";
};

type GameState = {
  coins: number;
  xp: number;
  level: number;
  streakDays: number;
  hunger: number;
  inventory: Inventory;
  shopSelection: FoodId[];
  lastRewardDate: string;
  taskRewardsClaimed: string[];
  dailyActivity: { date: string; fed: number; purchased: number };
  completedLessons: string[];
  claimedLessonRewards: string[];
  lessonAccuracy: Record<string, number>;
  completedChapters: string[];
  claimedChapterRewards: string[];
  budgetPlan: BudgetPlan;
  goals: GoalRecord[];
  transactions: MoneyTransaction[];
  milestonesSeen: string[];
  equippedHat: HatId;
  ownedHats: HatId[];
  addCoins: (amount: number, title?: string) => void;
  setHunger: (value: number) => void;
  feed: (foodId: FoodId) => boolean;
  toggleShopSelection: (foodId: FoodId) => void;
  clearShopSelection: () => void;
  purchaseSelection: () => { ok: boolean; total: number };
  purchaseFood: (foodId: FoodId) => boolean;
  refundFood: (foodId: FoodId) => boolean;
  canClaimDailyReward: () => boolean;
  claimDailyReward: () => number;
  claimTaskReward: (id: string, amount: number) => boolean;
  completeLesson: (lessonId: string, accuracy: number) => void;
  claimLessonReward: (lessonId: string) => {
    ok: boolean;
    coins: number;
    xp: number;
  };
  completeChapter: (chapterId: string) => void;
  claimChapterReward: (chapterId: string) => {
    ok: boolean;
    coins: number;
    xp: number;
  };
  setBudgetPlan: (plan: BudgetPlan) => void;
  addGoal: (
    templateId: GoalTemplateId,
    name: string,
    target: number,
  ) => GoalRecord;
  depositGoal: (goalId: string, amount: number) => boolean;
  withdrawGoal: (goalId: string, amount: number) => boolean;
  purchaseGoal: (goalId: string) => boolean;
  removeGoal: (goalId: string) => void;
  markMilestoneSeen: (id: string) => void;
  equipHat: (hatId: HatId) => void;
  purchaseHat: (hatId: HatId) => boolean;
  resetGame: () => void;
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const tx = (
  title: string,
  amount: number,
  kind: MoneyTransaction["kind"],
): MoneyTransaction => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title,
  amount,
  kind,
  createdAt: new Date().toISOString(),
});
const test = TEST_DATA_ENABLED ? makeTestGameData() : null;
const initial = {
  coins: test?.coins ?? 60,
  xp: 0,
  level: test?.level ?? 1,
  streakDays: test?.streakDays ?? 0,
  hunger: test?.hunger ?? 58,
  inventory: test?.inventory ?? ({} as Inventory),
  shopSelection: test?.shopSelection ?? [],
  lastRewardDate: "",
  taskRewardsClaimed: [] as string[],
  dailyActivity: { date: todayKey(), fed: 0, purchased: 0 },
  completedLessons: [] as string[],
  claimedLessonRewards: [] as string[],
  lessonAccuracy: {} as Record<string, number>,
  completedChapters: [] as string[],
  claimedChapterRewards: [] as string[],
  budgetPlan: { need: 50, want: 30, save: 20 } as BudgetPlan,
  goals: [] as GoalRecord[],
  transactions: [] as MoneyTransaction[],
  milestonesSeen: [] as string[],
  equippedHat: "none" as HatId,
  ownedHats: ["none"] as HatId[],
};

export function useGameHydrated() {
  const [hydrated, setHydrated] = useState(useGameStore.persist.hasHydrated());
  useEffect(() => {
    const unsubscribe = useGameStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    setHydrated(useGameStore.persist.hasHydrated());
    return unsubscribe;
  }, []);
  return hydrated;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initial,
      addCoins: (amount, title = "Пополнение") =>
        set((state) => ({
          coins: Math.max(0, state.coins + amount),
          transactions:
            amount === 0
              ? state.transactions
              : [tx(title, amount, "other"), ...state.transactions].slice(
                  0,
                  100,
                ),
        })),
      setHunger: (value) => set({ hunger: Math.max(0, Math.min(100, value)) }),
      feed: (foodId) => {
        const count = get().inventory[foodId] ?? 0;
        if (count <= 0) return false;
        const item = FOOD_BY_ID[foodId];
        set((state) => {
          const today = todayKey();
          const activity =
            state.dailyActivity.date === today
              ? state.dailyActivity
              : { date: today, fed: 0, purchased: 0 };
          return {
            hunger: Math.min(100, state.hunger + item.nutrition),
            inventory: { ...state.inventory, [foodId]: count - 1 },
            dailyActivity: { ...activity, fed: activity.fed + 1 },
          };
        });
        return true;
      },
      toggleShopSelection: (foodId) =>
        set((state) => ({
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
        ids.forEach((id) => {
          next[id] = (next[id] ?? 0) + 1;
        });
        set((state) => {
          const today = todayKey();
          const activity =
            state.dailyActivity.date === today
              ? state.dailyActivity
              : { date: today, fed: 0, purchased: 0 };
          return {
            coins: state.coins - total,
            inventory: next,
            shopSelection: [],
            dailyActivity: {
              ...activity,
              purchased: activity.purchased + ids.length,
            },
            transactions: [
              tx(`Еда · ${ids.length} шт.`, -total, "food"),
              ...state.transactions,
            ].slice(0, 100),
          };
        });
        return { ok: true, total };
      },
      purchaseFood: (foodId) => {
        const item = FOOD_BY_ID[foodId];
        if (get().coins < item.price) return false;
        set((state) => {
          const today = todayKey();
          const activity =
            state.dailyActivity.date === today
              ? state.dailyActivity
              : { date: today, fed: 0, purchased: 0 };
          return {
            coins: state.coins - item.price,
            inventory: {
              ...state.inventory,
              [foodId]: (state.inventory[foodId] ?? 0) + 1,
            },
            dailyActivity: { ...activity, purchased: activity.purchased + 1 },
            transactions: [
              tx(`Еда · ${item.name}`, -item.price, "food"),
              ...state.transactions,
            ].slice(0, 100),
          };
        });
        return true;
      },
      refundFood: (foodId) => {
        const item = FOOD_BY_ID[foodId];
        if (!item) return false;
        const count = get().inventory[foodId] ?? 0;
        if (count <= 0) return false;
        set((state) => {
          const today = todayKey();
          const activity =
            state.dailyActivity.date === today
              ? state.dailyActivity
              : { date: today, fed: 0, purchased: 0 };
          return {
            coins: state.coins + item.price,
            inventory: {
              ...state.inventory,
              [foodId]: count - 1,
            },
            dailyActivity: {
              ...activity,
              purchased: Math.max(0, activity.purchased - 1),
            },
            transactions: [
              tx(`Возврат · ${item.name}`, item.price, "food"),
              ...state.transactions,
            ].slice(0, 100),
          };
        });
        return true;
      },
      canClaimDailyReward: () => get().lastRewardDate !== todayKey(),
      claimDailyReward: () => {
        if (!get().canClaimDailyReward()) return 0;
        set((state) => ({
          coins: state.coins + 25,
          streakDays: state.streakDays + 1,
          lastRewardDate: todayKey(),
          transactions: [
            tx("Ежедневная награда", 25, "reward"),
            ...state.transactions,
          ].slice(0, 100),
        }));
        return 25;
      },
      claimTaskReward: (id, amount) => {
        if (get().taskRewardsClaimed.includes(id)) return false;
        set((state) => ({
          coins: state.coins + amount,
          taskRewardsClaimed: [...state.taskRewardsClaimed, id],
          transactions: [
            tx("Награда за задание", amount, "reward"),
            ...state.transactions,
          ].slice(0, 100),
        }));
        return true;
      },
      completeLesson: (lessonId, accuracy) =>
        set((state) => ({
          completedLessons: state.completedLessons.includes(lessonId)
            ? state.completedLessons
            : [...state.completedLessons, lessonId],
          lessonAccuracy: {
            ...state.lessonAccuracy,
            [lessonId]: Math.max(0, Math.min(100, Math.round(accuracy))),
          },
        })),
      claimLessonReward: (lessonId) => {
        if (
          !get().completedLessons.includes(lessonId) ||
          get().claimedLessonRewards.includes(lessonId)
        )
          return { ok: false, coins: 0, xp: 0 };
        const coins = 30,
          xp = 25;
        set((state) => {
          const nextXp = state.xp + xp;
          return {
            coins: state.coins + coins,
            xp: nextXp,
            level: Math.floor(nextXp / 100) + 1,
            claimedLessonRewards: [...state.claimedLessonRewards, lessonId],
            transactions: [
              tx("Награда за урок", coins, "reward"),
              ...state.transactions,
            ].slice(0, 100),
          };
        });
        return { ok: true, coins, xp };
      },
      completeChapter: (chapterId) =>
        set((state) => ({
          completedChapters: state.completedChapters.includes(chapterId)
            ? state.completedChapters
            : [...state.completedChapters, chapterId],
        })),
      claimChapterReward: (chapterId) => {
        if (
          !get().completedChapters.includes(chapterId) ||
          get().claimedChapterRewards.includes(chapterId)
        )
          return { ok: false, coins: 0, xp: 0 };
        const coins = 60,
          xp = 60;
        set((state) => {
          const nextXp = state.xp + xp;
          return {
            coins: state.coins + coins,
            xp: nextXp,
            level: Math.floor(nextXp / 100) + 1,
            claimedChapterRewards: [...state.claimedChapterRewards, chapterId],
            transactions: [
              tx("Награда за главу", coins, "reward"),
              ...state.transactions,
            ].slice(0, 100),
          };
        });
        return { ok: true, coins, xp };
      },
      setBudgetPlan: (plan) => {
        const total = Math.max(1, plan.need + plan.want + plan.save);
        const need = Math.round((plan.need / total) * 100);
        const want = Math.round((plan.want / total) * 100);
        set({ budgetPlan: { need, want, save: 100 - need - want } });
      },
      addGoal: (templateId, name, target) => {
        const goal: GoalRecord = {
          id: `${templateId}-${Date.now()}`,
          templateId,
          name,
          target: Math.max(1, Math.round(target)),
          saved: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ goals: [...state.goals, goal] }));
        return goal;
      },
      depositGoal: (goalId, amount) => {
        const requested = Math.max(0, Math.round(amount));
        const goal = get().goals.find((g) => g.id === goalId);
        if (!goal || goal.purchasedAt || requested <= 0) return false;
        const value = Math.min(requested, goal.target - goal.saved);
        if (value <= 0 || get().coins < value) return false;
        set((state) => ({
          coins: state.coins - value,
          goals: state.goals.map((g) =>
            g.id === goalId ? { ...g, saved: g.saved + value } : g,
          ),
          transactions: [
            tx(`В копилку · ${goal.name}`, -value, "goal-deposit"),
            ...state.transactions,
          ].slice(0, 100),
        }));
        return true;
      },
      withdrawGoal: (goalId, amount) => {
        const value = Math.max(0, Math.round(amount));
        const goal = get().goals.find((g) => g.id === goalId);
        if (!goal || goal.purchasedAt || value <= 0 || goal.saved < value)
          return false;
        set((state) => ({
          coins: state.coins + value,
          goals: state.goals.map((g) =>
            g.id === goalId ? { ...g, saved: g.saved - value } : g,
          ),
          transactions: [
            tx(`Из копилки · ${goal.name}`, value, "goal-withdraw"),
            ...state.transactions,
          ].slice(0, 100),
        }));
        return true;
      },
      purchaseGoal: (goalId) => {
        const goal = get().goals.find((g) => g.id === goalId);
        if (!goal || goal.purchasedAt || goal.saved < goal.target) return false;
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId
              ? { ...g, purchasedAt: new Date().toISOString() }
              : g,
          ),
          transactions: [
            tx(`Покупка цели · ${goal.name}`, -goal.target, "goal-purchase"),
            ...state.transactions,
          ].slice(0, 100),
        }));
        return true;
      },
      removeGoal: (goalId) =>
        set((state) => {
          const goal = state.goals.find((g) => g.id === goalId);
          if (!goal) return state;
          const refund = goal.purchasedAt ? 0 : goal.saved;
          return {
            ...state,
            coins: state.coins + refund,
            goals: state.goals.filter((g) => g.id !== goalId),
            transactions:
              refund > 0
                ? [
                    tx(
                      `Возврат из цели · ${goal.name}`,
                      refund,
                      "goal-withdraw",
                    ),
                    ...state.transactions,
                  ].slice(0, 100)
                : state.transactions,
          };
        }),
      markMilestoneSeen: (id) =>
        set((state) => ({
          milestonesSeen: state.milestonesSeen.includes(id)
            ? state.milestonesSeen
            : [...state.milestonesSeen, id],
        })),
      equipHat: (hatId) =>
        set((state) =>
          state.ownedHats.includes(hatId) ? { equippedHat: hatId } : state,
        ),
      purchaseHat: (hatId) => {
        if (get().ownedHats.includes(hatId)) {
          set({ equippedHat: hatId });
          return true;
        }
        const hat = HAT_BY_ID[hatId];
        if (!hat || get().coins < hat.price) return false;
        set((state) => ({
          coins: state.coins - hat.price,
          equippedHat: hatId,
          ownedHats: [...state.ownedHats, hatId],
          transactions: [
            tx(`Гардероб · ${hat.name}`, -hat.price, "wardrobe"),
            ...state.transactions,
          ].slice(0, 100),
        }));
        return true;
      },
      resetGame: () => set(initial),
    }),
    {
      name: TEST_DATA_ENABLED
        ? `finny-game-test-${TEST_DATA_SEED}-${TEST_DATA_SESSION}`
        : "finny-game",
      version: 4,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted: any) => ({
        ...initial,
        ...(persisted ?? {}),
        budgetPlan: persisted?.budgetPlan ?? initial.budgetPlan,
        goals: persisted?.goals ?? [],
        transactions: persisted?.transactions ?? [],
        completedLessons: persisted?.completedLessons ?? [],
        claimedLessonRewards: persisted?.claimedLessonRewards ?? [],
        lessonAccuracy: persisted?.lessonAccuracy ?? {},
        completedChapters: persisted?.completedChapters ?? [],
        claimedChapterRewards: persisted?.claimedChapterRewards ?? [],
        milestonesSeen: persisted?.milestonesSeen ?? [],
        xp: persisted?.xp ?? Math.max(0, ((persisted?.level ?? 1) - 1) * 100),
        ownedHats: persisted?.ownedHats ?? ["none"],
        equippedHat: persisted?.ownedHats?.includes(persisted?.equippedHat)
          ? persisted.equippedHat
          : "none",
      }),
    },
  ),
);

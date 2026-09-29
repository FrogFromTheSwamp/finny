export type GoalLike = {
  id: string;
  templateId: string;
  target: number;
  purchasedAt?: string;
};

export function isGoalTemplateAvailable(
  templateId: string,
  goals: readonly Pick<GoalLike, 'templateId'>[],
  ownedHats: readonly string[],
): boolean {
  return !goals.some((goal) => goal.templateId === templateId) &&
    !(templateId === 'party-hat' && ownedHats.includes('dotted'));
}

export function canPurchaseGoal(
  goal: GoalLike | undefined,
  goals: readonly GoalLike[],
  piggyBalance: number,
  ownedHats: readonly string[],
): boolean {
  if (!goal || goal.purchasedAt || piggyBalance < goal.target) return false;
  if (goal.templateId === 'party-hat' && ownedHats.includes('dotted')) return false;
  return !goals.some((other) => other.templateId === goal.templateId && !!other.purchasedAt);
}

export function hatPurchaseAction(
  hatId: string,
  price: number,
  coins: number,
  ownedHats: readonly string[],
): 'equip' | 'buy' | 'insufficient' {
  if (ownedHats.includes(hatId)) return 'equip';
  return coins >= price ? 'buy' : 'insufficient';
}

export function canClaimReward(
  id: string,
  completedIds: readonly string[],
  claimedIds: readonly string[],
): boolean {
  return completedIds.includes(id) && !claimedIds.includes(id);
}

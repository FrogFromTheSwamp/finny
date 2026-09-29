import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canClaimReward,
  canPurchaseGoal,
  hatPurchaseAction,
  isGoalTemplateAvailable,
} from '../src/game/purchaseRules.ts';

const dottedHatGoal = { id: 'hat-1', templateId: 'party-hat', target: 15 };
const bicycleGoal = { id: 'bike-1', templateId: 'bicycle', target: 120 };

test('goal choices exclude a hat bought in the wardrobe, even without a goal record', () => {
  assert.equal(isGoalTemplateAvailable('party-hat', [], ['none', 'dotted']), false);
  assert.equal(isGoalTemplateAvailable('bicycle', [], ['none', 'dotted']), true);
});

test('goal choices exclude active and purchased goals', () => {
  assert.equal(isGoalTemplateAvailable('bicycle', [bicycleGoal], ['none']), false);
  assert.equal(isGoalTemplateAvailable('bicycle', [{ ...bicycleGoal, purchasedAt: '2026-09-29' }], ['none']), false);
  assert.equal(isGoalTemplateAvailable('teddy', [bicycleGoal], ['none']), true);
});

test('goal purchase requires enough savings and can happen only once', () => {
  assert.equal(canPurchaseGoal(bicycleGoal, [bicycleGoal], 119, ['none']), false);
  assert.equal(canPurchaseGoal(bicycleGoal, [bicycleGoal], 120, ['none']), true);
  assert.equal(canPurchaseGoal({ ...bicycleGoal, purchasedAt: '2026-09-29' }, [bicycleGoal], 120, ['none']), false);
  assert.equal(canPurchaseGoal(bicycleGoal, [bicycleGoal, { ...bicycleGoal, id: 'bike-2', purchasedAt: '2026-09-29' }], 120, ['none']), false);
});

test('goal purchase cannot charge again for a hat already owned', () => {
  assert.equal(canPurchaseGoal(dottedHatGoal, [dottedHatGoal], 15, ['none', 'dotted']), false);
  assert.equal(canPurchaseGoal(dottedHatGoal, [dottedHatGoal], 15, ['none']), true);
});

test('buying an owned hat equips it without requiring coins or another charge', () => {
  assert.equal(hatPurchaseAction('dotted', 16, 0, ['none', 'dotted']), 'equip');
  assert.equal(hatPurchaseAction('dotted', 16, 16, ['none']), 'buy');
  assert.equal(hatPurchaseAction('dotted', 16, 15, ['none']), 'insufficient');
});

test('lesson and chapter rewards require completion and cannot be claimed twice', () => {
  assert.equal(canClaimReward('savings-1', [], []), false);
  assert.equal(canClaimReward('savings-1', ['savings-1'], []), true);
  assert.equal(canClaimReward('savings-1', ['savings-1'], ['savings-1']), false);
  assert.equal(canClaimReward('budget', ['budget'], ['savings']), true);
});

import { getVoucherEligibility, isGiftReward, isGardenReward } from './joyVoucherRules.js';

export const selectOrderGifts = (rewards, subtotalSen) => {
  const seen = new Set();
  return (rewards || []).filter((reward) => {
    if (!isGiftReward(reward) || seen.has(reward.tierId) || !getVoucherEligibility(reward, subtotalSen).eligible) return false;
    seen.add(reward.tierId);
    return true;
  });
};

export const buildOrderGiftSnapshots = (rewards, subtotalSen) => selectOrderGifts(rewards, subtotalSen).map((reward) => ({
  code: reward.code, tierId: reward.tierId, coinCost: reward.coinCost, quantity: 1, status: 'reserved',
  source: isGardenReward(reward) ? 'garden' : 'joy',
}));

export const giftRushRewards = [
  { id: 'daily', amount: 20, threshold: null },
  { id: 'score-1500', amount: 5, threshold: 1500 },
  { id: 'score-2000', amount: 5, threshold: 2000 },
];
export const getGiftRushReward = (id = 'daily') => giftRushRewards.find(reward => reward.id === id);
export const giftRushRewardId = (date, rewardId = 'daily') => getGiftRushReward(rewardId) ? 'gift-rush-' + rewardId + ':' + date : null;

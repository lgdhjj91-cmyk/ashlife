const objectives = [
  { id: 'perfect-five', metric: 'perfectOrders', target: 5 },
  { id: 'serve-ten', metric: 'servedOrders', target: 10 },
  { id: 'combo-four', metric: 'maxCombo', target: 4 },
];
export const getGiftRushDailyChallenge = dateKey => {
  const sum = [...String(dateKey)].reduce((total, character) => total + character.charCodeAt(0), 0);
  return { ...objectives[sum % objectives.length], dateKey, coins: 20 };
};
export const evaluateGiftRushChallenge = (challenge, stats) => {
  const progress = Math.max(0, Number(stats?.[challenge.metric]) || 0);
  return { complete: progress >= challenge.target, progress, target: challenge.target };
};

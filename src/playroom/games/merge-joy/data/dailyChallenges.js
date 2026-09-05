import { getLocalDateKey } from '../../../utils/dateKey.js';

const challengeDefinitions = [
  { id: 'notebook-maker', title: 'Create 1 Bunny Notebook.', metric: 'tier:6', thresholds: [1, 2, 3, 4] },
  { id: 'combo-maker', title: 'Make a ×3 combo.', metric: 'maxCombo', thresholds: [3, 4, 5, 6] },
  { id: 'perfect-five', title: 'Perform 5 Perfect Drops.', metric: 'perfectDrops', thresholds: [5, 7, 9, 12] },
  { id: 'score-sprint', title: 'Reach 10,000 points.', metric: 'score', thresholds: [10_000, 20_000, 30_000, 80_000] },
  { id: 'chick-pair', title: 'Create 2 Chick Plushies.', metric: 'tier:8', thresholds: [2, 3, 4, 5] },
];

const medalNames = ['bronze', 'silver', 'gold', 'perfect'];
const coinAwards = [15, 30, 50, 80];
const hashDate = (dateKey) => dateKey.split('').reduce((total, character) => total + character.charCodeAt(0), 0);

export const calculateScoreReward = (score = 0) => {
  const numScore = Number(score) || 0;
  if (numScore >= 80_000) return { medal: 'perfect', coins: 80 };
  if (numScore >= 30_000) return { medal: 'gold', coins: 50 };
  if (numScore >= 20_000) return { medal: 'silver', coins: 30 };
  if (numScore >= 10_000) return { medal: 'bronze', coins: 15 };
  return { medal: null, coins: 0 };
};

const readMetric = (metric, stats) => {
  if (metric.startsWith('tier:')) return Number(stats.createdByTier?.[Number(metric.split(':')[1])] || 0);
  return Number(stats[metric] || 0);
};

export const getDailyMergeChallenge = (date = new Date()) => {
  const dateKey = getLocalDateKey(date);
  return { ...challengeDefinitions[hashDate(dateKey) % challengeDefinitions.length], dateKey };
};

export const evaluateDailyChallenge = (challenge, stats = {}) => {
  const value = readMetric(challenge.metric, stats);
  let medalIndex = -1;
  challenge.thresholds.forEach((threshold, index) => {
    if (value >= threshold) medalIndex = index;
  });

  const challengeCoins = medalIndex >= 0 ? coinAwards[medalIndex] : 0;
  const challengeMedal = medalIndex >= 0 ? medalNames[medalIndex] : null;

  const scoreReward = calculateScoreReward(stats.score);

  const bestCoins = Math.max(challengeCoins, scoreReward.coins);
  const bestMedal =
    challengeCoins >= scoreReward.coins && challengeMedal
      ? challengeMedal
      : scoreReward.medal || challengeMedal;

  return {
    complete: bestCoins > 0,
    medal: bestMedal,
    coins: bestCoins,
    value,
  };
};

export const dailyMergeChallenges = challengeDefinitions;


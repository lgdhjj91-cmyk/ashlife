import { getLocalDateKey } from '../../../utils/dateKey.js';

const challengeDefinitions = [
  { id: 'notebook-maker', title: 'Create 1 Bunny Notebook.', metric: 'tier:6', thresholds: [1, 2, 3, 4] },
  { id: 'combo-maker', title: 'Make a ×3 combo.', metric: 'maxCombo', thresholds: [3, 4, 5, 6] },
  { id: 'perfect-five', title: 'Perform 5 Perfect Drops.', metric: 'perfectDrops', thresholds: [5, 7, 9, 12] },
  { id: 'score-sprint', title: 'Reach 30,000 points.', metric: 'score', thresholds: [30_000, 75_000, 100_000, 150_000] },
  { id: 'chick-pair', title: 'Create 2 Chick Plushies.', metric: 'tier:8', thresholds: [2, 3, 4, 5] },
];

const medalNames = ['bronze', 'silver', 'gold', 'perfect'];
const coinAwards = [10, 20, 25, 30];
const hashDate = (dateKey) => dateKey.split('').reduce((total, character) => total + character.charCodeAt(0), 0);

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
  return {
    complete: medalIndex >= 0,
    medal: medalIndex >= 0 ? medalNames[medalIndex] : null,
    coins: medalIndex >= 0 ? coinAwards[medalIndex] : 0,
    value,
  };
};

export const dailyMergeChallenges = challengeDefinitions;

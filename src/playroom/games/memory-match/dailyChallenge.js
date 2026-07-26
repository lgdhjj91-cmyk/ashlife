import { stickers } from '../../data/stickers.js';
import { getLocalDateKey } from '../../utils/dateKey.js';

export { getLocalDateKey } from '../../utils/dateKey.js';

const dailyChallenges = [
  {
    id: 'easy-finish',
    title: 'Complete one Easy game.',
    rewardCoins: 12,
    rewardRarity: 'uncommon',
    isComplete: ({ difficulty }) => difficulty === 'easy',
  },
  {
    id: 'normal-30-moves',
    title: 'Complete Normal mode in 30 moves or fewer.',
    rewardCoins: 18,
    rewardRarity: 'uncommon',
    isComplete: ({ difficulty, moves }) => difficulty === 'normal' && moves <= 30,
  },
  {
    id: 'normal-fast',
    title: 'Finish Normal mode within 2 minutes.',
    rewardCoins: 18,
    rewardRarity: 'uncommon',
    isComplete: ({ difficulty, elapsedSeconds }) => difficulty === 'normal' && elapsedSeconds <= 120,
  },
  {
    id: 'hard-finish',
    title: 'Finish Hard mode.',
    rewardCoins: 28,
    rewardRarity: 'rare',
    isComplete: ({ difficulty }) => difficulty === 'hard',
  },
  {
    id: 'no-hint',
    title: 'Complete a game without using a hint.',
    rewardCoins: 14,
    rewardRarity: 'uncommon',
    isComplete: ({ usedHints }) => usedHints === 0,
  },
];

const hashDate = (dateKey) =>
  dateKey.split('').reduce((total, character) => total + character.charCodeAt(0), 0);

export const getDailyChallenge = (date = new Date()) => {
  const dateKey = getLocalDateKey(date);
  return {
    ...dailyChallenges[hashDate(dateKey) % dailyChallenges.length],
    dateKey,
  };
};

export const pickDailyStickerReward = (unlockedIds, rarity = 'uncommon', dateKey = getLocalDateKey()) => {
  const preferred = stickers.filter((sticker) => sticker.rarity === rarity && !unlockedIds.includes(sticker.id));
  const fallback = stickers.filter((sticker) => !unlockedIds.includes(sticker.id));
  const pool = preferred.length > 0 ? preferred : fallback;
  if (pool.length === 0) return null;
  return pool[hashDate(dateKey) % pool.length];
};

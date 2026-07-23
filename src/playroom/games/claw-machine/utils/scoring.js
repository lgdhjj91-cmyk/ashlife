const rarityScore = {
  common: 260,
  uncommon: 380,
  rare: 540,
  special: 740,
};

const difficultyMultiplier = {
  easy: 0.9,
  normal: 1,
  hard: 1.28,
};

const rewardMultiplier = {
  easy: 0.85,
  normal: 1,
  hard: 1.35,
};

const bonusValues = {
  'perfect-grip': 160,
  'apex-release': 150,
  'one-try-win': 180,
  'wall-bounce': 140,
  'hook-master': 170,
  'save-the-slip': 190,
  'precision-drop': 130,
};

export const calculateClawScore = ({
  prize,
  difficulty = 'normal',
  attemptsUsed = 1,
  remainingAttempts = 0,
  elapsedSeconds = 0,
  bonuses = [],
}) => {
  const base = rarityScore[prize?.rarity] || rarityScore.common;
  const rewardWeight = Math.max(0, Number(prize?.rewardCoins) || 0) * 8;
  const attemptBonus = Math.max(0, 4 - attemptsUsed) * 80 + Math.max(0, remainingAttempts) * 55;
  const speedBonus = Math.max(0, 90 - elapsedSeconds) * 3;
  const specialBonus = bonuses.reduce((total, bonus) => total + (bonusValues[bonus] || 0), 0);

  return Math.max(
    0,
    Math.round((base + rewardWeight + attemptBonus + speedBonus + specialBonus) * (difficultyMultiplier[difficulty] || 1))
  );
};

export const calculateClawReward = ({ prize, mode = 'classic', difficulty = 'normal', isDuplicate = false }) => {
  const baseCoins = Math.max(0, Number(prize?.rewardCoins) || 0);
  const practiceCoins = Math.min(5, Math.max(1, Math.round(baseCoins * 0.25)));
  const duplicateCoins = Math.max(3, Math.round(baseCoins * 0.32));
  const classicCoins = Math.round(baseCoins * (rewardMultiplier[difficulty] || 1));

  return {
    coins: mode === 'practice' ? practiceCoins : isDuplicate ? duplicateCoins : classicCoins,
    stickerId: prize?.stickerId || prize?.id,
    rarity: prize?.rarity || 'common',
  };
};

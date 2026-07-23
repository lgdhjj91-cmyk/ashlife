export const difficultySettings = {
  easy: {
    label: 'Easy',
    pairs: 6,
    baseScore: 500,
    baseCoins: 10,
    maxCoins: 20,
    freeHints: 2,
    targetMoves: 16,
    targetSeconds: 75,
  },
  normal: {
    label: 'Normal',
    pairs: 8,
    baseScore: 900,
    baseCoins: 20,
    maxCoins: 35,
    freeHints: 1,
    targetMoves: 30,
    targetSeconds: 120,
  },
  hard: {
    label: 'Hard',
    pairs: 12,
    baseScore: 1500,
    baseCoins: 35,
    maxCoins: 60,
    freeHints: 0,
    targetMoves: 44,
    targetSeconds: 210,
  },
};

export const calculateScore = ({ difficulty, moves, elapsedSeconds, usedHints = 0 }) => {
  const settings = difficultySettings[difficulty] || difficultySettings.easy;
  const moveBonus = Math.max(0, settings.targetMoves - moves) * 18;
  const speedBonus = Math.max(0, settings.targetSeconds - elapsedSeconds) * 4;
  const hintPenalty = usedHints * (difficulty === 'hard' ? 160 : 80);
  return Math.max(0, Math.round(settings.baseScore + moveBonus + speedBonus - hintPenalty));
};

export const calculateJoyCoins = ({ difficulty, moves, elapsedSeconds, usedHints = 0 }) => {
  const settings = difficultySettings[difficulty] || difficultySettings.easy;
  const moveRatio = Math.max(0, settings.targetMoves - moves) / settings.targetMoves;
  const speedRatio = Math.max(0, settings.targetSeconds - elapsedSeconds) / settings.targetSeconds;
  const bonus = Math.round((settings.maxCoins - settings.baseCoins) * Math.min(1, moveRatio + speedRatio));
  const penalty = difficulty === 'hard' && usedHints > 0 ? 8 : 0;
  return Math.max(0, settings.baseCoins + bonus - penalty);
};

export const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
};


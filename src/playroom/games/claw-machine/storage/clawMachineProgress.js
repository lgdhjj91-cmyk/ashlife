import { getLocalDateKey } from '../../memory-match/dailyChallenge';
import { calculateClawReward, calculateClawScore } from '../utils/scoring';

export const applyClawPrizeReward = (progress, { prize, mode, difficulty, attemptsUsed, remainingAttempts, elapsedSeconds, bonuses }) => {
  const previousQuantity = progress.clawMachine?.prizeQuantities?.[prize.id] || 0;
  const reward = calculateClawReward({
    prize,
    mode,
    difficulty,
    isDuplicate: previousQuantity > 0,
  });
  const score = calculateClawScore({ prize, difficulty, attemptsUsed, remainingAttempts, elapsedSeconds, bonuses });
  const dateKey = getLocalDateKey();
  const currentRecord = progress.records?.clawMachine?.[difficulty] || {};
  const wonPrizeIds = progress.clawMachine?.wonPrizeIds || [];
  const unlockedStickers = progress.unlockedStickers.includes(reward.stickerId)
    ? progress.unlockedStickers
    : [...progress.unlockedStickers, reward.stickerId];

  return {
    nextProgress: {
      ...progress,
      coins: Math.max(0, progress.coins + reward.coins),
      unlockedStickers,
      stickerUnlockDates: {
        ...progress.stickerUnlockDates,
        [reward.stickerId]: progress.stickerUnlockDates[reward.stickerId] || dateKey,
      },
      clawMachine: {
        ...progress.clawMachine,
        practiceCompleted: progress.clawMachine.practiceCompleted || mode === 'practice',
        wonPrizeIds: wonPrizeIds.includes(prize.id) ? wonPrizeIds : [...wonPrizeIds, prize.id],
        prizeQuantities: {
          ...progress.clawMachine.prizeQuantities,
          [prize.id]: previousQuantity + 1,
        },
        bestScore: Math.max(progress.clawMachine.bestScore || 0, score),
        fastestSuccess:
          !progress.clawMachine.fastestSuccess || elapsedSeconds < progress.clawMachine.fastestSuccess
            ? elapsedSeconds
            : progress.clawMachine.fastestSuccess,
        fewestAttempts:
          !progress.clawMachine.fewestAttempts || attemptsUsed < progress.clawMachine.fewestAttempts
            ? attemptsUsed
            : progress.clawMachine.fewestAttempts,
      },
      records: {
        ...progress.records,
        clawMachine: {
          ...progress.records.clawMachine,
          [difficulty]: {
            bestScore: Math.max(currentRecord.bestScore || 0, score),
            fastestSuccess:
              !currentRecord.fastestSuccess || elapsedSeconds < currentRecord.fastestSuccess
                ? elapsedSeconds
                : currentRecord.fastestSuccess,
            fewestAttempts:
              !currentRecord.fewestAttempts || attemptsUsed < currentRecord.fewestAttempts
                ? attemptsUsed
                : currentRecord.fewestAttempts,
          },
        },
      },
    },
    reward: {
      ...reward,
      score,
      isDuplicate: previousQuantity > 0,
    },
  };
};

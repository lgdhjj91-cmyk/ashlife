import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  loadPlayroomProgress,
  normalizePlayroomProgress,
  resetPlayroomProgress,
  savePlayroomProgress,
} from '../storage/playroomStorage';
import { getLocalDateKey } from '../games/memory-match/dailyChallenge';

export const usePlayroomProgress = () => {
  const [progress, setProgress] = useState(() => loadPlayroomProgress());

  useEffect(() => {
    savePlayroomProgress(progress);
  }, [progress]);

  const updateProgress = useCallback((updater) => {
    setProgress((current) => normalizePlayroomProgress(typeof updater === 'function' ? updater(current) : updater));
  }, []);

  const addCoins = useCallback(
    (amount) => {
      updateProgress((current) => ({
        ...current,
        coins: Math.max(0, current.coins + Math.max(0, amount)),
      }));
    },
    [updateProgress]
  );

  const unlockSticker = useCallback(
    (stickerId, dateKey = getLocalDateKey()) => {
      if (!stickerId) return false;
      let didUnlock = false;
      updateProgress((current) => {
        if (current.unlockedStickers.includes(stickerId)) return current;
        didUnlock = true;
        return {
          ...current,
          unlockedStickers: [...current.unlockedStickers, stickerId],
          stickerUnlockDates: {
            ...current.stickerUnlockDates,
            [stickerId]: dateKey,
          },
        };
      });
      return didUnlock;
    },
    [updateProgress]
  );

  const recordGameResult = useCallback(
    ({ difficulty, score, elapsedSeconds, moves }) => {
      updateProgress((current) => {
        const currentRecord = current.records[difficulty] || {};
        return {
          ...current,
          records: {
            ...current.records,
            [difficulty]: {
              bestScore: Math.max(currentRecord.bestScore || 0, score),
              bestTime:
                !currentRecord.bestTime || elapsedSeconds < currentRecord.bestTime
                  ? elapsedSeconds
                  : currentRecord.bestTime,
              lowestMoves:
                !currentRecord.lowestMoves || moves < currentRecord.lowestMoves ? moves : currentRecord.lowestMoves,
            },
          },
        };
      });
    },
    [updateProgress]
  );

  const claimDailyReward = useCallback(
    ({ challenge, sticker, coins }) => {
      if (!challenge || !sticker) return false;
      let claimed = false;
      updateProgress((current) => {
        if (current.dailyChallenge.lastClaimedDate === challenge.dateKey) return current;
        claimed = true;
        const unlockedStickers = current.unlockedStickers.includes(sticker.id)
          ? current.unlockedStickers
          : [...current.unlockedStickers, sticker.id];
        return {
          ...current,
          coins: Math.max(0, current.coins + Math.max(0, coins)),
          unlockedStickers,
          stickerUnlockDates: {
            ...current.stickerUnlockDates,
            [sticker.id]: current.stickerUnlockDates[sticker.id] || challenge.dateKey,
          },
          dailyChallenge: {
            lastClaimedDate: challenge.dateKey,
            claimedChallengeId: challenge.id,
          },
        };
      });
      return claimed;
    },
    [updateProgress]
  );

  const updateSettings = useCallback(
    (nextSettings) => {
      updateProgress((current) => ({
        ...current,
        settings: {
          ...current.settings,
          ...(typeof nextSettings === 'function' ? nextSettings(current.settings) : nextSettings),
        },
      }));
    },
    [updateProgress]
  );

  const resetProgress = useCallback(() => {
    setProgress(resetPlayroomProgress());
  }, []);

  const summary = useMemo(
    () => ({
      unlockedCount: progress.unlockedStickers.length,
      coins: progress.coins,
      settings: progress.settings,
      dailyChallenge: progress.dailyChallenge,
    }),
    [progress]
  );

  return {
    progress,
    summary,
    addCoins,
    unlockSticker,
    recordGameResult,
    claimDailyReward,
    updateProgress,
    updateSettings,
    resetProgress,
  };
};

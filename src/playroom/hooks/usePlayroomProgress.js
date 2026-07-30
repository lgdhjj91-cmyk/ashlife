import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  loadPlayroomProgress,
  normalizePlayroomProgress,
  resetPlayroomProgress,
  savePlayroomProgress,
} from '../storage/playroomStorage';
import { getLocalDateKey } from '../games/memory-match/dailyChallenge';
import { useJoyWallet } from '../../context/JoyWalletContext';
import { createJoyRequestId } from '../../joy/joyWalletState';

export const usePlayroomProgress = () => {
  const {
    wallet,
    loading: walletLoading,
    awardCoins: awardWalletCoins,
    resetCoins: resetWalletCoins,
  } = useJoyWallet();
  const [progress, setProgress] = useState(() => loadPlayroomProgress());

  useEffect(() => {
    savePlayroomProgress(progress);
  }, [progress]);

  const updateProgress = useCallback((updater) => {
    setProgress((current) => {
      const base = walletLoading
        ? current
        : normalizePlayroomProgress({
            ...current,
            coins: wallet.coins,
          });
      return normalizePlayroomProgress(typeof updater === 'function' ? updater(base) : updater);
    });
  }, [wallet.coins, walletLoading]);

  const addCoins = useCallback(
    (amount) => {
      const safeAmount = Math.max(0, Number(amount) || 0);
      if (!safeAmount) return;
      updateProgress((current) => ({
        ...current,
        coins: Math.max(0, current.coins + safeAmount),
      }));
      void awardWalletCoins(safeAmount, createJoyRequestId('game-reward'));
    },
    [awardWalletCoins, updateProgress]
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
      if (progress.dailyChallenge.lastClaimedDate === challenge.dateKey) return false;
      updateProgress((current) => {
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
      void awardWalletCoins(
        Math.max(0, Number(coins) || 0),
        `daily-${challenge.id || challenge.dateKey}`
      );
      return true;
    },
    [awardWalletCoins, progress.dailyChallenge.lastClaimedDate, updateProgress]
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
    void resetWalletCoins();
  }, [resetWalletCoins]);

  const syncCoinReward = useCallback(
    (amount, claimId = createJoyRequestId('game-reward')) =>
      awardWalletCoins(Math.max(0, Number(amount) || 0), claimId),
    [awardWalletCoins]
  );

  const syncedProgress = useMemo(
    () =>
      walletLoading
        ? progress
        : normalizePlayroomProgress({
            ...progress,
            coins: wallet.coins,
          }),
    [progress, wallet.coins, walletLoading]
  );

  const summary = useMemo(
    () => ({
      unlockedCount: syncedProgress.unlockedStickers.length,
      coins: syncedProgress.coins,
      settings: syncedProgress.settings,
      dailyChallenge: syncedProgress.dailyChallenge,
    }),
    [syncedProgress]
  );

  return {
    progress: syncedProgress,
    summary,
    addCoins,
    unlockSticker,
    recordGameResult,
    claimDailyReward,
    syncCoinReward,
    updateProgress,
    updateSettings,
    resetProgress,
  };
};

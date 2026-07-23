import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { stickers } from '../data/stickers';
import { getDailyChallenge, pickDailyStickerReward } from '../games/memory-match/dailyChallenge';
import { areCardsMatching, createMemoryDeck } from '../games/memory-match/memoryGameLogic';
import { calculateJoyCoins, calculateScore, difficultySettings } from '../games/memory-match/scoring';

const getInitialHints = (difficulty) => difficultySettings[difficulty]?.freeHints ?? 0;

export const useMemoryGame = ({ progress, progressActions, sound, initialDifficulty = 'normal' }) => {
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [cards, setCards] = useState(() => createMemoryDeck(stickers, difficultySettings[initialDifficulty].pairs));
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [moves, setMoves] = useState(0);
  const [hintsRemaining, setHintsRemaining] = useState(getInitialHints(initialDifficulty));
  const [isHinting, setIsHinting] = useState(false);
  const [usedHints, setUsedHints] = useState(0);
  const [completion, setCompletion] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Choose a difficulty and start matching.');
  const completedRef = useRef(false);

  const settings = difficultySettings[difficulty];
  const matchedPairs = cards.filter((card) => card.isMatched).length / 2;
  const isComplete = matchedPairs === settings.pairs;

  const startGame = useCallback(
    (nextDifficulty = difficulty) => {
      const nextSettings = difficultySettings[nextDifficulty] || difficultySettings.normal;
      setDifficulty(nextDifficulty);
      setCards(createMemoryDeck(stickers, nextSettings.pairs));
      setSelectedIds([]);
      setIsLocked(false);
      setIsStarted(true);
      setElapsedSeconds(0);
      setMoves(0);
      setHintsRemaining(getInitialHints(nextDifficulty));
      setIsHinting(false);
      setUsedHints(0);
      setCompletion(null);
      completedRef.current = false;
      setStatusMessage(`${nextSettings.label} mode started.`);
    },
    [difficulty]
  );

  const changeDifficulty = useCallback(
    (nextDifficulty) => {
      startGame(nextDifficulty);
    },
    [startGame]
  );

  useEffect(() => {
    if (!isStarted || completion) return undefined;
    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [completion, isStarted]);

  useEffect(() => {
    if (!isStarted || !isComplete || completedRef.current) return;

    completedRef.current = true;
    const score = calculateScore({ difficulty, moves, elapsedSeconds, usedHints });
    const coins = calculateJoyCoins({ difficulty, moves, elapsedSeconds, usedHints });
    const unlockedPool = progress.unlockedStickers || [];
    const completionSticker =
      stickers.find((sticker) => sticker.rarity === 'common' && !unlockedPool.includes(sticker.id)) ||
      stickers.find((sticker) => !unlockedPool.includes(sticker.id)) ||
      null;
    const challenge = getDailyChallenge();
    const didDaily = challenge.isComplete({ difficulty, moves, elapsedSeconds, usedHints });
    const dailyRewardSticker =
      didDaily && progress.dailyChallenge.lastClaimedDate !== challenge.dateKey
        ? pickDailyStickerReward([...unlockedPool, completionSticker?.id].filter(Boolean), challenge.rewardRarity, challenge.dateKey)
        : null;

    const completionTimer = window.setTimeout(() => {
      progressActions.addCoins(coins);
      if (completionSticker) {
        progressActions.unlockSticker(completionSticker.id);
      }
      if (didDaily && dailyRewardSticker) {
        progressActions.claimDailyReward({
          challenge,
          sticker: dailyRewardSticker,
          coins: challenge.rewardCoins,
        });
      }
      progressActions.recordGameResult({ difficulty, score, elapsedSeconds, moves });

      setCompletion({
        difficulty,
        score,
        coins,
        elapsedSeconds,
        moves,
        usedHints,
        sticker: completionSticker,
        dailyChallenge: challenge,
        dailyRewardSticker,
        dailyRewardCoins: didDaily && dailyRewardSticker ? challenge.rewardCoins : 0,
        dailySatisfied: didDaily,
        dailyAlreadyClaimed: progress.dailyChallenge.lastClaimedDate === challenge.dateKey,
      });
      setStatusMessage('Game completed. Reward unlocked.');
      sound.play('complete');
    }, 0);

    return () => window.clearTimeout(completionTimer);
  }, [difficulty, elapsedSeconds, isComplete, isStarted, moves, progress, progressActions, sound, usedHints]);

  const selectedCards = useMemo(
    () => selectedIds.map((cardId) => cards.find((card) => card.cardId === cardId)).filter(Boolean),
    [cards, selectedIds]
  );

  const chooseCard = useCallback(
    (cardId) => {
      if (!isStarted || isLocked || selectedIds.includes(cardId)) return;
      const chosen = cards.find((card) => card.cardId === cardId);
      if (!chosen || chosen.isMatched) return;

      sound.play('flip');
      const nextSelected = [...selectedIds, cardId];
      setSelectedIds(nextSelected);

      if (nextSelected.length !== 2) return;

      setIsLocked(true);
      setMoves((current) => current + 1);
      const [first, second] = nextSelected.map((id) => cards.find((card) => card.cardId === id));
      const isMatch = areCardsMatching(first, second);

      window.setTimeout(() => {
        if (isMatch) {
          setCards((current) =>
            current.map((card) => (nextSelected.includes(card.cardId) ? { ...card, isMatched: true } : card))
          );
          setStatusMessage(`Pair matched: ${first.sticker.name}.`);
          sound.play('match');
        } else {
          setStatusMessage('Pair not matched. Try again.');
          sound.play('wrong');
        }
        setSelectedIds([]);
        setIsLocked(false);
      }, isMatch ? 360 : 780);
    },
    [cards, isLocked, isStarted, selectedIds, sound]
  );

  const useHint = useCallback(() => {
    if (!isStarted || isLocked || isHinting || hintsRemaining <= 0) return;
    setHintsRemaining((current) => current - 1);
    setUsedHints((current) => current + 1);
    setIsHinting(true);
    setStatusMessage('Hint used. Unmatched stickers are briefly visible.');
    window.setTimeout(() => setIsHinting(false), 1000);
  }, [hintsRemaining, isHinting, isLocked, isStarted]);

  const dismissCompletion = useCallback(() => {
    setCompletion(null);
    setIsStarted(false);
    setSelectedIds([]);
    setIsLocked(false);
    setIsHinting(false);
    setStatusMessage('Back to Playroom.');
  }, []);

  return {
    difficulty,
    settings,
    cards,
    selectedIds,
    selectedCards,
    isLocked,
    isStarted,
    isHinting,
    elapsedSeconds,
    moves,
    matchedPairs,
    hintsRemaining,
    usedHints,
    completion,
    statusMessage,
    startGame,
    changeDifficulty,
    chooseCard,
    useHint,
    dismissCompletion,
  };
};

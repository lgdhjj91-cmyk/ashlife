import { defaultGiftRushProgress, normalizeGiftRushProgress } from '../games/gift-rush/storage/giftRushProgress.js';

const STORAGE_KEY = 'ashlife-playroom-v1';

export const PLAYROOM_STORAGE_VERSION = 1;

export const defaultPlayroomProgress = {
  version: PLAYROOM_STORAGE_VERSION,
  coins: 0,
  giftRush: defaultGiftRushProgress,
  unlockedStickers: [],
  stickerUnlockDates: {},
  clawMachine: {
    tutorialCompleted: false,
    practiceCompleted: false,
    wonPrizeIds: [],
    prizeQuantities: {},
    completedPuzzleLevels: [],
    selectedDifficulty: 'normal',
    selectedMode: 'practice',
    controlLayout: 'right',
    soundEnabled: false,
    musicEnabled: false,
    vibrationEnabled: true,
    classicLastPlayedDate: '',
    bestScore: 0,
    fastestSuccess: null,
    fewestAttempts: null,
  },
  mergeJoy: {
    tutorialCompleted: false,
    highestScore: 0,
    highestTier: 1,
    discoveries: {},
    bestCombo: 0,
    perfectDrops: 0,
    selectedMode: 'endless',
    soundEnabled: false,
    daily: {
      date: '',
      completed: false,
      medal: null,
      coinsClaimed: 0,
      challengeId: '',
    },
  },
  dailyStreak: {
    completionDates: [],
    rewardedMilestones: [],
  },
  dailyChallenge: {
    lastClaimedDate: '',
    claimedChallengeId: '',
  },
  records: {
    easy: {},
    normal: {},
    hard: {},
    clawMachine: {
      easy: {},
      normal: {},
      hard: {},
    },
  },
  settings: {
    soundEnabled: false,
    reduceMotion: false,
    tutorialCompleted: false,
  },
};

const cloneDefault = () => JSON.parse(JSON.stringify(defaultPlayroomProgress));

const normalizeMergeDiscoveries = (discoveries) => {
  if (!discoveries || typeof discoveries !== 'object') return {};
  return Object.fromEntries(
    Object.entries(discoveries)
      .filter(([tier]) => Number(tier) >= 1 && Number(tier) <= 11)
      .map(([tier, discovery]) => [
        tier,
        {
          firstDate: typeof discovery?.firstDate === 'string' ? discovery.firstDate : '',
          count: Math.max(0, Number(discovery?.count) || 0),
        },
      ])
  );
};

export const normalizePlayroomProgress = (value) => {
  const base = cloneDefault();
  if (!value || typeof value !== 'object') return base;

  return {
    ...base,
    ...value,
    version: PLAYROOM_STORAGE_VERSION,
    giftRush: normalizeGiftRushProgress(value.giftRush),
    coins: Math.max(0, Number(value.coins) || 0),
    unlockedStickers: Array.isArray(value.unlockedStickers) ? [...new Set(value.unlockedStickers)] : [],
    stickerUnlockDates:
      value.stickerUnlockDates && typeof value.stickerUnlockDates === 'object' ? value.stickerUnlockDates : {},
    dailyChallenge: {
      ...base.dailyChallenge,
      ...(value.dailyChallenge && typeof value.dailyChallenge === 'object' ? value.dailyChallenge : {}),
    },
    clawMachine: {
      ...base.clawMachine,
      ...(value.clawMachine && typeof value.clawMachine === 'object' ? value.clawMachine : {}),
      wonPrizeIds:
        value.clawMachine && Array.isArray(value.clawMachine.wonPrizeIds)
          ? [...new Set(value.clawMachine.wonPrizeIds)]
          : [],
      prizeQuantities:
        value.clawMachine && value.clawMachine.prizeQuantities && typeof value.clawMachine.prizeQuantities === 'object'
          ? Object.fromEntries(
              Object.entries(value.clawMachine.prizeQuantities).map(([key, amount]) => [
                key,
                Math.max(0, Number(amount) || 0),
              ])
            )
          : {},
      completedPuzzleLevels:
        value.clawMachine && Array.isArray(value.clawMachine.completedPuzzleLevels)
          ? [...new Set(value.clawMachine.completedPuzzleLevels)]
          : [],
      selectedDifficulty: ['easy', 'normal', 'hard'].includes(value.clawMachine?.selectedDifficulty)
        ? value.clawMachine.selectedDifficulty
        : base.clawMachine.selectedDifficulty,
      selectedMode: ['practice', 'classic'].includes(value.clawMachine?.selectedMode)
        ? value.clawMachine.selectedMode
        : base.clawMachine.selectedMode,
      controlLayout: ['left', 'right'].includes(value.clawMachine?.controlLayout)
        ? value.clawMachine.controlLayout
        : base.clawMachine.controlLayout,
      classicLastPlayedDate:
        typeof value.clawMachine?.classicLastPlayedDate === 'string'
          ? value.clawMachine.classicLastPlayedDate
          : base.clawMachine.classicLastPlayedDate,
    },
    mergeJoy: {
      ...base.mergeJoy,
      ...(value.mergeJoy && typeof value.mergeJoy === 'object' ? value.mergeJoy : {}),
      highestScore: Math.max(0, Number(value.mergeJoy?.highestScore) || 0),
      highestTier: Math.min(11, Math.max(1, Number(value.mergeJoy?.highestTier) || 1)),
      discoveries: normalizeMergeDiscoveries(value.mergeJoy?.discoveries),
      bestCombo: Math.max(0, Number(value.mergeJoy?.bestCombo) || 0),
      perfectDrops: Math.max(0, Number(value.mergeJoy?.perfectDrops) || 0),
      selectedMode: ['endless', 'daily'].includes(value.mergeJoy?.selectedMode)
        ? value.mergeJoy.selectedMode
        : base.mergeJoy.selectedMode,
      tutorialCompleted: Boolean(value.mergeJoy?.tutorialCompleted),
      soundEnabled: Boolean(value.mergeJoy?.soundEnabled),
      daily: {
        ...base.mergeJoy.daily,
        ...(value.mergeJoy?.daily && typeof value.mergeJoy.daily === 'object' ? value.mergeJoy.daily : {}),
        medal: ['bronze', 'silver', 'gold', 'perfect'].includes(value.mergeJoy?.daily?.medal)
          ? value.mergeJoy.daily.medal
          : null,
        coinsClaimed: Math.min(80, Math.max(0, Number(value.mergeJoy?.daily?.coinsClaimed) || 0)),
      },
    },
    dailyStreak: {
      completionDates: Array.isArray(value.dailyStreak?.completionDates)
        ? [...new Set(value.dailyStreak.completionDates.filter((date) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)))]
        : [],
      rewardedMilestones: Array.isArray(value.dailyStreak?.rewardedMilestones)
        ? [...new Set(value.dailyStreak.rewardedMilestones.filter((milestone) => typeof milestone === 'string'))]
        : [],
    },
    records: {
      ...base.records,
      ...(value.records && typeof value.records === 'object' ? value.records : {}),
      clawMachine: {
        ...base.records.clawMachine,
        ...(value.records?.clawMachine && typeof value.records.clawMachine === 'object' ? value.records.clawMachine : {}),
      },
    },
    settings: {
      ...base.settings,
      ...(value.settings && typeof value.settings === 'object' ? value.settings : {}),
    },
  };
};

export const loadPlayroomProgress = () => {
  if (typeof window === 'undefined') return cloneDefault();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefault();
    return normalizePlayroomProgress(JSON.parse(raw));
  } catch (error) {
    console.warn('Recovering Playroom progress after invalid storage data.', error);
    return cloneDefault();
  }
};

export const savePlayroomProgress = (progress) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizePlayroomProgress(progress)));
};

export const resetPlayroomProgress = () => {
  const next = cloneDefault();
  savePlayroomProgress(next);
  return next;
};

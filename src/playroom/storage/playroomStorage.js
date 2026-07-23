const STORAGE_KEY = 'ashlife-playroom-v1';

export const PLAYROOM_STORAGE_VERSION = 1;

export const defaultPlayroomProgress = {
  version: PLAYROOM_STORAGE_VERSION,
  coins: 0,
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
    bestScore: 0,
    fastestSuccess: null,
    fewestAttempts: null,
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

export const normalizePlayroomProgress = (value) => {
  const base = cloneDefault();
  if (!value || typeof value !== 'object') return base;

  return {
    ...base,
    ...value,
    version: PLAYROOM_STORAGE_VERSION,
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

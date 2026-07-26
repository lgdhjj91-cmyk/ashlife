export const TURN_DURATION_MS = 10_000;

export const getTurnSecondsRemaining = ({ now, deadline }) =>
  Math.max(0, Math.min(10, Math.ceil((deadline - now) / 1000)));

export const shouldAutoDrop = ({ state, now, deadline, autoDropTriggered }) =>
  ['READY', 'AIMING'].includes(state) &&
  !autoDropTriggered &&
  Number.isFinite(deadline) &&
  deadline > 0 &&
  now >= deadline;

export const shouldEndClassicSession = ({ mode, attemptsRemaining, activePrize }) =>
  mode === 'classic' &&
  Number.isFinite(attemptsRemaining) &&
  attemptsRemaining <= 0 &&
  !activePrize;

export const appendSessionPrize = (entries, entry) => [...entries, entry];

export const summarizeSession = (entries) => ({
  prizeCount: entries.length,
  totalCoins: entries.reduce(
    (total, entry) => total + Math.max(0, Number(entry.reward?.coins) || 0),
    0
  ),
  entries,
});

export const getSessionControlLocks = ({ mode, attemptsUsed, sessionEnded }) => {
  const locked = mode === 'classic' && attemptsUsed > 0 && !sessionEnded;
  return {
    mode: locked,
    difficulty: locked,
    restart: locked,
  };
};

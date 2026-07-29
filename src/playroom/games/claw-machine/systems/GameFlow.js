export const formatAttemptsRemaining = (attemptsRemaining, unlimitedLabel = 'Unlimited') =>
  Number.isFinite(attemptsRemaining) ? attemptsRemaining : unlimitedLabel;

export const getLiftOutcomeState = ({ capturedPrize, attemptsRemaining }) => {
  if (capturedPrize) return 'SWINGING';
  return Number.isFinite(attemptsRemaining) && attemptsRemaining <= 0 ? 'FAILED' : 'AIMING';
};

export const getNextAttemptState = ({ mode, attemptsRemaining }) =>
  mode === 'classic' && Number.isFinite(attemptsRemaining) && attemptsRemaining <= 0
    ? 'FAILED'
    : 'AIMING';

export const getPauseTarget = ({ isPaused, currentState, previousState }) => {
  if (isPaused) {
    return {
      shouldPause: false,
      nextState: previousState || 'AIMING',
      previousState: previousState || 'AIMING',
    };
  }

  return {
    shouldPause: true,
    nextState: 'PAUSED',
    previousState: currentState === 'PAUSED' ? previousState || 'AIMING' : currentState,
  };
};

const trolleyBlockedStates = new Set(['PAUSED', 'SUCCESS', 'FAILED']);

export const canMoveTrolleyInState = (state) => !trolleyBlockedStates.has(state);

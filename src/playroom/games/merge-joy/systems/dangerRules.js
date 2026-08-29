export const DANGER_GRACE_MS = 2_000;
export const DANGER_ENTRY_DELAY_MS = 800;

export const isDangerousBody = ({ top, dangerY, ageMs = 0 }) =>
  top < dangerY && ageMs >= DANGER_ENTRY_DELAY_MS;

export const updateDangerState = ({ elapsedMs = 0, deltaMs = 0, hasDanger = false }) => {
  if (!hasDanger) return { elapsedMs: 0, warningLevel: 0, gameOver: false };
  const nextElapsed = Math.min(DANGER_GRACE_MS, elapsedMs + Math.max(0, deltaMs));
  return {
    elapsedMs: nextElapsed,
    warningLevel: nextElapsed >= DANGER_GRACE_MS ? 0 : nextElapsed >= 1_500 ? 1 : 2,
    gameOver: nextElapsed >= DANGER_GRACE_MS,
  };
};

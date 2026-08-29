export const DANGER_GRACE_MS = 2_500;

export const isDangerousBody = ({ top, dangerY, speed = 0, isSleeping = false }) =>
  top < dangerY && (isSleeping || speed <= 0.35);

export const updateDangerState = ({ elapsedMs = 0, deltaMs = 0, hasDanger = false }) => {
  if (!hasDanger) return { elapsedMs: 0, warningLevel: 0, gameOver: false };
  const nextElapsed = Math.min(DANGER_GRACE_MS, elapsedMs + Math.max(0, deltaMs));
  return {
    elapsedMs: nextElapsed,
    warningLevel: nextElapsed >= DANGER_GRACE_MS ? 0 : nextElapsed >= 1_500 ? 1 : 2,
    gameOver: nextElapsed >= DANGER_GRACE_MS,
  };
};

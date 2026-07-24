export const CLAW_MAX_VISUAL_TILT = 0.08;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const motionScaleByState = {
  READY: 0.3,
  AIMING: 0.4,
  DROPPING: 0.16,
  CLOSING: 0.12,
  LIFTING: 0.45,
  SWINGING: 1,
  RELEASED: 0.8,
  RESOLVING: 0.65,
};

export const getClawTiltTarget = ({
  anchorX,
  clawX,
  trolleyVelocity = 0,
  clawVelocityX = 0,
  state = 'READY',
}) => {
  const positionLag = (anchorX - clawX) * 0.003;
  const velocityLag = (trolleyVelocity - clawVelocityX) * 0.012;
  const stateScale = motionScaleByState[state] ?? 0.5;

  return clamp((positionLag + velocityLag) * stateScale, -CLAW_MAX_VISUAL_TILT, CLAW_MAX_VISUAL_TILT);
};

export const dampClawTilt = (current, target, deltaMs) => {
  if (deltaMs <= 0) return current;
  const interpolation = 1 - Math.exp(-deltaMs * 0.014);
  return clamp(
    current + (target - current) * interpolation,
    -CLAW_MAX_VISUAL_TILT,
    CLAW_MAX_VISUAL_TILT
  );
};

export const getClawCableEnd = ({ x, y }) => ({
  x,
  y: y - 51,
});

export const getClawTextureForState = (state) => {
  if (state === 'CLOSING') return 'claw-partial';
  if (state === 'LIFTING' || state === 'SWINGING') return 'claw-closed';
  return 'claw-open';
};

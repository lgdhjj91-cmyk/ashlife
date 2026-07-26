export const buildCaptureRegion = (clawPosition, mouthWidth = 92) => {
  const centerX = Math.round(clawPosition.x);
  const centerY = Math.round(clawPosition.y + 56);
  return {
    left: Math.round(centerX - mouthWidth / 2),
    right: Math.round(centerX + mouthWidth / 2),
    top: Math.round(clawPosition.y + 16),
    bottom: Math.round(clawPosition.y + 96),
    centerX,
    centerY,
  };
};

export const getCaptureContactPoints = (region, prize) => {
  const prizeLeft = prize.x - prize.width / 2;
  const prizeRight = prize.x + prize.width / 2;
  const prizeTop = prize.y - prize.height / 2;
  const prizeBottom = prize.y + prize.height / 2;

  const overlapX = Math.max(0, Math.min(region.right, prizeRight) - Math.max(region.left, prizeLeft));
  const overlapY = Math.max(0, Math.min(region.bottom, prizeBottom) - Math.max(region.top, prizeTop));
  if (!overlapX || !overlapY) return 0;

  const overlapRatio = (overlapX * overlapY) / Math.max(1, prize.width * prize.height);
  const centered = Math.abs(prize.x - region.centerX) < prize.width * 0.28;
  if (overlapRatio > 0.45 && centered) return 3;
  if (overlapRatio > 0.22) return 2;
  return 1;
};

export const mapGripScoreToState = ({ score, hookable }) => {
  if (hookable && score >= 0.74) return 'hooked';
  if (score >= 0.7) return 'secure';
  if (score >= 0.5) return 'unstable';
  if (score >= 0.3) return 'weak';
  return 'missed';
};

export const isPrizeInWinZone = (position, hole) => {
  const belowRim = position.y > hole.rimY + 12;
  const insideX = Math.abs(position.x - hole.x) <= hole.sensorWidth / 2;
  const insideY = position.y <= hole.rimY + hole.sensorHeight;
  return belowRim && insideX && insideY;
};

export const getEffectiveHoleSensorWidth = ({ holeWidth, sensorWidth }) =>
  Math.max(sensorWidth, holeWidth - 8);

export const getPrizeHoleSensorZone = ({ x, rimY, width }) => ({
  x,
  y: rimY + 105,
  width,
  height: 140,
});

export const getPrizeChuteOpening = ({ x, rimOffset, rimWidth }) => {
  const halfRim = rimWidth / 2;
  const left = x - rimOffset + halfRim;
  const right = x + rimOffset - halfRim;

  return {
    left,
    right,
    width: right - left,
  };
};

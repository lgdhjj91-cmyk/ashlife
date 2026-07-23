const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export const gripLabels = {
  missed: 'Missed',
  weak: 'Weak Grip',
  unstable: 'Unstable Grip',
  secure: 'Secure Grip',
  hooked: 'Hooked!',
};

export const getGripLabel = (state) => gripLabels[state] || gripLabels.missed;

export const evaluateGripQuality = ({ claw, prize, contactPoints = 0 }) => {
  if (!claw || !prize) {
    return { state: 'missed', score: 0, slipRisk: 1 };
  }

  const distanceX = Math.abs((claw.x || 0) - (prize.x || 0));
  const distanceY = Math.abs((claw.y || 0) - (prize.y || 0));
  const captureRadius = Math.max(54, Math.min(112, (prize.width + prize.height) * 0.5));
  const distanceScore = clamp(1 - Math.hypot(distanceX, distanceY * 0.55) / captureRadius);
  const contactScore = clamp(contactPoints / 3);
  const massPenalty = clamp((Number(prize.mass) || 1) / 2.2) * 0.22;
  const difficultyPenalty = clamp(Number(prize.gripDifficulty) || 0) * 0.34;
  const motionPenalty =
    clamp(Math.abs(Number(claw.velocityX) || 0) / 5) * 0.12 + clamp(Math.abs(Number(prize.velocityX) || 0) / 5) * 0.08;
  const shapeBonus = prize.shape === 'rounded' || prize.shape === 'plush' ? 0.08 : prize.shape === 'flat' ? -0.12 : 0;
  const hookBonus = prize.hookable && distanceScore > 0.72 ? 0.22 : 0;

  const score = clamp(
    distanceScore * 0.58 + contactScore * 0.36 + shapeBonus + hookBonus - massPenalty - difficultyPenalty - motionPenalty
  );
  const slipRisk = clamp(1 - score + massPenalty + motionPenalty - hookBonus * 0.45);

  let state = 'missed';
  if (prize.hookable && score >= 0.74) state = 'hooked';
  else if (score >= 0.7) state = 'secure';
  else if (score >= 0.5) state = 'unstable';
  else if (score >= 0.3) state = 'weak';

  return {
    state,
    score: Number(score.toFixed(3)),
    slipRisk: Number(slipRisk.toFixed(3)),
  };
};

export const shouldGripSlip = ({ grip, swingPower = 0, impactSpeed = 0, prizeAngle = 0, directionChange = 0 }) => {
  if (!grip || grip.state === 'hooked') return false;
  if (grip.state === 'missed' || grip.state === 'weak') return true;

  const stress =
    clamp(swingPower / 100) * 0.38 +
    clamp(impactSpeed / 10) * 0.28 +
    clamp(Math.abs(prizeAngle) / 70) * 0.22 +
    clamp(directionChange / 8) * 0.18;

  return stress > 1 - grip.slipRisk * 0.62;
};

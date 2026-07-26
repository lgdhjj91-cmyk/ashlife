const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const getCapturedPrizeDistance = (prize) =>
  clamp(Math.round(104 + prize.height / 2), 134, 160);

export const getWonPrizeShelfLayout = (count) => {
  const visibleCount = clamp(count, 0, 5);
  const gap = 72;
  const centerX = 520;
  const startX = centerX - ((visibleCount - 1) * gap) / 2;

  return Array.from({ length: visibleCount }, (_, index) => ({
    x: startX + index * gap,
    y: 684,
  }));
};

export const getWonPrizeDisplaySize = (prize, maxSize = 58) => {
  if (prize.width >= prize.height) {
    return {
      width: maxSize,
      height: Math.round((maxSize * prize.height) / prize.width),
    };
  }

  return {
    width: Math.round((maxSize * prize.width) / prize.height),
    height: maxSize,
  };
};

export const isReleasedPrizeCandidate = (releasedBody, candidateBody) =>
  Boolean(releasedBody) && releasedBody === candidateBody;

export const isCollectiblePrize = ({ isWon, inWinZone }) => !isWon && inWinZone;

export const getWonPrizeTransition = ({ holeX, holeY }) => ({
  sink: {
    x: holeX,
    y: holeY + 52,
    duration: 420,
  },
  reveal: {
    x: holeX,
    y: holeY + 70,
    delay: 120,
    duration: 760,
  },
  modalDelay: 1340,
});

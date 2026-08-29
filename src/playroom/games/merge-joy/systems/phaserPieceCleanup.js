export const destroyMatterPieceSafely = (tweens, piece) => {
  if (!piece) return;
  tweens.killTweensOf(piece);
  piece.destroy();
};


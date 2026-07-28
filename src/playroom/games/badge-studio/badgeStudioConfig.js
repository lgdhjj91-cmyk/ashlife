export const badgeConfig = Object.freeze({
  productSizeMm: 58,
  artworkDiameterMm: 70,
  safeAreaDiameterMm: 54,
  printDpi: 300,
  maxImages: 20,
  maxImageBytes: 15_000_000,
  maxQuantityPerDesign: 20,
  maxTotalBadges: 64,
  maxSubmissionFileBytes: 25_000_000,
});

export const a4Config = Object.freeze({
  widthMm: 210,
  heightMm: 297,
  slotsPerSheet: 8,
  showCutOutlines: true,
  slots: [
    { xMm: 52.5, yMm: 43.5 },
    { xMm: 157.5, yMm: 43.5 },
    { xMm: 52.5, yMm: 113.5 },
    { xMm: 157.5, yMm: 113.5 },
    { xMm: 52.5, yMm: 183.5 },
    { xMm: 157.5, yMm: 183.5 },
    { xMm: 52.5, yMm: 253.5 },
    { xMm: 157.5, yMm: 253.5 },
  ],
});

export const allowedImageTypes = Object.freeze({
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
});

export const studioSteps = Object.freeze([
  { id: 'upload', label: 'Upload' },
  { id: 'customize', label: 'Customize' },
  { id: 'arrange', label: 'Arrange' },
  { id: 'details', label: 'Details' },
  { id: 'finish', label: 'Finish' },
]);

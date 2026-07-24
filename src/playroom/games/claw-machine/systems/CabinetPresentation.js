export const cabinetForegroundCrops = [
  {
    id: 'joystick',
    x: 145,
    y: 800,
    width: 190,
    height: 235,
    depth: 19,
  },
];

export const joystickPrizeGuard = {
  x: 250,
  y: 555,
  width: 18,
  height: 110,
};

export const getCabinetCropPlacement = ({
  crop,
  sourceWidth,
  sourceHeight,
  displayWidth,
  displayHeight,
}) => {
  const scaleX = displayWidth / sourceWidth;
  const scaleY = displayHeight / sourceHeight;

  return {
    x: Math.round(crop.x * scaleX),
    y: Math.round(crop.y * scaleY),
    scaleX,
    scaleY,
  };
};

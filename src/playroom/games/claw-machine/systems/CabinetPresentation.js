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

export const getJoystickForegroundMaskPlacement = ({ x, y, scaleX, scaleY }) => {
  const uniformScale = Math.min(scaleX, scaleY);
  return {
    knob: {
      x: x + 104 * scaleX,
      y: y + 87 * scaleY,
      radius: 54 * uniformScale,
    },
    stem: {
      x: x + 82 * scaleX,
      y: y + 126 * scaleY,
      width: 46 * scaleX,
      height: 80 * scaleY,
      radius: 12 * uniformScale,
    },
    base: {
      x: x + 104 * scaleX,
      y: y + 200 * scaleY,
      width: 142 * scaleX,
      height: 66 * scaleY,
    },
  };
};

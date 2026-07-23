export const machineConfig = {
  width: 1000,
  height: 760,
  playArea: {
    x: 150,
    y: 205,
    width: 716,
    height: 405,
  },
  trolley: {
    minX: 230,
    maxX: 760,
    y: 205,
  },
  claw: {
    width: 70,
    height: 58,
    dropSpeed: 4.4,
    liftSpeed: 4.8,
  },
  hole: {
    x: 804,
    y: 600,
    height: 52,
  },
};

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

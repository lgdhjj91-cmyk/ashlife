import { clamp, machineConfig } from '../data/machineConfig.js';

const SPAWN_LEFT = machineConfig.playArea.x + 70;
const SPAWN_RIGHT = machineConfig.hole.x - 88;
const SPAWN_TOP = machineConfig.playArea.y + 175;
const SPAWN_BOTTOM = machineConfig.hole.y + 10;

const prizeSlots = [
  { x: 285, y: 455 },
  { x: 355, y: 438 },
  { x: 425, y: 465 },
  { x: 495, y: 435 },
  { x: 565, y: 462 },
  { x: 635, y: 442 },
  { x: 285, y: 558 },
  { x: 350, y: 540 },
  { x: 415, y: 565 },
  { x: 480, y: 545 },
  { x: 545, y: 565 },
  { x: 610, y: 542 },
  { x: 675, y: 558 },
];

const createSeededRandom = (seed) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = (items, random) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
};

export const isPrizeSpawnSafe = ({ x, y, width, height }) => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  return (
    x - halfWidth >= SPAWN_LEFT &&
    x + halfWidth <= SPAWN_RIGHT &&
    y - halfHeight >= SPAWN_TOP &&
    y + halfHeight <= SPAWN_BOTTOM
  );
};

export const createRandomPrizeLayout = ({ prizes, seed }) => {
  const random = createSeededRandom(seed);
  const shuffledPrizes = shuffle(prizes, random);
  const shuffledSlots = shuffle(prizeSlots, random);

  return shuffledPrizes.map((prize, index) => {
    const slot = shuffledSlots[index % shuffledSlots.length];
    const minX = SPAWN_LEFT + prize.width / 2;
    const maxX = SPAWN_RIGHT - prize.width / 2;
    const minY = SPAWN_TOP + prize.height / 2;
    const maxY = SPAWN_BOTTOM - prize.height / 2;
    const x = Math.round(clamp(slot.x + (random() - 0.5) * 38, minX, maxX));
    const y = Math.round(clamp(slot.y + (random() - 0.5) * 28, minY, maxY));
    const rotation = Number(((random() - 0.5) * 0.28).toFixed(3));
    return [prize.id, x, y, rotation];
  });
};

const MODULUS = 2_147_483_647;
const MULTIPLIER = 48_271;
const SPAWN_POOL = [1, 1, 1, 2, 2, 3, 3, 4, 5];
const TEST_SEQUENCE = [1, 1, 1, 1, 2, 2, 3, 3, 4, 4];

const hashSeed = (seed) => {
  const value = String(seed).split('').reduce((total, character) => (total + character.charCodeAt(0)) % MODULUS, 0);
  return value || 1;
};

export const createSeededRandom = (seed) => {
  let state = hashSeed(seed);
  return () => {
    state = (state * MULTIPLIER) % MODULUS;
    return state / MODULUS;
  };
};

export const createPieceSequence = (seed, { count = 256, testMode = false } = {}) => {
  if (testMode) return Array.from({ length: count }, (_, index) => TEST_SEQUENCE[index % TEST_SEQUENCE.length]);
  const random = createSeededRandom(seed);
  return Array.from({ length: count }, () => SPAWN_POOL[Math.floor(random() * SPAWN_POOL.length)]);
};

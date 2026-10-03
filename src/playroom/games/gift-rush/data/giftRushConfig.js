export const products = [
  ['bear-notebook', 'Bear Notebook'],
  ['bunny-pencil-case', 'Bunny Pencil Case'],
  ['bear-heart', 'Heart Keychain'],
  ['bubble-tea-keychain', 'Bubble Tea Keychain'],
  ['paw-squishy', 'Paw Squishy'],
  ['kawaii-washi-tape', 'Kawaii Washi Tape'],
].map(([id, name]) => ({ id, name, imagePath: 'assets/game/stickers/' + id + '.webp' }));

export const customers = ['bunny', 'bear', 'chick'].map(id => ({
  id,
  imagePath: 'assets/playroom/gift-rush/customers/customer-atlas.webp',
}));
export const wraps = [
  { id: 'pink-hearts', symbol: '♥' },
  { id: 'lavender-stars', symbol: '★' },
  { id: 'mint-dots', symbol: '●' },
];
export const phases = [
  { startsAt: 0, capacity: 1, items: 2, patienceMs: 25000, arrivalMs: 8000 },
  { startsAt: 20000, capacity: 2, items: 2, patienceMs: 22000, arrivalMs: 6000 },
  { startsAt: 50000, capacity: 3, items: 3, patienceMs: 20000, arrivalMs: 5000 },
];
export const giftRushConfig = { roundMs: 90000, wrongPenaltyMs: 3000, trayCapacity: 3, products, customers, wraps, phases };
export const getPhase = elapsedMs => phases.findLast(phase => elapsedMs >= phase.startsAt) || phases[0];
export const productById = new Map(products.map(product => [product.id, product]));

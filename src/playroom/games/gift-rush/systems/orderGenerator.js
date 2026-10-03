import { products, customers, wraps, getPhase } from '../data/giftRushConfig.js';

export const createOrderGenerator = seed => ({
  rngState: [...String(seed)].reduce((hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261),
  orderIndex: 0,
});
export const generateOrder = (generator, { elapsedMs }) => {
  let rngState = generator.rngState;
  const pick = list => {
    rngState = (Math.imul(rngState, 1664525) + 1013904223) >>> 0;
    return list[Math.floor((rngState / 4294967296) * list.length)];
  };
  const phase = getPhase(elapsedMs);
  const customerId = pick(customers).id;
  const items = [];
  while (items.length < phase.items) {
    const eligible = products.filter(product =>
      phase.items === 2 ? !items.includes(product.id) : items.filter(id => id === product.id).length < 2);
    items.push(pick(eligible).id);
  }
  const wrapId = pick(wraps).id;
  return {
    generator: { rngState, orderIndex: generator.orderIndex + 1 },
    order: {
      id: 'order-' + generator.orderIndex, customerId, items, wrapId,
      initialPatienceMs: phase.patienceMs, remainingPatienceMs: phase.patienceMs,
      failedAttempts: 0, tray: { items: [], wrapId: null },
    },
  };
};

import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrderGenerator, generateOrder } from './orderGenerator.js';
import { products, customers, wraps } from '../data/giftRushConfig.js';

const sequence = (seed, elapsedMs) => {
  let generator = createOrderGenerator(seed);
  return Array.from({ length: 30 }, () => {
    const generated = generateOrder(generator, { elapsedMs });
    generator = generated.generator;
    return generated.order;
  });
};
test('seeded customer content is repeatable and generators carry serializable state', () => {
  assert.deepEqual(sequence('daily-a', 0), sequence('daily-a', 0));
  assert.notDeepEqual(sequence('daily-a', 0), sequence('daily-b', 0));
  let generator = createOrderGenerator('daily-a');
  generator = generateOrder(generator, { elapsedMs: 0 }).generator;
  assert.deepEqual(generateOrder(generator, { elapsedMs: 50000 }), generateOrder(JSON.parse(JSON.stringify(generator)), { elapsedMs: 50000 }));
});
test('orders follow phase quantities and only reference known products and wrapping', () => {
  for (const [time, count, patience] of [[0, 2, 25000], [20000, 2, 22000], [50000, 3, 20000]]) {
    sequence('phase-test', time).forEach((order, index) => {
      assert.equal(order.id, 'order-' + index);
      assert.equal(order.items.length, count);
      assert.equal(order.initialPatienceMs, patience);
      assert.ok(order.items.every(id => products.some(product => product.id === id)));
      assert.ok(customers.some(customer => customer.id === order.customerId));
      assert.ok(wraps.some(wrap => wrap.id === order.wrapId));
      assert.ok(count === 3 ? new Set(order.items).size >= 2 : new Set(order.items).size === 2);
      assert.deepEqual(order.tray, { items: [], wrapId: null });
    });
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { validateParcel, calculateDeliveryScore } from './parcelRules.js';

const order = { items: ['bear-notebook', 'bear-notebook', 'bear-heart'], wrapId: 'lavender-stars' };
test('parcel matching checks quantities, extra items, and wrapping', () => {
  assert.deepEqual(validateParcel(order, { items: ['bear-heart', 'bear-notebook', 'bear-notebook'], wrapId: 'lavender-stars' }), { valid: true, reason: null });
  assert.equal(validateParcel(order, { items: ['bear-notebook', 'bear-heart'], wrapId: 'lavender-stars' }).reason, 'items');
  assert.equal(validateParcel(order, { items: [...order.items, 'paw-squishy'], wrapId: order.wrapId }).valid, false);
  assert.equal(validateParcel(order, { items: order.items, wrapId: 'mint-dots' }).reason, 'wrap');
  assert.equal(validateParcel(order, null).valid, false);
});
test('speed points round down and consecutive perfect deliveries increase the multiplier', () => {
  assert.deepEqual(calculateDeliveryScore({ remainingPatienceMs: 12500, initialPatienceMs: 25000, priorCombo: 1, perfect: true }), { points: 156, combo: 2, multiplier: 1.25 });
  assert.deepEqual(calculateDeliveryScore({ remainingPatienceMs: 25000, initialPatienceMs: 25000, priorCombo: 30, perfect: true }), { points: 450, combo: 31, multiplier: 3 });
  assert.deepEqual(calculateDeliveryScore({ remainingPatienceMs: 0, initialPatienceMs: 25000, priorCombo: 7, perfect: false }), { points: 100, combo: 0, multiplier: 1 });
});

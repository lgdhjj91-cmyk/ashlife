import test from 'node:test';
import assert from 'node:assert/strict';
import { createGiftRushRound, advanceGiftRushRound, reduceGiftRushAction } from './giftRushEngine.js';

const action = (state, type, payload = {}) => reduceGiftRushAction(state, { sessionId: state.sessionId, type, ...payload });
const start = () => action(createGiftRushRound({ sessionId: 'round-1', mode: 'daily', dateKey: '2026-10-03', seed: 'daily-a' }), 'START');
const pack = (state, order = state.orders[0]) => {
  for (const productId of order.items) state = action(state, 'ADD_ITEM', { orderId: order.id, productId });
  state = action(state, 'SELECT_WRAP', { orderId: order.id, wrapId: order.wrapId });
  return action(state, 'PACK', { orderId: order.id });
};
test('spawn deadlines reset at phase boundaries and full counters do not consume content', () => {
  let state = start();
  assert.equal(state.orders.length, 1);
  state = advanceGiftRushRound(state, 16000);
  assert.equal(state.orderIndex, 1);
  state = advanceGiftRushRound(state, 4000);
  assert.equal(state.nextArrivalMs, 26000);
  state = advanceGiftRushRound(state, 6000);
  assert.equal(state.orders.length, 1);
  assert.equal(state.orders[0].id, 'order-1');
  assert.equal(state.orders[0].initialPatienceMs, 22000);
  state = advanceGiftRushRound(state, 24000);
  assert.equal(state.nextArrivalMs, 55000);
});
test('large frame advances match smaller steps and paused time does not accumulate', () => {
  const large = advanceGiftRushRound(start(), 90000);
  let small = start();
  for (let index = 0; index < 900; index++) small = advanceGiftRushRound(small, 100);
  assert.deepEqual(large, small);
  const paused = action(start(), 'PAUSE');
  assert.deepEqual(advanceGiftRushRound(paused, 50000), paused);
  assert.equal(action(paused, 'RESUME').status, 'running');
  assert.equal(large.elapsedMs, 90000);
  assert.equal(large.result.dateKey, '2026-10-03');
  assert.equal(large.stats.expiredOrders + large.stats.unfinishedOrders, large.orderIndex);
});
test('valid orders pay once and wrong attempts lose patience but can be corrected', () => {
  let state = start();
  const order = state.orders[0];
  state = action(state, 'PACK', { orderId: order.id });
  assert.equal(state.orders[0].remainingPatienceMs, 22000);
  assert.equal(state.stats.failedPackAttempts, 1);
  state = pack(state);
  assert.equal(state.stats.servedOrders, 1);
  assert.equal(state.stats.perfectOrders, 0);
  assert.equal(state.stats.score, 144);
  assert.deepEqual(action(state, 'PACK', { orderId: order.id }), state);
});
test('trays are independent, bounded, removable, and stale actions are ignored', () => {
  let state = advanceGiftRushRound(start(), 32000);
  assert.equal(state.orders.length, 2);
  const [first, second] = state.orders;
  state = action(state, 'ADD_ITEM', { orderId: first.id, productId: 'bear-notebook' });
  state = action(state, 'SELECT_ORDER', { orderId: second.id });
  assert.equal(state.orders[0].tray.items.length, 1);
  assert.equal(state.orders[1].tray.items.length, 0);
  for (let i = 0; i < 5; i++) state = action(state, 'ADD_ITEM', { orderId: first.id, productId: 'bear-heart' });
  assert.equal(state.orders[0].tray.items.length, 3);
  state = action(state, 'REMOVE_ITEM', { orderId: first.id, slotIndex: 0 });
  assert.equal(state.orders[0].tray.items.length, 2);
  const unchanged = reduceGiftRushAction(state, { sessionId: 'old', type: 'PACK', orderId: first.id });
  assert.deepEqual(unchanged, state);
  assert.deepEqual(action(state, 'ADD_ITEM', { orderId: first.id, productId: 'unknown' }), state);
  assert.deepEqual(action(state, 'SELECT_WRAP', { orderId: first.id, wrapId: 'unknown' }), state);
  assert.deepEqual(action(state, 'REMOVE_ITEM', { orderId: first.id, slotIndex: -1 }), state);
  state = action(state, 'CLEAR_TRAY', { orderId: first.id });
  assert.deepEqual(state.orders[0].tray, { items: [], wrapId: null });
});
test('expiry wins over Pack and a wrong attempt can immediately expire an order', () => {
  let state = advanceGiftRushRound(start(), 24000);
  const orderId = state.orders[0].id;
  state = action(state, 'PACK', { orderId });
  assert.equal(state.orders.length, 0);
  assert.equal(state.stats.expiredOrders, 1);
  let boundary = advanceGiftRushRound(start(), 25000);
  boundary = action(boundary, 'PACK', { orderId: 'order-0' });
  assert.equal(boundary.stats.servedOrders, 0);
  assert.equal(boundary.stats.expiredOrders, 1);
});
test('round end rejects further input and does not expire unfinished customers', () => {
  const state = advanceGiftRushRound(start(), 90000);
  assert.equal(state.status, 'finished');
  assert.deepEqual(advanceGiftRushRound(state, 1000), state);
  assert.deepEqual(action(state, 'PACK', { orderId: state.orders[0]?.id }), state);
  assert.deepEqual(advanceGiftRushRound(start(), NaN), start());
});

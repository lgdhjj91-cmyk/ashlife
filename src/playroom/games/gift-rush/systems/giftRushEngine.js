import { giftRushConfig, getPhase, phases, productById, wraps } from '../data/giftRushConfig.js';
import { createOrderGenerator, generateOrder } from './orderGenerator.js';
import { calculateDeliveryScore, validateParcel } from './parcelRules.js';
import { getGiftRushDailyChallenge } from '../data/dailyChallenges.js';

export const createGiftRushRound = ({ sessionId, mode, dateKey, seed }) => ({
  sessionId, mode, dateKey, seed, ...createOrderGenerator(seed), status: 'idle',
  elapsedMs: 0, nextArrivalMs: 0, orders: [], selectedOrderId: null,
  stats: { score: 0, servedOrders: 0, perfectOrders: 0, failedPackAttempts: 0, expiredOrders: 0, unfinishedOrders: 0, combo: 0, maxCombo: 0 },
  result: null, lastEvent: null, eventIndex: 0,
});
const cloneState = state => ({
  ...state, stats: { ...state.stats },
  orders: state.orders.map(order => ({ ...order, tray: { ...order.tray, items: [...order.tray.items] } })),
});
const event = (state, type, order, extra = {}) => {
  state.lastEvent = { id: ++state.eventIndex, type, customerId: order?.customerId, atMs: state.elapsedMs, ...extra };
};
const selectRemaining = state => {
  if (!state.orders.some(order => order.id === state.selectedOrderId)) state.selectedOrderId = state.orders[0]?.id || null;
};
const expireOrders = state => {
  const expired = state.orders.filter(order => order.remainingPatienceMs <= 0);
  if (!expired.length) return;
  state.orders = state.orders.filter(order => order.remainingPatienceMs > 0);
  state.stats.expiredOrders += expired.length;
  state.stats.combo = 0;
  expired.forEach(order => event(state, 'expired', order));
  selectRemaining(state);
};
const spawn = state => {
  if (state.orders.length >= getPhase(state.elapsedMs).capacity) return;
  const generated = generateOrder({ rngState: state.rngState, orderIndex: state.orderIndex }, state);
  Object.assign(state, generated.generator);
  state.orders.push(generated.order);
  selectRemaining(state);
};
export const advanceGiftRushRound = (state, deltaMs) => {
  if (state.status !== 'running' || !Number.isFinite(deltaMs) || deltaMs <= 0) return state;
  const next = cloneState(state);
  const target = Math.min(giftRushConfig.roundMs, state.elapsedMs + deltaMs);
  while (next.elapsedMs < target) {
    const boundary = phases.find(phase => phase.startsAt > next.elapsedMs)?.startsAt ?? giftRushConfig.roundMs;
    const expiry = next.orders.reduce((deadline, order) => Math.min(deadline, next.elapsedMs + order.remainingPatienceMs), Infinity);
    const deadline = Math.min(target, boundary, expiry, next.nextArrivalMs, giftRushConfig.roundMs);
    const elapsed = deadline - next.elapsedMs;
    next.orders.forEach(order => { order.remainingPatienceMs -= elapsed; });
    next.elapsedMs = deadline;
    if (deadline >= giftRushConfig.roundMs) {
      next.status = 'finished';
      next.stats.unfinishedOrders = next.orders.length;
      next.result = {
        sessionId: next.sessionId, mode: next.mode, dateKey: next.dateKey,
        challengeId: getGiftRushDailyChallenge(next.dateKey).id, stats: { ...next.stats },
      };
      event(next, 'finished');
      break;
    }
    expireOrders(next);
    if (deadline === boundary) next.nextArrivalMs = deadline + getPhase(deadline).arrivalMs;
    if (deadline === next.nextArrivalMs) {
      spawn(next);
      next.nextArrivalMs += getPhase(deadline).arrivalMs;
    }
  }
  return next;
};
export const reduceGiftRushAction = (state, action) => {
  if (!action || action.sessionId !== state.sessionId) return state;
  if (action.type === 'START' && state.status === 'idle') {
    const next = cloneState(state);
    next.status = 'running';
    spawn(next);
    next.nextArrivalMs = getPhase(0).arrivalMs;
    return next;
  }
  if (action.type === 'PAUSE' && state.status === 'running') return { ...state, status: 'paused' };
  if (action.type === 'RESUME' && state.status === 'paused') return { ...state, status: 'running' };
  if (state.status !== 'running') return state;
  const index = state.orders.findIndex(order => order.id === action.orderId);
  if (index < 0 || state.orders[index].remainingPatienceMs <= 0) return state;
  if (action.type === 'ADD_ITEM' && (!productById.has(action.productId) || state.orders[index].tray.items.length >= giftRushConfig.trayCapacity)) return state;
  if (action.type === 'SELECT_WRAP' && !wraps.some(wrap => wrap.id === action.wrapId)) return state;
  if (action.type === 'REMOVE_ITEM' && (!Number.isInteger(action.slotIndex) || action.slotIndex < 0 || action.slotIndex >= state.orders[index].tray.items.length)) return state;
  if (!['SELECT_ORDER', 'ADD_ITEM', 'REMOVE_ITEM', 'CLEAR_TRAY', 'SELECT_WRAP', 'PACK'].includes(action.type)) return state;
  const next = cloneState(state);
  const order = next.orders[index];
  switch (action.type) {
    case 'SELECT_ORDER': next.selectedOrderId = order.id; break;
    case 'ADD_ITEM': order.tray.items.push(action.productId); event(next, 'item', order); break;
    case 'REMOVE_ITEM': order.tray.items.splice(action.slotIndex, 1); break;
    case 'CLEAR_TRAY': order.tray = { items: [], wrapId: null }; break;
    case 'SELECT_WRAP': order.tray.wrapId = action.wrapId; break;
    case 'PACK': {
      const validation = validateParcel(order, order.tray);
      if (!validation.valid) {
        order.remainingPatienceMs -= giftRushConfig.wrongPenaltyMs;
        order.failedAttempts++;
        next.stats.failedPackAttempts++;
        next.stats.combo = 0;
        event(next, 'wrong', order, { reason: validation.reason });
        expireOrders(next);
      } else {
        const perfect = order.failedAttempts === 0;
        const award = calculateDeliveryScore({ ...order, priorCombo: next.stats.combo, perfect });
        next.stats.score += award.points;
        next.stats.combo = award.combo;
        next.stats.maxCombo = Math.max(next.stats.maxCombo, award.combo);
        next.stats.servedOrders++;
        if (perfect) next.stats.perfectOrders++;
        next.orders.splice(index, 1);
        selectRemaining(next);
        event(next, 'delivered', order, { points: award.points, perfect });
      }
      break;
    }
  }
  return next;
};

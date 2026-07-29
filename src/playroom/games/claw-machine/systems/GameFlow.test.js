import test from 'node:test';
import assert from 'node:assert/strict';
import * as gameFlow from './GameFlow.js';

const {
  formatAttemptsRemaining,
  getLiftOutcomeState,
  getNextAttemptState,
  getPauseTarget,
} = gameFlow;

test('missed lift returns to aiming while attempts remain', () => {
  assert.equal(getLiftOutcomeState({ capturedPrize: null, attemptsRemaining: 2 }), 'AIMING');
});

test('missed lift fails only when classic attempts are exhausted', () => {
  assert.equal(getLiftOutcomeState({ capturedPrize: null, attemptsRemaining: 0 }), 'FAILED');
});

test('captured prize enters swinging after the lift completes', () => {
  assert.equal(getLiftOutcomeState({ capturedPrize: { id: 'bunny-plush' }, attemptsRemaining: 0 }), 'SWINGING');
});

test('only exhausted classic sessions enter a terminal failed state', () => {
  assert.equal(getNextAttemptState({ mode: 'classic', attemptsRemaining: 0 }), 'FAILED');
  assert.equal(getNextAttemptState({ mode: 'classic', attemptsRemaining: 1 }), 'AIMING');
  assert.equal(getNextAttemptState({ mode: 'practice', attemptsRemaining: 0 }), 'AIMING');
});

test('practice attempts render as an accessible label', () => {
  assert.equal(formatAttemptsRemaining(Infinity), 'Unlimited');
});

test('practice attempts can use the active language label', () => {
  assert.equal(formatAttemptsRemaining(Infinity, '无限'), '无限');
});

test('keyboard pause toggles between paused and the previous playable state', () => {
  assert.deepEqual(getPauseTarget({ isPaused: false, currentState: 'SWINGING' }), {
    shouldPause: true,
    nextState: 'PAUSED',
    previousState: 'SWINGING',
  });
  assert.deepEqual(getPauseTarget({ isPaused: true, previousState: 'SWINGING' }), {
    shouldPause: false,
    nextState: 'SWINGING',
    previousState: 'SWINGING',
  });
});

test('trolley input stays available throughout a non-terminal claw cycle', () => {
  const playableStates = [
    'READY',
    'AIMING',
    'DROPPING',
    'CLOSING',
    'LIFTING',
    'SWINGING',
    'RELEASED',
    'RESOLVING',
  ];

  playableStates.forEach((state) => {
    assert.equal(gameFlow.canMoveTrolleyInState(state), true, `${state} should accept trolley input`);
  });
});

test('trolley input stops only while paused or after the session ends', () => {
  ['PAUSED', 'SUCCESS', 'FAILED'].forEach((state) => {
    assert.equal(gameFlow.canMoveTrolleyInState(state), false, `${state} should block trolley input`);
  });
});

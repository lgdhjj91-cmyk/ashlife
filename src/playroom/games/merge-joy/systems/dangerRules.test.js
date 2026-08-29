import test from 'node:test';
import assert from 'node:assert/strict';
import { isDangerousBody, updateDangerState } from './dangerRules.js';

test('a fast bouncing piece above the line does not start danger time', () => {
  assert.equal(isDangerousBody({ top: 105, dangerY: 120, speed: 1.2, isSleeping: false }), false);
  assert.equal(isDangerousBody({ top: 105, dangerY: 120, speed: 0.2, isSleeping: false }), true);
  assert.equal(isDangerousBody({ top: 121, dangerY: 120, speed: 0, isSleeping: true }), false);
});

test('settled danger counts down for 2.5 seconds and resets when the pile clears', () => {
  const first = updateDangerState({ elapsedMs: 0, deltaMs: 1_000, hasDanger: true });
  assert.deepEqual(first, { elapsedMs: 1_000, warningLevel: 2, gameOver: false });
  const second = updateDangerState({ ...first, deltaMs: 1_499, hasDanger: true });
  assert.deepEqual(second, { elapsedMs: 2_499, warningLevel: 1, gameOver: false });
  assert.deepEqual(updateDangerState({ ...second, deltaMs: 1, hasDanger: true }), {
    elapsedMs: 2_500,
    warningLevel: 0,
    gameOver: true,
  });
  assert.deepEqual(updateDangerState({ ...second, deltaMs: 16, hasDanger: false }), {
    elapsedMs: 0,
    warningLevel: 0,
    gameOver: false,
  });
});

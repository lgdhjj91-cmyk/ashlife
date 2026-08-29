import test from 'node:test';
import assert from 'node:assert/strict';
import { isDangerousBody, updateDangerState } from './dangerRules.js';

test('an old piece above the line stays dangerous even while the pile jitters', () => {
  assert.equal(isDangerousBody({ top: 105, dangerY: 120, ageMs: 799 }), false);
  assert.equal(isDangerousBody({ top: 105, dangerY: 120, ageMs: 800 }), true);
  assert.equal(isDangerousBody({ top: 121, dangerY: 120, ageMs: 5_000 }), false);
});

test('confirmed overflow ends the round after two seconds and resets when the pile clears', () => {
  const first = updateDangerState({ elapsedMs: 0, deltaMs: 1_000, hasDanger: true });
  assert.deepEqual(first, { elapsedMs: 1_000, warningLevel: 2, gameOver: false });
  const second = updateDangerState({ ...first, deltaMs: 999, hasDanger: true });
  assert.deepEqual(second, { elapsedMs: 1_999, warningLevel: 1, gameOver: false });
  assert.deepEqual(updateDangerState({ ...second, deltaMs: 1, hasDanger: true }), {
    elapsedMs: 2_000,
    warningLevel: 0,
    gameOver: true,
  });
  assert.deepEqual(updateDangerState({ ...second, deltaMs: 16, hasDanger: false }), {
    elapsedMs: 0,
    warningLevel: 0,
    gameOver: false,
  });
});

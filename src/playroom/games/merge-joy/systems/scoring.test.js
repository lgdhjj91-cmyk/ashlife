import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMergeAward, getComboCount } from './scoring.js';

test('merge score increases by tier and applies the configured combo multiplier', () => {
  assert.deepEqual(calculateMergeAward({ sourceTier: 1, comboCount: 1, perfectDrop: false }), {
    base: 10,
    comboBonus: 0,
    perfectBonus: 0,
    total: 10,
  });
  assert.deepEqual(calculateMergeAward({ sourceTier: 3, comboCount: 3, perfectDrop: false }), {
    base: 40,
    comboBonus: 50,
    perfectBonus: 0,
    total: 90,
  });
});

test('Perfect Drop adds a separate one hundred point skill bonus', () => {
  assert.equal(calculateMergeAward({ sourceTier: 1, comboCount: 1, perfectDrop: true }).total, 110);
});

test('combo count advances only inside the 1.8 second window', () => {
  assert.equal(getComboCount({ previousCount: 2, previousMergeAt: 1_000, now: 2_700 }), 3);
  assert.equal(getComboCount({ previousCount: 4, previousMergeAt: 1_000, now: 2_801 }), 1);
});

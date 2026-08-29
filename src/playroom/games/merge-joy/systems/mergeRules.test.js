import test from 'node:test';
import assert from 'node:assert/strict';
import { canMerge, lockMergePair } from './mergeRules.js';

test('only distinct unlocked pieces at the same non-final tier may merge', () => {
  assert.equal(canMerge({ id: 1, tier: 3 }, { id: 2, tier: 3 }), true);
  assert.equal(canMerge({ id: 1, tier: 3 }, { id: 2, tier: 4 }), false);
  assert.equal(canMerge({ id: 1, tier: 3 }, { id: 1, tier: 3 }), false);
  assert.equal(canMerge({ id: 1, tier: 11 }, { id: 2, tier: 11 }), false);
  assert.equal(canMerge({ id: 1, tier: 3, merging: true }, { id: 2, tier: 3 }), false);
});

test('a contact pair can be locked only once regardless of contact order', () => {
  const locks = new Set();
  assert.equal(lockMergePair(locks, { id: 8 }, { id: 3 }), '3:8');
  assert.equal(lockMergePair(locks, { id: 3 }, { id: 8 }), null);
  assert.equal(locks.size, 1);
});

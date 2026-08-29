import test from 'node:test';
import assert from 'node:assert/strict';
import { createPieceSequence } from './seededRandom.js';

test('one local date always produces the same bounded lower-tier sequence', () => {
  assert.deepEqual(createPieceSequence('2026-08-29', { count: 10 }), [1, 3, 2, 2, 4, 2, 1, 1, 1, 5]);
  assert.deepEqual(createPieceSequence('2026-08-29', { count: 10 }), [1, 3, 2, 2, 4, 2, 1, 1, 1, 5]);
  assert.ok(createPieceSequence('2026-08-29', { count: 100 }).every((tier) => tier >= 1 && tier <= 5));
});

test('development test mode exposes a fixed merge-friendly opening', () => {
  assert.deepEqual(createPieceSequence('ignored', { count: 10, testMode: true }), [1, 1, 1, 1, 2, 2, 3, 3, 4, 4]);
});

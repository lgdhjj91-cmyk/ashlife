import assert from 'node:assert/strict';
import test from 'node:test';
import { destroyMatterPieceSafely } from './phaserPieceCleanup.js';

test('kills active tweens before destroying a Matter-backed piece', () => {
  const calls = [];
  const tweens = { killTweensOf: (piece) => calls.push(['kill', piece]) };
  const piece = { destroy: () => calls.push(['destroy']) };

  destroyMatterPieceSafely(tweens, piece);

  assert.deepEqual(calls, [['kill', piece], ['destroy']]);
});


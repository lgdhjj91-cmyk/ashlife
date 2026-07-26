import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCapturedPrizeDistance,
  getWonPrizeDisplaySize,
  getWonPrizeShelfLayout,
  getWonPrizeTransition,
  isCollectiblePrize,
} from './PrizePresentation.js';

test('captured prizes hang below the claw instead of hiding inside its head', () => {
  assert.equal(getCapturedPrizeDistance({ height: 92 }), 150);
  assert.equal(getCapturedPrizeDistance({ height: 58 }), 134);
  assert.equal(getCapturedPrizeDistance({ height: 140 }), 160);
});

test('won prizes form a centered ordered row away from the joystick and chute', () => {
  assert.deepEqual(getWonPrizeShelfLayout(3), [
    { x: 448, y: 684 },
    { x: 520, y: 684 },
    { x: 592, y: 684 },
  ]);
  assert.equal(getWonPrizeShelfLayout(8).length, 5);
});

test('won prize icons preserve their aspect ratio inside a 58 pixel slot', () => {
  assert.deepEqual(getWonPrizeDisplaySize({ width: 126, height: 58 }), { width: 58, height: 27 });
  assert.deepEqual(getWonPrizeDisplaySize({ width: 56, height: 84 }), { width: 39, height: 58 });
});

test('won prize transition visibly sinks into the chute before returning to the shelf', () => {
  assert.deepEqual(getWonPrizeTransition({ holeX: 804, holeY: 600 }), {
    sink: {
      x: 804,
      y: 652,
      duration: 420,
    },
    reveal: {
      x: 804,
      y: 670,
      delay: 120,
      duration: 760,
    },
    modalDelay: 1340,
  });
});

test('any unwon prize inside the chute can be awarded once', () => {
  assert.equal(
    isCollectiblePrize({ isWon: false, inWinZone: true, collectionWindowOpen: true }),
    true
  );
  assert.equal(
    isCollectiblePrize({ isWon: true, inWinZone: true, collectionWindowOpen: true }),
    false
  );
  assert.equal(
    isCollectiblePrize({ isWon: false, inWinZone: false, collectionWindowOpen: true }),
    false
  );
});

test('idle chute physics cannot award a prize before release', () => {
  assert.equal(
    isCollectiblePrize({ isWon: false, inWinZone: true, collectionWindowOpen: false }),
    false
  );
});

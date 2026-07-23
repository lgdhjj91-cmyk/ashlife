import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCaptureRegion,
  getCaptureContactPoints,
  isPrizeInWinZone,
  mapGripScoreToState,
} from './PhysicsRules.js';

test('capture region is aligned below the visual claw mouth', () => {
  const region = buildCaptureRegion({ x: 500, y: 330 }, 92);

  assert.deepEqual(region, {
    left: 454,
    right: 546,
    top: 346,
    bottom: 426,
    centerX: 500,
    centerY: 386,
  });
});

test('prize inside the claw mouth receives multiple contact points', () => {
  const region = buildCaptureRegion({ x: 500, y: 330 }, 92);

  assert.equal(getCaptureContactPoints(region, { x: 506, y: 386, width: 76, height: 86 }), 3);
  assert.equal(getCaptureContactPoints(region, { x: 548, y: 386, width: 76, height: 86 }), 2);
  assert.equal(getCaptureContactPoints(region, { x: 610, y: 386, width: 76, height: 86 }), 0);
});

test('grip score maps to stable non-random states', () => {
  assert.equal(mapGripScoreToState({ score: 0.2, hookable: false }), 'missed');
  assert.equal(mapGripScoreToState({ score: 0.36, hookable: false }), 'weak');
  assert.equal(mapGripScoreToState({ score: 0.58, hookable: false }), 'unstable');
  assert.equal(mapGripScoreToState({ score: 0.75, hookable: false }), 'secure');
  assert.equal(mapGripScoreToState({ score: 0.78, hookable: true }), 'hooked');
});

test('win zone requires prize center below the visible rim', () => {
  const hole = { x: 792, rimY: 588, sensorWidth: 108, sensorHeight: 92 };

  assert.equal(isPrizeInWinZone({ x: 792, y: 620 }, hole), true);
  assert.equal(isPrizeInWinZone({ x: 792, y: 584 }, hole), false);
  assert.equal(isPrizeInWinZone({ x: 720, y: 620 }, hole), false);
});

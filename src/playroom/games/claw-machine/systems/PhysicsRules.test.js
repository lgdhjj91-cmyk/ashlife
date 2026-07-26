import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCaptureRegion,
  getEffectiveHoleSensorWidth,
  getCaptureContactPoints,
  getPrizeHoleSensorZone,
  getPrizeChuteOpening,
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

test('the physical win sensor stays close to the visible chute opening', () => {
  assert.equal(getEffectiveHoleSensorWidth({ holeWidth: 150, sensorWidth: 116 }), 142);
  assert.equal(getEffectiveHoleSensorWidth({ holeWidth: 128, sensorWidth: 96 }), 120);
  assert.equal(getEffectiveHoleSensorWidth({ holeWidth: 108, sensorWidth: 78 }), 100);
});

test('the chute sensor starts below the rim so collision begins inside the valid win zone', () => {
  assert.deepEqual(getPrizeHoleSensorZone({ x: 804, rimY: 600, width: 120 }), {
    x: 804,
    y: 705,
    width: 120,
    height: 140,
  });
});

test('the chute floor leaves a full opening between both physical rims', () => {
  assert.deepEqual(getPrizeChuteOpening({ x: 804, rimOffset: 78, rimWidth: 26 }), {
    left: 739,
    right: 869,
    width: 130,
  });
});

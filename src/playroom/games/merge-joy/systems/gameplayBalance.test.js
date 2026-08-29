import assert from 'node:assert/strict';
import test from 'node:test';
import * as tierRules from '../data/mergeTiers.js';
import * as sceneRules from '../phaser/scenes/MergeJoyScene.js';

const { mergeTiers } = tierRules;

test('merged pieces return to the compact merge ladder size', () => {
  const boardWidth = 528;
  assert.ok(boardWidth / mergeTiers[0].diameter >= 9.5);
  assert.ok(mergeTiers.at(-1).diameter / boardWidth <= 0.52);
});

test('fresh drops stay larger than merged pieces', () => {
  assert.equal(typeof tierRules.getPieceDiameter, 'function');
  assert.deepEqual(mergeTiers.slice(0, 5).map((tier) => tierRules.getPieceDiameter(tier, true)), [83, 103, 130, 156, 186]);
  assert.deepEqual(mergeTiers.slice(0, 5).map((tier) => tierRules.getPieceDiameter(tier, false)), [53, 66, 83, 100, 119]);
});

test('a merge keeps settled pieces settled instead of launching them upward', () => {
  assert.equal(typeof sceneRules.getMergedVelocity, 'function');
  assert.deepEqual(sceneRules.getMergedVelocity({ x: 0, y: 0 }, { x: 0, y: 0 }), { x: 0, y: 0 });
  assert.deepEqual(sceneRules.getMergedVelocity({ x: 20, y: -10 }, { x: 20, y: -10 }), { x: 0.45, y: 0 });
});

test('repeated same-lane drops fan out until the player moves the aim', () => {
  assert.equal(typeof sceneRules.getRepeatedDropPressure, 'function');
  assert.deepEqual(sceneRules.getRepeatedDropPressure({ previousX: null, x: 310, streak: 0 }), { streak: 0, velocityX: 0 });
  assert.deepEqual(sceneRules.getRepeatedDropPressure({ previousX: 310, x: 310, streak: 1 }), { streak: 2, velocityX: 0.65 });
  assert.deepEqual(sceneRules.getRepeatedDropPressure({ previousX: 310, x: 310, streak: 2 }), { streak: 3, velocityX: -0.65 });
  assert.deepEqual(sceneRules.getRepeatedDropPressure({ previousX: 310, x: 350, streak: 5 }), { streak: 0, velocityX: 0 });
});

test('collision bursts cannot eject pieces from the game room', () => {
  assert.equal(typeof sceneRules.getContainedPosition, 'function');
  assert.deepEqual(sceneRules.getContainedPosition({ x: -90, y: 900, halfWidth: 24, halfHeight: 24 }), { x: 70, y: 728 });
});

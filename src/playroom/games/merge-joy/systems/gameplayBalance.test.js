import assert from 'node:assert/strict';
import test from 'node:test';
import * as tierRules from '../data/mergeTiers.js';
import * as sceneRules from '../phaser/scenes/MergeJoyScene.js';

const { mergeTiers } = tierRules;

test('each merge grows beyond either dropped or merged ingredients while fitting the board', () => {
  const boardWidth = 528;
  for (let index = 1; index < mergeTiers.length; index += 1) {
    const result = tierRules.getPieceDiameter(mergeTiers[index]);
    for (const isDrop of [false, true]) {
      assert.ok(result > tierRules.getPieceDiameter(mergeTiers[index - 1], isDrop),
        `${mergeTiers[index].name} must grow beyond its ingredients`);
    }
  }
  assert.ok(tierRules.getPieceDiameter(mergeTiers.at(-1)) / boardWidth <= 0.6);
});

test('the same item keeps its size whether dropped or created by a merge', () => {
  assert.deepEqual(mergeTiers.slice(0, 5).map((tier) => tierRules.getPieceDiameter(tier, true)), [83, 103, 130, 156, 186]);
  for (const tier of mergeTiers) {
    assert.equal(tierRules.getPieceDiameter(tier, false), tierRules.getPieceDiameter(tier, true), tier.name);
  }
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

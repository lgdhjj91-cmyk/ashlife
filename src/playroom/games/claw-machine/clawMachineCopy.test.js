import assert from 'node:assert/strict';
import test from 'node:test';
import { getClawMachineCopy } from './clawMachineCopy.js';

test('swing and win selects Chinese page, component, canvas, and prize copy', () => {
  const copy = getClawMachineCopy('zh');

  assert.equal(copy.title, 'Ashlife 摇摆抓奖');
  assert.equal(copy.modes.practice.label, '练习');
  assert.equal(copy.difficulties.hard, '困难');
  assert.equal(copy.hud.restart, '重新开始');
  assert.equal(copy.mobile.dropGrab, '下爪 / 抓取');
  assert.equal(copy.tutorial.start, '开始游戏');
  assert.equal(copy.status.READY, '移动爪子');
  assert.equal(copy.grip.secure, '抓得很稳');
  assert.equal(copy.scene.wonPrizes, '已赢奖品');
  assert.equal(copy.scene.dropHere, '投进\n这里！');
  assert.equal(copy.prizes['bunny-plush'], '兔子玩偶');
});

test('swing and win preserves its English interface and fallback', () => {
  assert.equal(getClawMachineCopy('en').title, 'Ashlife Swing & Win');
  assert.equal(getClawMachineCopy('unknown').status.READY, 'Move the claw');
});

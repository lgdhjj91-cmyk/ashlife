import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearClassicDailyLock,
  isClassicAvailable,
  markClassicComplete,
} from './clawMachineProgress.js';

test('classic completion locks only the current local date', () => {
  const progress = {
    coins: 90,
    clawMachine: {
      classicLastPlayedDate: '',
      prizeQuantities: { bear: 2 },
    },
  };

  const completed = markClassicComplete(progress, '2026-07-27');

  assert.equal(isClassicAvailable(completed, '2026-07-27'), false);
  assert.equal(isClassicAvailable(completed, '2026-07-28'), true);
  assert.equal(completed.coins, 90);
  assert.deepEqual(completed.clawMachine.prizeQuantities, { bear: 2 });
});

test('admin test reset preserves every non-lock field', () => {
  const progress = {
    coins: 123,
    unlockedStickers: ['bear-heart'],
    clawMachine: {
      classicLastPlayedDate: '2026-07-27',
      prizeQuantities: { bear: 3 },
    },
  };

  const reset = clearClassicDailyLock(progress);

  assert.equal(reset.coins, 123);
  assert.deepEqual(reset.unlockedStickers, ['bear-heart']);
  assert.deepEqual(reset.clawMachine.prizeQuantities, { bear: 3 });
  assert.equal(reset.clawMachine.classicLastPlayedDate, '');
});

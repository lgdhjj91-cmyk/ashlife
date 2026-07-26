import test from 'node:test';
import assert from 'node:assert/strict';
import { isClassicAvailable, markClassicComplete } from './clawMachineProgress.js';

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

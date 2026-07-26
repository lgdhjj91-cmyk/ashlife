import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePlayroomProgress } from './playroomStorage.js';

test('normalizes claw-machine progress without losing existing memory records', () => {
  const progress = normalizePlayroomProgress({
    coins: 30,
    records: {
      normal: { bestScore: 1234 },
      clawMachine: {
        normal: { bestScore: 880, fewestAttempts: 2 },
      },
    },
    clawMachine: {
      wonPrizeIds: ['bunny-plush', 'bunny-plush', 'heart-keychain'],
      prizeQuantities: { 'bunny-plush': 2 },
      classicLastPlayedDate: '2026-07-27',
      completedPractice: true,
      selectedDifficulty: 'hard',
      selectedMode: 'classic',
      controlLayout: 'left',
    },
  });

  assert.equal(progress.records.normal.bestScore, 1234);
  assert.deepEqual(progress.clawMachine.wonPrizeIds, ['bunny-plush', 'heart-keychain']);
  assert.equal(progress.clawMachine.prizeQuantities['bunny-plush'], 2);
  assert.equal(progress.clawMachine.classicLastPlayedDate, '2026-07-27');
  assert.equal(progress.clawMachine.selectedDifficulty, 'hard');
  assert.equal(progress.clawMachine.controlLayout, 'left');
});

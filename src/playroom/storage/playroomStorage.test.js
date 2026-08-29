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
  assert.deepEqual(progress.mergeJoy.discoveries, {});
  assert.equal(progress.mergeJoy.highestScore, 0);
  assert.deepEqual(progress.dailyStreak.completionDates, []);
});

test('normalizes malformed Merge and streak values without discarding valid discoveries', () => {
  const progress = normalizePlayroomProgress({
    mergeJoy: {
      highestScore: -40,
      highestTier: 99,
      bestCombo: '4',
      discoveries: {
        6: { firstDate: '2026-08-29', count: 3 },
        8: { firstDate: 12, count: -2 },
      },
      selectedMode: 'unknown',
      daily: { date: '2026-08-29', medal: 'perfect', coinsClaimed: 30 },
    },
    dailyStreak: { completionDates: ['2026-08-29', '2026-08-29', 9], rewardedMilestones: ['2026-W35:3', 2] },
  });

  assert.equal(progress.mergeJoy.highestScore, 0);
  assert.equal(progress.mergeJoy.highestTier, 11);
  assert.equal(progress.mergeJoy.bestCombo, 4);
  assert.deepEqual(progress.mergeJoy.discoveries, {
    6: { firstDate: '2026-08-29', count: 3 },
    8: { firstDate: '', count: 0 },
  });
  assert.equal(progress.mergeJoy.selectedMode, 'endless');
  assert.deepEqual(progress.dailyStreak.completionDates, ['2026-08-29']);
  assert.deepEqual(progress.dailyStreak.rewardedMilestones, ['2026-W35:3']);
});

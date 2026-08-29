import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPlayroomProgress, normalizePlayroomProgress } from '../../../storage/playroomStorage.js';
import { applyMergeSessionResult, recordMergeDiscovery } from './mergeJoyProgress.js';

test('records first discovery date and increments future creation counts', () => {
  const first = recordMergeDiscovery(defaultPlayroomProgress, { tier: 6, count: 2, dateKey: '2026-08-29' });
  const second = recordMergeDiscovery(first, { tier: 6, count: 1, dateKey: '2026-08-30' });
  assert.deepEqual(second.mergeJoy.discoveries[6], { firstDate: '2026-08-29', count: 3 });
  assert.equal(second.mergeJoy.highestTier, 6);
});

test('Endless mode updates records and discoveries but never awards daily coins', () => {
  const progress = normalizePlayroomProgress({ coins: 40 });
  const result = applyMergeSessionResult(progress, {
    mode: 'endless',
    dateKey: '2026-08-29',
    stats: { score: 2_500, highestTier: 8, maxCombo: 3, perfectDrops: 2, createdByTier: { 6: 1, 8: 2 } },
  });
  assert.equal(result.coinAward, 0);
  assert.equal(result.nextProgress.coins, 40);
  assert.equal(result.nextProgress.mergeJoy.highestScore, 2_500);
  assert.equal(result.nextProgress.mergeJoy.discoveries[8].count, 2);
});

test('Daily mode awards only the improvement up to thirty coins for one date', () => {
  const start = normalizePlayroomProgress({ coins: 10 });
  const bronze = applyMergeSessionResult(start, {
    mode: 'daily',
    dateKey: '2026-08-29',
    challengeId: 'score-sprint',
    dailyResult: { complete: true, medal: 'bronze', coins: 10 },
    stats: { score: 3_100, highestTier: 5, maxCombo: 2, perfectDrops: 0, createdByTier: {} },
  });
  const perfect = applyMergeSessionResult(bronze.nextProgress, {
    mode: 'daily',
    dateKey: '2026-08-29',
    challengeId: 'score-sprint',
    dailyResult: { complete: true, medal: 'perfect', coins: 30 },
    stats: { score: 8_100, highestTier: 9, maxCombo: 5, perfectDrops: 4, createdByTier: {} },
  });
  const replay = applyMergeSessionResult(perfect.nextProgress, {
    mode: 'daily',
    dateKey: '2026-08-29',
    challengeId: 'score-sprint',
    dailyResult: { complete: true, medal: 'perfect', coins: 30 },
    stats: { score: 9_000, highestTier: 9, maxCombo: 5, perfectDrops: 4, createdByTier: {} },
  });

  assert.equal(bronze.coinAward, 10);
  assert.equal(perfect.coinAward, 20);
  assert.equal(replay.coinAward, 0);
  assert.equal(replay.nextProgress.mergeJoy.daily.coinsClaimed, 30);
  assert.equal(replay.nextProgress.coins, 40);
  assert.deepEqual(replay.nextProgress.dailyStreak.completionDates, ['2026-08-29']);
});

test('Golden Bunny and streak stickers unlock once while milestone coins stay idempotent', () => {
  let progress = normalizePlayroomProgress({
    dailyStreak: { completionDates: ['2026-08-26', '2026-08-27'] },
  });
  const result = applyMergeSessionResult(progress, {
    mode: 'daily',
    dateKey: '2026-08-28',
    challengeId: 'combo-maker',
    dailyResult: { complete: true, medal: 'bronze', coins: 10 },
    stats: { score: 4_000, highestTier: 11, maxCombo: 3, perfectDrops: 1, createdByTier: { 11: 1 } },
  });
  progress = applyMergeSessionResult(result.nextProgress, {
    mode: 'daily',
    dateKey: '2026-08-28',
    challengeId: 'combo-maker',
    dailyResult: { complete: true, medal: 'bronze', coins: 10 },
    stats: { score: 4_500, highestTier: 11, maxCombo: 3, perfectDrops: 1, createdByTier: { 11: 1 } },
  });

  assert.equal(result.coinAward, 15);
  assert.ok(result.stickerIds.includes('merge-golden-bunny'));
  assert.equal(progress.coinAward, 0);
  assert.equal(progress.nextProgress.unlockedStickers.filter((id) => id === 'merge-golden-bunny').length, 1);
});

test('Golden Bunny unlock follows the reached tier when discoveries were saved live', () => {
  const result = applyMergeSessionResult(defaultPlayroomProgress, {
    mode: 'endless',
    dateKey: '2026-08-29',
    stats: { score: 12_000, highestTier: 11, maxCombo: 4, perfectDrops: 1, createdByTier: {} },
  });

  assert.ok(result.stickerIds.includes('merge-golden-bunny'));
});

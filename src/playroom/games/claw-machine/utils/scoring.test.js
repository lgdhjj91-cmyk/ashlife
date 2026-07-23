import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateClawReward, calculateClawScore } from './scoring.js';

test('score rewards rarity, clean release, and remaining attempts without going negative', () => {
  const score = calculateClawScore({
    prize: { rarity: 'rare', rewardCoins: 40 },
    difficulty: 'hard',
    attemptsUsed: 1,
    remainingAttempts: 2,
    elapsedSeconds: 34,
    bonuses: ['apex-release', 'wall-bounce'],
  });

  assert.ok(score > 900);
});

test('practice mode gives reduced coin rewards but keeps sticker unlock', () => {
  const reward = calculateClawReward({
    prize: { id: 'bunny-plush', rewardCoins: 20, stickerId: 'bunny-plush-sticker', rarity: 'common' },
    mode: 'practice',
    difficulty: 'easy',
    isDuplicate: false,
  });

  assert.equal(reward.coins, 5);
  assert.equal(reward.stickerId, 'bunny-plush-sticker');
  assert.equal(reward.rarity, 'common');
});

test('duplicate classic prizes pay a smaller repeat reward', () => {
  const reward = calculateClawReward({
    prize: { id: 'bear-plush', rewardCoins: 25, stickerId: 'bear-heart', rarity: 'uncommon' },
    mode: 'classic',
    difficulty: 'normal',
    isDuplicate: true,
  });

  assert.equal(reward.coins, 8);
});

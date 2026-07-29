import assert from 'node:assert/strict';
import test from 'node:test';

let getPlayroomClawFeatureCopy;

try {
  ({ getPlayroomClawFeatureCopy } = await import('./playroomClawFeatureCopy.js'));
} catch {
  getPlayroomClawFeatureCopy = undefined;
}

test('Playroom Swing & Win feature card uses complete Chinese copy', () => {
  const copy = getPlayroomClawFeatureCopy?.('zh');

  assert.deepEqual(copy, {
    title: 'Ashlife 摇摆抓奖',
    description: '抓取奖品、制造摇摆动力，在最合适的时机把奖品投进洞口！',
    button: '马上玩',
    difficulty: '技巧挑战',
    reward: '欢乐币和收藏贴纸',
    imageAlt: '装满可爱毛绒奖品的粉彩 ASHLIFE 抓奖机',
  });
});

test('Playroom Swing & Win feature card preserves English and falls back to it', () => {
  const english = {
    title: 'Ashlife Swing & Win',
    description: 'Grab a prize, build momentum and swing it into the prize hole!',
    button: 'Play Now',
    difficulty: 'Skill-based',
    reward: 'Joy Coins and collectible stickers',
    imageAlt: 'Pastel ASHLIFE claw machine filled with cute plush prizes',
  };

  assert.deepEqual(getPlayroomClawFeatureCopy?.('en'), english);
  assert.deepEqual(getPlayroomClawFeatureCopy?.('unknown'), english);
});

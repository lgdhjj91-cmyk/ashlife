import test from 'node:test';
import assert from 'node:assert/strict';
import * as prizeConfig from './prizeConfig.js';

const { clawPrizeConfig, initialPrizeLayout } = prizeConfig;

test('expanded prize mix includes the star, car, and three additional generated prizes', () => {
  const configuredIds = new Set(clawPrizeConfig.map((prize) => prize.id));
  const layoutIds = new Set(initialPrizeLayout.map(([id]) => id));
  const expectedIds = [
    'star-cushion',
    'pink-toy-car',
    'cloud-plush',
    'strawberry-donut',
    'cherry-handbag',
  ];

  expectedIds.forEach((id) => {
    assert.equal(configuredIds.has(id), true, `${id} should be configured`);
    assert.equal(layoutIds.has(id), true, `${id} should appear in the machine`);
  });
});

test('restart prize layouts are deterministic per seed and reshuffle for a new seed', () => {
  const first = prizeConfig.createRandomPrizeLayout({ prizes: clawPrizeConfig, seed: 1201 });
  const repeated = prizeConfig.createRandomPrizeLayout({ prizes: clawPrizeConfig, seed: 1201 });
  const restarted = prizeConfig.createRandomPrizeLayout({ prizes: clawPrizeConfig, seed: 1202 });

  assert.deepEqual(repeated, first);
  assert.notDeepEqual(restarted, first);
});

test('random prize layouts keep every prize inside the cabinet and clear of the chute', () => {
  const layout = prizeConfig.createRandomPrizeLayout({ prizes: clawPrizeConfig, seed: 90210 });
  const configuredIds = clawPrizeConfig.map((prize) => prize.id).sort();
  const layoutIds = layout.map(([id]) => id).sort();

  assert.deepEqual(layoutIds, configuredIds);
  layout.forEach(([id, x, y]) => {
    const prize = clawPrizeConfig.find((candidate) => candidate.id === id);
    assert.equal(
      prizeConfig.isPrizeSpawnSafe({ x, y, width: prize.width, height: prize.height }),
      true,
      `${id} should not spawn over the prize chute`
    );
  });
});

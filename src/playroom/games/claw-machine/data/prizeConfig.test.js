import test from 'node:test';
import assert from 'node:assert/strict';
import { clawPrizeConfig, initialPrizeLayout } from './prizeConfig.js';

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

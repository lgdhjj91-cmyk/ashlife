import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateGripQuality, getGripLabel } from './GripSystem.js';

test('centered lightweight plush gets a secure grip', () => {
  const result = evaluateGripQuality({
    claw: { x: 220, y: 240, velocityX: 0.2 },
    prize: {
      id: 'bunny-plush',
      x: 224,
      y: 255,
      width: 74,
      height: 82,
      mass: 0.8,
      gripDifficulty: 0.2,
      hookable: false,
      shape: 'rounded',
      velocityX: 0.1,
    },
    contactPoints: 3,
  });

  assert.equal(result.state, 'secure');
  assert.ok(result.score >= 0.7);
  assert.equal(getGripLabel(result.state), 'Secure Grip');
});

test('off-center heavy box produces a weak or missed grip', () => {
  const result = evaluateGripQuality({
    claw: { x: 220, y: 240, velocityX: 2.5 },
    prize: {
      id: 'blind-box',
      x: 292,
      y: 260,
      width: 76,
      height: 76,
      mass: 1.75,
      gripDifficulty: 0.55,
      hookable: false,
      shape: 'box',
      velocityX: -1.5,
    },
    contactPoints: 1,
  });

  assert.ok(['missed', 'weak'].includes(result.state));
  assert.ok(result.score < 0.42);
});

test('hookable prize near the claw earns hooked state', () => {
  const result = evaluateGripQuality({
    claw: { x: 180, y: 220, velocityX: 0.4 },
    prize: {
      id: 'heart-keychain',
      x: 183,
      y: 235,
      width: 52,
      height: 72,
      mass: 0.45,
      gripDifficulty: 0.38,
      hookable: true,
      shape: 'keychain',
      velocityX: 0.1,
    },
    contactPoints: 2,
  });

  assert.equal(result.state, 'hooked');
  assert.ok(result.slipRisk < 0.35);
});

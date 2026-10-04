import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLAW_MAX_VISUAL_TILT,
  dampClawTilt,
  getClawCableEnd,
  getClawTextureForState,
  getClawTiltTarget,
} from './ClawMotion.js';
import * as clawMotion from './ClawMotion.js';

test('visual claw tilt follows trolley lag but never tumbles', () => {
  const trailingLeft = getClawTiltTarget({
    anchorX: 620,
    clawX: 500,
    trolleyVelocity: 8,
    clawVelocityX: -4,
    state: 'SWINGING',
  });
  const trailingRight = getClawTiltTarget({
    anchorX: 380,
    clawX: 500,
    trolleyVelocity: -8,
    clawVelocityX: 4,
    state: 'SWINGING',
  });

  assert.equal(trailingLeft, CLAW_MAX_VISUAL_TILT);
  assert.equal(trailingRight, -CLAW_MAX_VISUAL_TILT);
  assert.equal(CLAW_MAX_VISUAL_TILT, 0.08);
});

test('drop motion stays calmer than active swinging', () => {
  const input = {
    anchorX: 560,
    clawX: 500,
    trolleyVelocity: 5,
    clawVelocityX: 0,
  };

  const dropping = getClawTiltTarget({ ...input, state: 'DROPPING' });
  const swinging = getClawTiltTarget({ ...input, state: 'SWINGING' });

  assert.ok(Math.abs(dropping) < Math.abs(swinging));
});

test('damped tilt moves toward center without overshooting', () => {
  const next = dampClawTilt(0.2, 0, 16);

  assert.ok(next > 0);
  assert.ok(next < 0.2);
  assert.equal(dampClawTilt(0.2, 0, 0), 0.2);
});

test('cable ends at the claw top connector', () => {
  assert.deepEqual(getClawCableEnd({ x: 488, y: 334 }), { x: 488, y: 283 });
});

test('each texture anchors its visible spring connector to the cable', () => {
  assert.equal(typeof clawMotion.getClawTextureOrigin, 'function');
  for (const [texture, width, height, connectorX] of [
    ['claw-open', 233, 284, 117.5],
    ['claw-partial', 231, 277, 86.5],
    ['claw-closed', 212, 276, 65],
  ]) {
    const origin = clawMotion.getClawTextureOrigin(texture);
    assert.ok(Math.abs(origin.x * width - connectorX) < 0.01);
    assert.ok(Math.abs(origin.y * height - 10) < 0.01);
  }
});

test('claw textures communicate closing, carrying, and release states', () => {
  assert.equal(getClawTextureForState('AIMING'), 'claw-open');
  assert.equal(getClawTextureForState('DROPPING'), 'claw-open');
  assert.equal(getClawTextureForState('CLOSING'), 'claw-partial');
  assert.equal(getClawTextureForState('LIFTING'), 'claw-closed');
  assert.equal(getClawTextureForState('SWINGING'), 'claw-closed');
  assert.equal(getClawTextureForState('RELEASED'), 'claw-open');
  assert.equal(getClawTextureForState('RESOLVING'), 'claw-open');
});

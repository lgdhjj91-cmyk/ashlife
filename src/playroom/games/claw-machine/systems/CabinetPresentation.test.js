import test from 'node:test';
import assert from 'node:assert/strict';
import * as cabinetPresentation from './CabinetPresentation.js';

const {
  cabinetForegroundCrops,
  getCabinetCropPlacement,
  joystickPrizeGuard,
} = cabinetPresentation;

test('foreground artwork contains only the joystick and cannot duplicate the prize chute', () => {
  assert.deepEqual(cabinetForegroundCrops, [
    {
      id: 'joystick',
      x: 145,
      y: 800,
      width: 190,
      height: 235,
      depth: 19,
    },
  ]);
});

test('a lower guard keeps settled prizes behind the joystick instead of on top of it', () => {
  assert.deepEqual(joystickPrizeGuard, {
    x: 250,
    y: 555,
    width: 18,
    height: 110,
  });
});

test('cabinet crop placement preserves its position in the full cabinet artwork', () => {
  assert.deepEqual(
    getCabinetCropPlacement({
      crop: cabinetForegroundCrops[0],
      sourceWidth: 1438,
      sourceHeight: 1093,
      displayWidth: 1000,
      displayHeight: 760,
    }),
    {
      x: 101,
      y: 556,
      scaleX: 1000 / 1438,
      scaleY: 760 / 1093,
    }
  );
});

test('joystick foreground mask follows the knob, stem, and base instead of a rectangle', () => {
  assert.equal(typeof cabinetPresentation.getJoystickForegroundMaskPlacement, 'function');
  assert.deepEqual(
    cabinetPresentation.getJoystickForegroundMaskPlacement({
      x: 10,
      y: 20,
      scaleX: 2,
      scaleY: 3,
    }),
    {
      knob: { x: 218, y: 281, radius: 108 },
      stem: { x: 174, y: 398, width: 92, height: 240, radius: 24 },
      base: { x: 218, y: 620, width: 284, height: 198 },
    }
  );
});

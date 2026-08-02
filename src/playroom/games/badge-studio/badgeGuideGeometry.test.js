import assert from 'node:assert/strict';
import test from 'node:test';
import { getBadgeGuideGeometry } from './badgeStudioLogic.js';

test('badge guides separate the 70 mm cut artwork from the finished front and safe content', () => {
  const geometry = getBadgeGuideGeometry({
    artworkDiameterMm: 70,
    productSizeMm: 58,
    safeAreaDiameterMm: 54,
  });

  assert.ok(Math.abs((geometry?.frontInsetPercent ?? Number.NaN) - 8.5714285714) < 0.000001);
  assert.ok(Math.abs((geometry?.safeInsetPercent ?? Number.NaN) - 11.4285714286) < 0.000001);
  assert.ok(Math.abs((geometry?.frontScale ?? Number.NaN) - 1.2068965517) < 0.000001);
  assert.equal(geometry?.wrapWidthMm, 6);
});

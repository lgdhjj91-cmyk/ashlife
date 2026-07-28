import assert from 'node:assert/strict';
import test from 'node:test';
import { getBadgeStudioPromotion } from './diyBadgeStudioContent.js';

test('badge studio promotion identifies the 58 mm product and a direct design action', () => {
  const promotion = getBadgeStudioPromotion('en');

  assert.match(promotion.title, /58 mm/);
  assert.match(promotion.description, /upload/i);
  assert.equal(promotion.cta, 'Design Your 58 mm Badge');
  assert.deepEqual(promotion.features, [
    'Adjust every photo yourself',
    'Mix designs and quantities',
    'Create a print-ready A4 layout',
  ]);
});

test('badge studio promotion returns complete Chinese copy', () => {
  const promotion = getBadgeStudioPromotion('zh');

  assert.equal(promotion.title.length > 0, true);
  assert.equal(promotion.description.length > 0, true);
  assert.equal(promotion.cta.length > 0, true);
  assert.equal(promotion.features.length, 3);
  assert.equal(promotion.features.every(Boolean), true);
});

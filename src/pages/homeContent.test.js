import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HOME_CATEGORIES,
  getHomeCopy,
  selectHomepageProducts,
} from './homeContent.js';

test('homepage products prioritize configured products and remove duplicates', () => {
  const products = [
    { id: 'popular', popular: true, stock: 5 },
    { id: 'focus-two', stock: 2 },
    { id: 'focus-one', stock: 1 },
    { id: 'fallback', stock: 4 },
  ];

  const selected = selectHomepageProducts(
    products,
    ['focus-one', 'focus-two', 'focus-one'],
    4
  );

  assert.deepEqual(
    selected.map((product) => product.id),
    ['focus-one', 'focus-two', 'popular', 'fallback']
  );
});

test('homepage products fall back to flagged, in-stock and remaining products', () => {
  const products = [
    { id: 'empty', stock: 0 },
    {
      id: 'variant-stock',
      variants: [
        { name: 'Sold out', stock: 0 },
        { name: 'Available', stock: 3 },
      ],
    },
    { id: 'featured', featured: true, stock: 0 },
    { id: 'plain' },
  ];

  const selected = selectHomepageProducts(products, [], 4);

  assert.deepEqual(
    selected.map((product) => product.id),
    ['featured', 'variant-stock', 'empty', 'plain']
  );
});

test('homepage content stays concise and exposes six categories', () => {
  for (const language of ['en', 'zh']) {
    const content = getHomeCopy(language);
    assert.equal(content.hero.subtitle.trim().split(/\s+/).length <= 20, true);
    assert.equal(content.hero.primaryAction.length > 0, true);
    assert.equal(content.hero.secondaryAction.length > 0, true);
    assert.equal(content.ordering.points.length, 4);
  }

  assert.equal(HOME_CATEGORIES.length, 6);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { products, customers, wraps } from './giftRushConfig.js';
import { getGiftRushCopy } from '../giftRushCopy.js';
const keys = (value, prefix = '') => Object.entries(value).flatMap(([key, child]) =>
  child && typeof child === 'object' && !Array.isArray(child) ? keys(child, prefix + key + '.') : [prefix + key]);
test('catalogue artwork exists and both languages cover every playable item and UI field', async () => {
  const en = getGiftRushCopy('en');
  const zh = getGiftRushCopy('zh');
  assert.deepEqual(keys(en).sort(), keys(zh).sort());
  assert.equal(new Set(products.map(product => product.id)).size, 6);
  assert.equal(customers.length, 3);
  assert.equal(wraps.length, 3);
  for (const product of products) {
    assert.ok(en.products[product.id] && zh.products[product.id]);
    await access(new URL('../../../../../public/' + product.imagePath, import.meta.url));
  }
  for (const path of ['customers/customer-atlas.webp', 'rewards/happy-parcel.webp', 'card/gift-rush-preview.webp']) {
    await access(new URL('../../../../../public/assets/playroom/gift-rush/' + path, import.meta.url));
  }
});

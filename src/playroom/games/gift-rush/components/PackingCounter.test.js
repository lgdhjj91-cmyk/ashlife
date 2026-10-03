import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getGiftRushCopy } from '../giftRushCopy.js';

test('packing requires an explicit wrapping choice and makes that choice visible', async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'ashlife-gift-wrapping-'));
  const vite = await createServer({ cacheDir, logLevel: 'silent', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: PackingCounter } = await vite.ssrLoadModule('/src/playroom/games/gift-rush/components/PackingCounter.jsx');
    const render = (wrapId, language = 'en') => renderToStaticMarkup(React.createElement(PackingCounter, {
      copy: getGiftRushCopy(language), dispatch: () => {},
      state: { sessionId: 'round-1', selectedOrderId: 'order-1', orders: [{
        id: 'order-1', customerId: 'bear', items: ['kawaii-washi-tape', 'bear-heart'], wrapId: 'mint-dots',
        tray: { items: ['kawaii-washi-tape', 'bear-heart'], wrapId },
      }] },
    }));
    const packTag = html => html.match(/<button[^>]*class="gift-primary gift-pack"[^>]*>/)?.[0];
    const unwrapped = render(null);
    assert.match(packTag(unwrapped), /disabled=""/, 'matching items alone cannot submit an unwrapped gift');
    assert.match(unwrapped, /Choose Wrapping First/);
    const wrapped = render('mint-dots');
    assert.doesNotMatch(packTag(wrapped), /disabled/);
    assert.match(wrapped, /Selected wrapping: Mint Dots/);
    assert.match(wrapped, /gift-wrap-check/);
    assert.match(render('mint-dots', 'zh'), /已选包装：薄荷圆点/);
  } finally {
    await vite.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});

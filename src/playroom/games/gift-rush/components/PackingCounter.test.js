import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getGiftRushCopy } from '../giftRushCopy.js';
import { applyGiftRushResult, confirmGiftRushClaim } from '../storage/giftRushProgress.js';

test('packing requires an explicit wrapping choice and makes that choice visible', async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'ashlife-gift-wrapping-'));
  const vite = await createServer({ cacheDir, logLevel: 'silent', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: PackingCounter } = await vite.ssrLoadModule('/src/playroom/games/gift-rush/components/PackingCounter.jsx');
    const { default: CustomerQueue } = await vite.ssrLoadModule('/src/playroom/games/gift-rush/components/CustomerQueue.jsx');
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
    const customers = renderToStaticMarkup(React.createElement(CustomerQueue, {
      copy: getGiftRushCopy('en'), dispatch: () => {}, state: { selectedOrderId: 'a', orders: [
        { id: 'a', customerId: 'bear', wrapId: 'mint-dots', tray: { wrapId: 'pink-hearts' }, remainingPatienceMs: 20000, initialPatienceMs: 25000 },
        { id: 'b', customerId: 'bunny', wrapId: 'lavender-stars', remainingPatienceMs: 22000, initialPatienceMs: 25000 },
      ] },
    }));
    assert.match(customers, /class="gift-customer gift-wrap-pattern mint-dots selected"/);
    assert.match(customers, /aria-label="Bear · Requested wrapping: Mint Dots/);
    assert.match(customers, /gift-wrap-pattern lavender-stars/);
    assert.match(wrapped, /data-request-item="kawaii-washi-tape" data-quantity="1"/);
    const { default: GiftRushRewards } = await vite.ssrLoadModule('/src/playroom/games/gift-rush/components/GiftRushRewards.jsx');
    const earned = applyGiftRushResult({ unlockedStickers: [] }, { sessionId: 'result-1', mode: 'daily', dateKey: '2026-10-03', stats: { score: 2018, maxCombo: 8 } }, { ownerUid: 'a' });
    const confirmed = confirmGiftRushClaim(earned.nextProgress, { claimId: earned.claimId, ownerUid: 'a' });
    const rewardMarkup = language => renderToStaticMarkup(React.createElement(GiftRushRewards, {
      giftRush: confirmed.giftRush, dateKey: '2026-10-03', ownerUid: 'a', copy: getGiftRushCopy(language), claimDisabled: false, onClaim: () => {},
    }));
    assert.match(rewardMarkup('en'), /20 \/ 30/);
    assert.equal((rewardMarkup('en').match(/gift-reward-status pending/g) || []).length, 2);
    assert.match(rewardMarkup('en'), /1,500 Score/);
    assert.match(rewardMarkup('en'), /2,000 Score/);
    assert.match(rewardMarkup('zh'), /这一天已领取/);
  } finally {
    await vite.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});

import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const renderSelector = async (props) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'ashlife-merge-mode-vite-'));
  const iconsEntry = fileURLToPath(
    new URL('../../../../../node_modules/lucide-react/dist/esm/lucide-react.js', import.meta.url)
  );
  const vite = await createServer({
    cacheDir,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    ssr: { noExternal: ['react-dom'] },
    resolve: { alias: { 'lucide-react': iconsEntry } },
  });

  try {
    const { default: MergeModeSelector } = await vite.ssrLoadModule(
      '/src/playroom/games/merge-joy/components/MergeModeSelector.jsx'
    );
    return renderToStaticMarkup(React.createElement(MergeModeSelector, props));
  } finally {
    await vite.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
};

test('makes the Endless and Daily reward difference explicit in English', async () => {
  const html = await renderSelector({ language: 'en', mode: 'endless', onChoose() {} });

  assert.match(html, /Choose a game mode/);
  assert.match(html, /ENDLESS PRACTICE/);
  assert.match(html, /No Joy Coins/);
  assert.match(html, /DAILY REWARDS/);
  assert.match(html, /Earn up to 80 Joy Coins/);
  assert.match(html, /aria-pressed="true"/);
});

test('makes the Endless and Daily reward difference explicit in Chinese', async () => {
  const html = await renderSelector({ language: 'zh', mode: 'daily', onChoose() {} });

  assert.match(html, /选择游戏模式/);
  assert.match(html, /无限练习/);
  assert.match(html, /不奖励 Joy Coins/);
  assert.match(html, /每日奖励/);
  assert.match(html, /最多赚取 80 Joy Coins/);
  assert.match(html, /aria-pressed="true"/);
});

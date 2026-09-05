import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('shows a non-blocking discovery notice instead of a modal dialog', async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'ashlife-merge-modal-vite-'));
  const iconsEntry = fileURLToPath(
    new URL('../../../../../node_modules/lucide-react/dist/esm/lucide-react.js', import.meta.url)
  );
  const vite = await createServer({
    cacheDir,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    ssr: { noExternal: ['react-dom', 'react-router-dom'] },
    resolve: { alias: { 'lucide-react': iconsEntry } },
  });

  try {
    const { MergeDiscoveryToast } = await vite.ssrLoadModule(
      '/src/playroom/games/merge-joy/components/MergeModals.jsx'
    );

    assert.equal(typeof MergeDiscoveryToast, 'function');
    const html = renderToStaticMarkup(React.createElement(MergeDiscoveryToast, { tier: 2, progressCount: 3 }));
    assert.match(html, /role="status"/);
    assert.match(html, /Heart Keychain/);
    assert.doesNotMatch(html, /role="dialog"|<button/);
  } finally {
    await vite.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});

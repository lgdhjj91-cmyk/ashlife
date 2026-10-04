import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createServer } from 'vite';

const originalMemoryStickerIds = [
  'bear-notebook',
  'bunny-pencil-case',
  'cream-glue-set',
  'diy-resin-jar',
  'resin-letter-set',
  'paw-squishy',
  'kawaii-washi-tape',
  'sticky-notes-set',
  'bunny-scissors',
  'bear-pencil-holder',
  'bubble-tea-keychain',
  'puppy-calendar',
  'cat-reading',
  'puppy-teacup',
  'bear-heart',
];

test('uses only the original sticker artwork for Memory Match', async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'ashlife-memory-pool-vite-'));
  const vite = await createServer({
    cacheDir,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });

  try {
    const [{ stickers, memoryMatchStickers }, { createMemoryDeck }] = await Promise.all([
      vite.ssrLoadModule('/src/playroom/data/stickers.js'),
      vite.ssrLoadModule('/src/playroom/games/memory-match/memoryGameLogic.js'),
    ]);

    assert.deepEqual(memoryMatchStickers?.map((sticker) => sticker.id), originalMemoryStickerIds);
    assert.ok(memoryMatchStickers.every((sticker) => sticker.image.includes('assets/game/stickers/')));
    assert.ok(memoryMatchStickers.every((sticker) => !sticker.id.startsWith('merge-')));

    const deck = createMemoryDeck(memoryMatchStickers, 12);
    assert.equal(deck.length, 24);
    assert.ok(deck.every((card) => card.sticker.image.includes('assets/game/stickers/')));
    assert.ok(stickers.some((sticker) => sticker.id === 'merge-golden-bunny'), 'Merge rewards should remain in the album');
    assert.ok(stickers.some((sticker) => sticker.id === 'gift-rush-happy-parcel'), 'Gift Rush reward belongs in the album');
    assert.ok(memoryMatchStickers.every((sticker) => !sticker.id.startsWith('gift-rush-')));
  } finally {
    await vite.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});

test('Memory Match uses complete repaired artwork for the damaged sticker set', async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'ashlife-memory-art-vite-'));
  const vite = await createServer({
    cacheDir,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });

  try {
    const { memoryMatchStickers } = await vite.ssrLoadModule('/src/playroom/data/stickers.js');
    const repaired = memoryMatchStickers.filter((sticker) => sticker.memoryImage);
    assert.equal(repaired.length, 11);
    assert.ok(repaired.every((sticker) => sticker.memoryImage.includes('/assets/game/stickers/memory/')));
    assert.ok(repaired.every((sticker) => sticker.image.includes('/assets/game/stickers/')));
  } finally {
    await vite.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});

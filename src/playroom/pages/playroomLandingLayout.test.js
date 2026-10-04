import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { createServer } from 'vite';

const localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

globalThis.localStorage = localStorage;
globalThis.document = { body: { nodeName: 'BODY' } };

const renderPlayroom = async () => {
  const iconsEntry = fileURLToPath(new URL('../../../node_modules/lucide-react/dist/esm/lucide-react.js', import.meta.url));
  const cacheDir = await mkdtemp(join(tmpdir(), 'ashlife-playroom-vite-'));
  const vite = await createServer({
    cacheDir,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    ssr: { noExternal: ['react-router-dom', 'react-dom'] },
    resolve: { alias: { 'lucide-react': iconsEntry } },
    plugins: [{
      name: 'playroom-router-link-shim',
      enforce: 'pre',
      resolveId(id) {
        if (id === 'react-router-dom') return '\0playroom-router-link-shim';
        if (id === 'react-dom') return '\0playroom-react-dom-shim';
        return null;
      },
      load(id) {
        if (id === '\0playroom-router-link-shim') {
          return `import React from 'react';
            export const Link = ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children);`;
        }
        if (id === '\0playroom-react-dom-shim') {
          return `import React from 'react';
            export const createPortal = (children, target) => React.createElement('div', { 'data-portal-target': target.nodeName }, children);`;
        }
        return null;
      },
    }],
  });

  try {
    const [
      { default: PlayroomPage },
      { default: TutorialModal },
      { default: GameCard },
      { LanguageProvider },
      { JoyWalletProvider },
    ] = await Promise.all([
      vite.ssrLoadModule('/src/playroom/pages/PlayroomPage.jsx'),
      vite.ssrLoadModule('/src/playroom/components/TutorialModal.jsx'),
      vite.ssrLoadModule('/src/playroom/components/GameCard.jsx'),
      vite.ssrLoadModule('/src/context/LanguageContext.jsx'),
      vite.ssrLoadModule('/src/context/JoyWalletContext.jsx'),
    ]);

    const landingHtml = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(
          JoyWalletProvider,
          null,
          React.createElement(PlayroomPage)
        )
      )
    );
    const tutorialHtml = renderToStaticMarkup(React.createElement(TutorialModal, {
      labels: {
        memoryTitle: 'Product Memory Match',
        tutorial: {
          dialogLabel: 'How to play tutorial',
          pill: 'How to play',
          gotIt: 'Got it',
          steps: ['Tap a card.'],
        },
      },
      onClose: () => {},
    }));
    const gameCardHtml = renderToStaticMarkup(React.createElement(GameCard, {
      card: {
        cardId: 'bear-notebook-a',
        stickerId: 'bear-notebook',
        isMatched: false,
        sticker: {
          id: 'bear-notebook',
          name: 'Bear Notebook',
          image: '/assets/game/stickers/bear-notebook.webp',
          alt: 'Kawaii purple bear notebook sticker',
        },
      },
      isFaceUp: true,
      isHinting: false,
      reduceMotion: false,
      labels: {
        stickerNames: { 'bear-notebook': 'Bear Notebook' },
        cardLabel: '{name} card',
        hiddenCard: 'Hidden memory card',
      },
      onChoose: () => {},
    }));

    return { landingHtml, tutorialHtml, gameCardHtml, viteCacheDir: vite.config.cacheDir };
  } finally {
    await vite.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
};

const playroomRender = renderPlayroom();

test('puts playable games before rewards and progress on the Playroom landing page', async () => {
  const { landingHtml: html } = await playroomRender;
  const firstGame = html.indexOf('Ashlife Merge &amp; Joy');
  const secondGame = html.indexOf('Ashlife Swing &amp; Win');
  const thirdGame = html.indexOf('Product Memory Match');
  const rewards = html.indexOf('Little games. Real gifts.');
  const dailyChallenge = html.indexOf('Daily challenge');

  assert.notEqual(firstGame, -1);
  assert.notEqual(secondGame, -1);
  assert.notEqual(thirdGame, -1);
  assert.notEqual(rewards, -1);
  assert.notEqual(dailyChallenge, -1);
  assert.ok(firstGame < secondGame && secondGame < thirdGame, 'playable games should keep their intended order');
  assert.ok(firstGame < rewards, 'the first playable game should appear before Joy Rewards');
  assert.ok(firstGame < dailyChallenge, 'the first playable game should appear before progress cards');
  assert.match(html, /href="\/joy-coins" class="joy-balance-card"/);
});

test('does not show an automatic tutorial or unavailable games on entry', async () => {
  const { landingHtml: html } = await playroomRender;

  assert.doesNotMatch(html, /aria-label="How to play tutorial"/);
  assert.doesNotMatch(html, /Coming Soon/);
  assert.doesNotMatch(html, /DIY Keychain Designer|Shopkeeper Rush|Mystery Box Adventure/);
});

test('renders the tutorial at the document body so it stays fixed to the phone viewport', async () => {
  const { tutorialHtml } = await playroomRender;

  assert.match(tutorialHtml, /data-portal-target="BODY"/);
});

test('keeps sticker names accessible without displaying them on card faces', async () => {
  const { gameCardHtml } = await playroomRender;
  const visibleText = gameCardHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  assert.match(gameCardHtml, /aria-label="Bear Notebook card"/);
  assert.doesNotMatch(visibleText, /Bear Notebook/);
});

test('keeps test rendering out of the active development server cache', async () => {
  const { viteCacheDir } = await playroomRender;
  const developmentCacheDir = fileURLToPath(new URL('../../../node_modules/.vite', import.meta.url));

  assert.notEqual(resolve(viteCacheDir), resolve(developmentCacheDir));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldIgnoreDocumentGameplayKey, shouldIgnoreGameplayKey } from './KeyboardControls.js';

test('gameplay keys ignore editable controls', () => {
  assert.equal(shouldIgnoreGameplayKey({ tagName: 'INPUT' }), true);
  assert.equal(shouldIgnoreGameplayKey({ tagName: 'TEXTAREA' }), true);
  assert.equal(shouldIgnoreGameplayKey({ tagName: 'BUTTON' }), true);
  assert.equal(shouldIgnoreGameplayKey({ tagName: 'A' }), true);
  assert.equal(shouldIgnoreGameplayKey({ tagName: 'DIV', isContentEditable: true }), true);
  assert.equal(shouldIgnoreGameplayKey({ tagName: 'DIV' }), false);
});

test('document listener ignores keys already handled by the focused game canvas', () => {
  const canvasChild = { id: 'canvas-child' };
  const mount = {
    contains: (target) => target === canvasChild,
  };

  assert.equal(shouldIgnoreDocumentGameplayKey(canvasChild, mount), true);
  assert.equal(shouldIgnoreDocumentGameplayKey({ id: 'outside' }, mount), false);
});

test('movement, grab, release and pause still work after a game button is clicked', () => {
  const focusedButton = { tagName: 'BUTTON', closest: (selector) => selector === '.claw-page' };

  assert.equal(shouldIgnoreDocumentGameplayKey(focusedButton, null, 'ArrowLeft'), false);
  assert.equal(shouldIgnoreDocumentGameplayKey(focusedButton, null, 'ArrowRight'), false);
  assert.equal(shouldIgnoreDocumentGameplayKey(focusedButton, null, 'KeyA'), false);
  assert.equal(shouldIgnoreDocumentGameplayKey(focusedButton, null, 'KeyD'), false);
  assert.equal(shouldIgnoreDocumentGameplayKey(focusedButton, null, 'Space'), false);
  assert.equal(shouldIgnoreDocumentGameplayKey(focusedButton, null, 'KeyR'), false);
  assert.equal(shouldIgnoreDocumentGameplayKey(focusedButton, null, 'KeyP'), false);
});

test('shortcuts respect dialogs, links and buttons outside the game', () => {
  const dialogButton = { tagName: 'BUTTON', closest: () => true };
  assert.equal(shouldIgnoreDocumentGameplayKey(dialogButton, null, 'Space'), true);
  assert.equal(shouldIgnoreDocumentGameplayKey(dialogButton, null, 'ArrowLeft'), true);
  assert.equal(shouldIgnoreDocumentGameplayKey({ tagName: 'BUTTON' }, null, 'Space'), true);
  assert.equal(shouldIgnoreDocumentGameplayKey({ tagName: 'A' }, null, 'Space'), true);
});

test('movement keys remain blocked while typing in an editable field', () => {
  assert.equal(shouldIgnoreDocumentGameplayKey({ tagName: 'INPUT' }, null, 'ArrowRight'), true);
  assert.equal(
    shouldIgnoreDocumentGameplayKey({ tagName: 'DIV', isContentEditable: true }, null, 'KeyD'),
    true
  );
});

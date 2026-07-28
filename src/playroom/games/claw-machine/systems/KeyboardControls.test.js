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

test('movement keys still reach the game after a mode or difficulty button is clicked', () => {
  const focusedButton = { tagName: 'BUTTON' };

  assert.equal(shouldIgnoreDocumentGameplayKey(focusedButton, null, 'ArrowLeft'), false);
  assert.equal(shouldIgnoreDocumentGameplayKey(focusedButton, null, 'ArrowRight'), false);
  assert.equal(shouldIgnoreDocumentGameplayKey(focusedButton, null, 'KeyA'), false);
  assert.equal(shouldIgnoreDocumentGameplayKey(focusedButton, null, 'KeyD'), false);
  assert.equal(shouldIgnoreDocumentGameplayKey(focusedButton, null, 'Space'), true);
});

test('movement keys remain blocked while typing in an editable field', () => {
  assert.equal(shouldIgnoreDocumentGameplayKey({ tagName: 'INPUT' }, null, 'ArrowRight'), true);
  assert.equal(
    shouldIgnoreDocumentGameplayKey({ tagName: 'DIV', isContentEditable: true }, null, 'KeyD'),
    true
  );
});

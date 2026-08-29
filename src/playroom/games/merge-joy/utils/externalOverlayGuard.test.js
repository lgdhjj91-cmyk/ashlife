import assert from 'node:assert/strict';
import test from 'node:test';
import { installExternalOverlayGuard } from './externalOverlayGuard.js';

const makePanel = (id, display = 'block', priority = 'important') => {
  const values = new Map([['display', display]]);
  const priorities = new Map([['display', priority]]);
  return {
    id,
    tagName: 'DIV',
    style: {
      getPropertyValue: (name) => values.get(name) || '',
      getPropertyPriority: (name) => priorities.get(name) || '',
      setProperty: (name, value, nextPriority = '') => { values.set(name, value); priorities.set(name, nextPriority); },
      removeProperty: (name) => { values.delete(name); priorities.delete(name); },
    },
  };
};

test('hides injected body panels during play and restores their inline display on cleanup', () => {
  const root = makePanel('root', '');
  const existingPanel = makePanel('support-widget');
  const bodyClasses = new Set();
  const body = {
    children: [root, existingPanel],
    classList: { add: (name) => bodyClasses.add(name), remove: (name) => bodyClasses.delete(name) },
  };
  let observeChanges;
  let observeOptions;
  class FakeObserver {
    constructor(callback) { observeChanges = callback; }
    observe(_target, options) { observeOptions = options; }
    disconnect() {}
  }

  const cleanup = installExternalOverlayGuard({ body, Observer: FakeObserver });
  assert.equal(existingPanel.style.getPropertyValue('display'), 'none');
  assert.equal(existingPanel.style.getPropertyPriority('display'), 'important');
  assert.equal(bodyClasses.has('merge-joy-active'), true);
  assert.deepEqual(observeOptions, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

  existingPanel.style.setProperty('display', 'block', 'important');
  observeChanges();
  assert.equal(existingPanel.style.getPropertyValue('display'), 'none');

  const latePanel = makePanel('late-widget', 'flex', '');
  body.children.push(latePanel);
  observeChanges();
  assert.equal(latePanel.style.getPropertyValue('display'), 'none');

  cleanup();
  assert.equal(existingPanel.style.getPropertyValue('display'), 'block');
  assert.equal(existingPanel.style.getPropertyPriority('display'), 'important');
  assert.equal(latePanel.style.getPropertyValue('display'), 'flex');
  assert.equal(bodyClasses.has('merge-joy-active'), false);
});

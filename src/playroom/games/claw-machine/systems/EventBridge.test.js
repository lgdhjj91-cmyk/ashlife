import test from 'node:test';
import assert from 'node:assert/strict';
import { createEventBridge } from './EventBridge.js';

test('event bridge keeps one emitter while routing to the latest handler', () => {
  const received = [];
  const bridge = createEventBridge((type) => received.push(`old:${type}`));
  const emit = bridge.emit;

  bridge.emit('ready');
  bridge.update((type) => received.push(`new:${type}`));
  bridge.emit('updated');

  assert.equal(bridge.emit, emit);
  assert.deepEqual(received, ['old:ready', 'new:updated']);
});

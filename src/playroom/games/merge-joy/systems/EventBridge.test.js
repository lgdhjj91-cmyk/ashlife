import test from 'node:test';
import assert from 'node:assert/strict';
import { createEventBridge } from './EventBridge.js';

test('event bridge preserves one emitter while routing events to the latest React handler', () => {
  const received = [];
  const bridge = createEventBridge((type, detail) => received.push(['old', type, detail]));
  bridge.emit('ready', { score: 0 });
  bridge.update((type, detail) => received.push(['new', type, detail]));
  bridge.emit('merge', { tier: 2 });
  bridge.update(null);
  bridge.emit('ignored', {});

  assert.deepEqual(received, [
    ['old', 'ready', { score: 0 }],
    ['new', 'merge', { tier: 2 }],
  ]);
});

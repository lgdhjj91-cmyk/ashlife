import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendSessionPrize,
  getSessionControlLocks,
  getTurnSecondsRemaining,
  isAttemptResolved,
  shouldAutoDrop,
  shouldEndClassicSession,
  summarizeSession,
} from './SessionFlow.js';

test('turn countdown is clamped to ten through zero', () => {
  assert.equal(getTurnSecondsRemaining({ now: 1_000, deadline: 11_000 }), 10);
  assert.equal(getTurnSecondsRemaining({ now: 10_001, deadline: 11_000 }), 1);
  assert.equal(getTurnSecondsRemaining({ now: 11_001, deadline: 11_000 }), 0);
});

test('only a playable ready or aiming turn auto-drops and it triggers once', () => {
  assert.equal(
    shouldAutoDrop({ state: 'READY', now: 11_000, deadline: 11_000, autoDropTriggered: false }),
    true
  );
  assert.equal(
    shouldAutoDrop({ state: 'AIMING', now: 11_000, deadline: 11_000, autoDropTriggered: false }),
    true
  );
  assert.equal(
    shouldAutoDrop({ state: 'DROPPING', now: 11_000, deadline: 11_000, autoDropTriggered: false }),
    false
  );
  assert.equal(
    shouldAutoDrop({ state: 'AIMING', now: 11_000, deadline: 11_000, autoDropTriggered: true }),
    false
  );
});

test('classic ends at zero only after the active prize resolves', () => {
  assert.equal(shouldEndClassicSession({ mode: 'classic', attemptsRemaining: 0, activePrize: null }), true);
  assert.equal(shouldEndClassicSession({ mode: 'classic', attemptsRemaining: 0, activePrize: {} }), false);
  assert.equal(shouldEndClassicSession({ mode: 'practice', attemptsRemaining: 0, activePrize: null }), false);
});

test('session summary keeps every prize and totals awarded coins', () => {
  const entries = appendSessionPrize([], { prize: { id: 'bear' }, reward: { coins: 22 } });
  const next = appendSessionPrize(entries, { prize: { id: 'bunny' }, reward: { coins: 20 } });

  assert.deepEqual(summarizeSession(next), {
    prizeCount: 2,
    totalCoins: 42,
    entries: next,
  });
});

test('empty session summary reports zero prizes and coins', () => {
  assert.deepEqual(summarizeSession([]), {
    prizeCount: 0,
    totalCoins: 0,
    entries: [],
  });
});

test('classic controls lock only after its first attempt and unlock after ending', () => {
  assert.deepEqual(
    getSessionControlLocks({ mode: 'classic', attemptsUsed: 0, sessionEnded: false }),
    { mode: false, difficulty: false, restart: false }
  );
  assert.deepEqual(
    getSessionControlLocks({ mode: 'classic', attemptsUsed: 1, sessionEnded: false }),
    { mode: true, difficulty: true, restart: true }
  );
  assert.deepEqual(
    getSessionControlLocks({ mode: 'classic', attemptsUsed: 5, sessionEnded: true }),
    { mode: false, difficulty: false, restart: false }
  );
});

test('a collected release waits for the chute cascade before resolving', () => {
  assert.equal(
    isAttemptResolved({
      hasReleasedBody: false,
      bodySpeed: 0,
      resolvingFor: 900,
      millisecondsSinceCollection: 700,
    }),
    false
  );
  assert.equal(
    isAttemptResolved({
      hasReleasedBody: false,
      bodySpeed: 0,
      resolvingFor: 2600,
      millisecondsSinceCollection: 900,
    }),
    true
  );
  assert.equal(
    isAttemptResolved({
      hasReleasedBody: true,
      bodySpeed: 0.1,
      resolvingFor: 1500,
      millisecondsSinceCollection: 700,
    }),
    true
  );
});

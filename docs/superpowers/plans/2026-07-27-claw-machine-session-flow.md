# Claw Machine Session Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make prize collection continuous and reliable, end Classic with one combined daily summary, add a 10-second automatic-drop timer, preserve controls during mode changes, and provide an admin-only local testing reset.

**Architecture:** Phaser owns physics, attempt timing, and unique chute collection; React owns durable rewards, session aggregation, overlays, and daily eligibility. Pure helper modules define collection, timer, session-summary, and daily-lock decisions so the edge cases can be exercised with Node tests before scene and component wiring.

**Tech Stack:** React 19, Phaser 3 Matter physics, Vite, Node test runner, localStorage, existing Firebase authentication for admin-route access.

## Global Constraints

- Do not add dependencies.
- Practice stays unlimited and never opens an end modal.
- Classic uses the existing Easy 7, Normal 5, and Hard 4 attempt limits.
- Every aiming turn starts at exactly 10 seconds and auto-drops once at zero.
- Any unwon prize in the valid chute can be collected, including stacked or pushed prizes.
- Classic becomes unavailable only in the current browser after the final attempt resolves.
- Admin reset affects only the current browser and must preserve coins, stickers, records, and prize quantities.
- Do not persist or resume a partially completed Classic session after refresh.

---

### Task 1: Pure Session, Timer, Collection, and Daily-Lock Rules

**Files:**
- Create: `src/playroom/games/claw-machine/systems/SessionFlow.js`
- Create: `src/playroom/games/claw-machine/systems/SessionFlow.test.js`
- Modify: `src/playroom/games/claw-machine/systems/PrizePresentation.js`
- Modify: `src/playroom/games/claw-machine/systems/PrizePresentation.test.js`
- Modify: `src/playroom/games/claw-machine/storage/clawMachineProgress.js`
- Create: `src/playroom/games/claw-machine/storage/clawMachineProgress.test.js`
- Modify: `src/playroom/storage/playroomStorage.js`
- Modify: `src/playroom/storage/playroomStorage.test.js`

**Interfaces:**
- Produces: `TURN_DURATION_MS`, `getTurnSecondsRemaining({ now, deadline })`, `shouldAutoDrop({ state, now, deadline, autoDropTriggered })`, `shouldEndClassicSession({ mode, attemptsRemaining, activePrize })`, `appendSessionPrize(entries, entry)`, and `summarizeSession(entries)`.
- Produces: `isCollectiblePrize({ isWon, inWinZone })`.
- Produces: `isClassicAvailable(progress, dateKey)` and `markClassicComplete(progress, dateKey)`.
- Storage shape: `progress.clawMachine.classicLastPlayedDate` is a normalized string and defaults to `''`.

- [ ] **Step 1: Write failing session-rule tests**

```js
test('turn countdown is clamped to ten through zero', () => {
  assert.equal(getTurnSecondsRemaining({ now: 1_000, deadline: 11_000 }), 10);
  assert.equal(getTurnSecondsRemaining({ now: 10_001, deadline: 11_000 }), 1);
  assert.equal(getTurnSecondsRemaining({ now: 11_001, deadline: 11_000 }), 0);
});

test('only an aiming turn auto-drops and it triggers once', () => {
  assert.equal(shouldAutoDrop({ state: 'AIMING', now: 11_000, deadline: 11_000, autoDropTriggered: false }), true);
  assert.equal(shouldAutoDrop({ state: 'DROPPING', now: 11_000, deadline: 11_000, autoDropTriggered: false }), false);
  assert.equal(shouldAutoDrop({ state: 'AIMING', now: 11_000, deadline: 11_000, autoDropTriggered: true }), false);
});

test('classic ends at zero only after the active prize resolves', () => {
  assert.equal(shouldEndClassicSession({ mode: 'classic', attemptsRemaining: 0, activePrize: null }), true);
  assert.equal(shouldEndClassicSession({ mode: 'classic', attemptsRemaining: 0, activePrize: {} }), false);
  assert.equal(shouldEndClassicSession({ mode: 'practice', attemptsRemaining: 0, activePrize: null }), false);
});

test('session summary totals all collected prizes and coins', () => {
  const entries = appendSessionPrize([], { prize: { id: 'bear' }, reward: { coins: 22 } });
  const next = appendSessionPrize(entries, { prize: { id: 'bunny' }, reward: { coins: 20 } });
  assert.deepEqual(summarizeSession(next), { prizeCount: 2, totalCoins: 42, entries: next });
});
```

- [ ] **Step 2: Write failing collection and daily-lock tests**

```js
test('any unwon prize inside the chute is collectible', () => {
  assert.equal(isCollectiblePrize({ isWon: false, inWinZone: true }), true);
  assert.equal(isCollectiblePrize({ isWon: true, inWinZone: true }), false);
  assert.equal(isCollectiblePrize({ isWon: false, inWinZone: false }), false);
});

test('classic completion locks only the current local date', () => {
  const progress = { coins: 90, clawMachine: { classicLastPlayedDate: '', prizeQuantities: { bear: 2 } } };
  const completed = markClassicComplete(progress, '2026-07-27');
  assert.equal(isClassicAvailable(completed, '2026-07-27'), false);
  assert.equal(isClassicAvailable(completed, '2026-07-28'), true);
});
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```powershell
npm test -- src/playroom/games/claw-machine/systems/SessionFlow.test.js src/playroom/games/claw-machine/systems/PrizePresentation.test.js src/playroom/games/claw-machine/storage/clawMachineProgress.test.js src/playroom/storage/playroomStorage.test.js
```

Expected: FAIL because the new exports and normalized field do not exist and the old released-body-only assertion conflicts with the desired behavior.

- [ ] **Step 4: Implement the minimal pure rules**

```js
export const TURN_DURATION_MS = 10_000;

export const getTurnSecondsRemaining = ({ now, deadline }) =>
  Math.max(0, Math.min(10, Math.ceil((deadline - now) / 1000)));

export const shouldAutoDrop = ({ state, now, deadline, autoDropTriggered }) =>
  state === 'AIMING' && !autoDropTriggered && deadline > 0 && now >= deadline;

export const shouldEndClassicSession = ({ mode, attemptsRemaining, activePrize }) =>
  mode === 'classic' && attemptsRemaining <= 0 && !activePrize;

export const appendSessionPrize = (entries, entry) => [...entries, entry];

export const summarizeSession = (entries) => ({
  prizeCount: entries.length,
  totalCoins: entries.reduce((total, entry) => total + Math.max(0, Number(entry.reward?.coins) || 0), 0),
  entries,
});
```

Implement `isCollectiblePrize` as `!isWon && inWinZone`. Add the storage field, availability check, and completion helper as immutable object updates.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the Step 3 command.

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/playroom/games/claw-machine/systems/SessionFlow.js src/playroom/games/claw-machine/systems/SessionFlow.test.js src/playroom/games/claw-machine/systems/PrizePresentation.js src/playroom/games/claw-machine/systems/PrizePresentation.test.js src/playroom/games/claw-machine/storage/clawMachineProgress.js src/playroom/games/claw-machine/storage/clawMachineProgress.test.js src/playroom/storage/playroomStorage.js src/playroom/storage/playroomStorage.test.js
git commit -m "test: define claw session and daily rules"
```

### Task 2: Continuous Phaser Prize Collection and Classic Session Ending

**Files:**
- Modify: `src/playroom/games/claw-machine/phaser/scenes/ClawMachineScene.js`
- Modify: `src/playroom/games/claw-machine/systems/GameFlow.js`
- Modify: `src/playroom/games/claw-machine/systems/GameFlow.test.js`

**Interfaces:**
- Consumes: Task 1 timer, collection, and Classic-end helpers.
- Emits: `prize-collected` once per body with `{ prize, attemptsUsed, remainingAttempts, elapsedSeconds, bonuses }`.
- Emits: `classic-session-ended` exactly once after the final attempt resolves.
- UI payload adds `turnSecondsRemaining` and `classicSessionEnded`.

- [ ] **Step 1: Add failing GameFlow tests**

```js
test('classic final miss requests a session end after lifting', () => {
  assert.equal(getLiftOutcomeState({ capturedPrize: null, attemptsRemaining: 0 }), 'FAILED');
});

test('practice final-like state returns to aiming', () => {
  assert.equal(getNextAttemptState({ mode: 'practice', attemptsRemaining: 0 }), 'AIMING');
});
```

Add an exported `getNextAttemptState({ mode, attemptsRemaining })` returning `FAILED` only for exhausted Classic and `AIMING` otherwise.

- [ ] **Step 2: Run GameFlow tests and verify RED**

Run:

```powershell
npm test -- src/playroom/games/claw-machine/systems/GameFlow.test.js
```

Expected: FAIL because `getNextAttemptState` is missing.

- [ ] **Step 3: Implement scene timer and unique collection**

In `ClawMachineScene`:

- Set `turnDeadline = this.time.now + TURN_DURATION_MS` whenever entering a playable `READY` or `AIMING` turn.
- Reset `autoDropTriggered = false` for that turn.
- Include `turnSecondsRemaining` in `getUiPayload`.
- In `update`, call `dropGrab()` once when `shouldAutoDrop` becomes true.
- Replace the released-body identity check in `checkPrizeWon` with `isCollectiblePrize`.
- Mark `prizeBody.plugin.won = true` before emitting or animating.
- Do not set `SUCCESS`.
- Emit `prize-collected` immediately.
- Make the collected body static, animate it through the chute, destroy it, remove its entry from `this.prizes`, and add it to the won shelf.
- If the collected body is `this.releasedPrize`, clear that reference but keep the resolving window active.

- [ ] **Step 4: Implement one final-session event**

Add `finishAttempt(statusMessage)` and `endClassicSession()` methods:

- `finishAttempt` checks `shouldEndClassicSession`.
- Exhausted Classic sets `FAILED`, sets `classicSessionEnded = true`, and emits `classic-session-ended` only when the flag was previously false.
- Practice or Classic with tries remaining enters `AIMING`, starts a fresh 10-second turn, and clears release/grip state.
- `updateCableLength` uses `finishAttempt` after a missed lift.
- `updateResolving` tolerates a collected/destroyed released prize and calls `finishAttempt` after the settle or timeout window.

- [ ] **Step 5: Run tests, lint, and build**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected: all commands succeed with no new warnings or errors.

- [ ] **Step 6: Commit**

```powershell
git add src/playroom/games/claw-machine/phaser/scenes/ClawMachineScene.js src/playroom/games/claw-machine/systems/GameFlow.js src/playroom/games/claw-machine/systems/GameFlow.test.js
git commit -m "fix: collect chute prizes throughout claw sessions"
```

### Task 3: Stable Phaser Bridge Across Mode and Difficulty Changes

**Files:**
- Create: `src/playroom/games/claw-machine/systems/EventBridge.js`
- Create: `src/playroom/games/claw-machine/systems/EventBridge.test.js`
- Modify: `src/playroom/games/claw-machine/ClawMachineGame.jsx`
- Modify: `src/playroom/games/claw-machine/phaser/createClawGame.js`

**Interfaces:**
- Produces: `createEventBridge(initialHandler)` returning stable `emit(type, detail)` and `update(nextHandler)` functions.
- The Phaser game initializes once for the component lifetime.
- The event bridge always targets the latest page callback without changing `emit` identity.
- `bridge.setMode(mode)` and `bridge.setDifficulty(difficulty)` reset the existing scene without replacing the canvas or controls object.

- [ ] **Step 1: Create a failing bridge lifecycle regression test**

```js
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
```

- [ ] **Step 2: Run the bridge test and verify RED**

Run:

```powershell
npm test -- src/playroom/games/claw-machine/systems/EventBridge.test.js
```

Expected: FAIL because `createEventBridge` is missing.

- [ ] **Step 3: Stabilize the React lifecycle**

- Create one event bridge in a ref and call `eventBridge.update(onEvent)` when the callback changes.
- Make the component's `emit` stable by using `eventBridge.emit`.
- Initialize `createClawGame` with refs holding the initial mode and difficulty.
- Remove `mode`, `difficulty`, and callback identity from the game-construction effect dependencies.
- Keep the existing imperative prop-sync effects for `setMode` and `setDifficulty`.
- Reset both movement flags inside scene restart and bridge destruction so held input cannot leak across changes.

- [ ] **Step 4: Run the bridge test, lint, and build**

Run:

```powershell
npm test -- src/playroom/games/claw-machine/systems/EventBridge.test.js
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/playroom/games/claw-machine/ClawMachineGame.jsx src/playroom/games/claw-machine/phaser/createClawGame.js src/playroom/games/claw-machine/systems/EventBridge.js src/playroom/games/claw-machine/systems/EventBridge.test.js
git commit -m "fix: preserve claw controls across mode changes"
```

### Task 4: React Session Totals, Side Card, Countdown HUD, and Combined Summary

**Files:**
- Modify: `src/playroom/games/claw-machine/AshlifeClawMachinePage.jsx`
- Modify: `src/playroom/games/claw-machine/components/GameHUD.jsx`
- Create: `src/playroom/games/claw-machine/components/SessionCard.jsx`
- Delete: `src/playroom/games/claw-machine/components/SuccessModal.jsx`
- Create: `src/playroom/games/claw-machine/components/SessionSummaryModal.jsx`
- Modify: `src/playroom/games/claw-machine/styles/claw-machine.css`

**Interfaces:**
- Consumes: `appendSessionPrize`, `summarizeSession`, `isClassicAvailable`, and `markClassicComplete`.
- Produces: `getSessionControlLocks({ mode, attemptsUsed, sessionEnded })` in `SessionFlow.js`.
- `SessionCard` receives `{ mode, entries }`.
- `SessionSummaryModal` receives `{ open, summary, attemptsUsed, onBackToPlayroom, onPlayPractice }`.
- HUD reads `status.turnSecondsRemaining`.

- [ ] **Step 1: Add a failing control-lock test**

Extend `SessionFlow.test.js`:

```js
test('classic controls lock only after its first attempt and unlock after ending', () => {
  assert.deepEqual(getSessionControlLocks({ mode: 'classic', attemptsUsed: 0, sessionEnded: false }), {
    mode: false,
    difficulty: false,
    restart: false,
  });
  assert.deepEqual(getSessionControlLocks({ mode: 'classic', attemptsUsed: 1, sessionEnded: false }), {
    mode: true,
    difficulty: true,
    restart: true,
  });
  assert.deepEqual(getSessionControlLocks({ mode: 'classic', attemptsUsed: 5, sessionEnded: true }), {
    mode: false,
    difficulty: false,
    restart: false,
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm test -- src/playroom/games/claw-machine/systems/SessionFlow.test.js
```

Expected: FAIL because `getSessionControlLocks` is missing.

- [ ] **Step 3: Implement the control-lock helper, atomic reward, and session aggregation**

In the page:

- Implement and consume `getSessionControlLocks`.
- Keep `sessionEntriesRef` synchronized immediately before `setSessionEntries`.
- On `prize-collected`, calculate the reward from `progressRef.current`, immediately assign `progressRef.current = nextProgress`, persist with `updateProgress(nextProgress)`, and append `{ prize, reward }`.
- On `classic-session-ended`, mark the current local date immediately, snapshot `summarizeSession(sessionEntriesRef.current)`, and open the combined modal.
- Reset session entries only for Practice restart, a pre-attempt mode/difficulty change, or starting a new eligible Classic session.
- If stored mode is Classic but already completed today, initialize in Practice.
- Disable mode, difficulty, and Restart controls after the first Classic attempt until summary.

- [ ] **Step 4: Build the session UI**

- Replace the HUD elapsed timer with `turnSecondsRemaining`, defaulting to 10.
- Put `SessionCard` above Controls in the side panel.
- Show `Dolls won`, `Session coins`, and up to five recent thumbnails plus a `+N` overflow label.
- Replace `SuccessModal` with one summary grid showing all collected prizes, total dolls, total coins, tries used, and zero-win copy.
- Summary actions are `Play Practice` and `Back to Playroom`.
- Disable and relabel Classic as `Completed today` when the daily lock is active.

- [ ] **Step 5: Run tests, lint, and build**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected: all succeed.

- [ ] **Step 6: Commit**

```powershell
git add src/playroom/games/claw-machine/AshlifeClawMachinePage.jsx src/playroom/games/claw-machine/components/GameHUD.jsx src/playroom/games/claw-machine/components/SessionCard.jsx src/playroom/games/claw-machine/components/SessionSummaryModal.jsx src/playroom/games/claw-machine/components/SuccessModal.jsx src/playroom/games/claw-machine/styles/claw-machine.css src/playroom/games/claw-machine/systems/SessionFlow.test.js
git commit -m "feat: add continuous claw session summary"
```

### Task 5: Admin-Only Browser Testing Reset

**Files:**
- Modify: `src/pages/AdminDashboard.jsx`
- Modify: `src/pages/Admin.css`
- Modify: `src/playroom/games/claw-machine/storage/clawMachineProgress.test.js`

**Interfaces:**
- Produces: `clearClassicDailyLock(progress)` in `clawMachineProgress.js`.
- Consumes: `loadPlayroomProgress`, `savePlayroomProgress`, and `clearClassicDailyLock`.
- The reset handler loads current browser progress, clears only `classicLastPlayedDate`, saves it, and shows an admin toast.

- [ ] **Step 1: Add a failing preservation test**

```js
test('admin test reset preserves every non-lock field', () => {
  const progress = {
    coins: 123,
    unlockedStickers: ['bear-heart'],
    clawMachine: { classicLastPlayedDate: '2026-07-27', prizeQuantities: { bear: 3 } },
  };
  const reset = clearClassicDailyLock(progress);
  assert.equal(reset.coins, 123);
  assert.deepEqual(reset.unlockedStickers, ['bear-heart']);
  assert.deepEqual(reset.clawMachine.prizeQuantities, { bear: 3 });
  assert.equal(reset.clawMachine.classicLastPlayedDate, '');
});
```

- [ ] **Step 2: Run the storage test and verify RED**

Temporarily assert against the current missing helper before Task 1 implementation, or add this test during Task 1 RED. At Task 5, rerun it to guard the admin wiring contract.

Run:

```powershell
npm test -- src/playroom/games/claw-machine/storage/clawMachineProgress.test.js
```

Expected: FAIL because `clearClassicDailyLock` does not exist yet.

- [ ] **Step 3: Implement the immutable reset helper and Admin Dashboard control**

Implement `clearClassicDailyLock` by changing only `clawMachine.classicLastPlayedDate` to `''`. Add a `Playroom Testing` card under Payment Settings with explanatory browser-only copy and a `Reset Classic Daily Test` button. The handler:

```js
const handleResetClassicDailyTest = () => {
  const current = loadPlayroomProgress();
  savePlayroomProgress(clearClassicDailyLock(current));
  showToast('success', 'Classic daily test reset for this browser.');
};
```

- [ ] **Step 4: Run tests, lint, and build**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected: all succeed.

- [ ] **Step 5: Commit**

```powershell
git add src/pages/AdminDashboard.jsx src/pages/Admin.css src/playroom/games/claw-machine/storage/clawMachineProgress.test.js
git commit -m "feat: add admin claw daily test reset"
```

### Task 6: Automated and Rendered Verification

**Files:**
- Modify only if a verification failure reveals a defect in the files above.
- Do not commit screenshots, traces, or temporary browser scripts.

**Interfaces:**
- Test route: `/play/claw-machine/?clawTest=1`.
- Debug state remains available through `data-claw-debug` and `window.__ASHLIFE_CLAW_TEST__.getState()`.

- [ ] **Step 1: Run the full automated suite**

```powershell
npm test
npm run lint
npm run build
git diff --check
```

Expected: all exit successfully.

- [ ] **Step 2: Verify desktop rendered behavior**

At a desktop viewport:

- Confirm page identity, meaningful DOM, no framework overlay, and no relevant console warnings/errors.
- Switch Practice → Classic → Practice before an attempt and verify the same canvas remains responsive.
- Switch difficulty before an attempt and verify movement remains responsive.
- Observe HUD countdown from 10 toward 0 and confirm one automatic transition to `DROPPING`.
- Use test-mode gameplay to collect a prize and confirm the body leaves the chute, the won shelf updates, the side card increments, and no prize modal appears.
- Exhaust Classic tries and confirm one combined summary appears.
- Close to Practice and confirm Classic shows `Completed today`.

- [ ] **Step 3: Verify admin reset**

In the authenticated admin route on the same browser:

- Click `Reset Classic Daily Test`.
- Confirm the success toast.
- Return to the claw route and confirm Classic is available while existing Joy Coins and collected prizes remain.

- [ ] **Step 4: Verify mobile layout**

At a viewport at or below 620px:

- Confirm HUD pills, canvas, touch controls, Session Card, and summary fit without clipping or horizontal scroll.
- Exercise one touch control and verify the corresponding visible game state changes.

- [ ] **Step 5: Capture final evidence and inspect the working tree**

- Capture desktop gameplay, Classic summary, and mobile screenshots outside the repository.
- Review `git status --short` and `git diff --stat`.
- Ensure only intended source, test, spec, and plan files changed.

- [ ] **Step 6: Final verification commit if required**

If verification required code changes:

```powershell
git add src/playroom/games/claw-machine src/playroom/storage/playroomStorage.js src/pages/AdminDashboard.jsx src/pages/Admin.css
git commit -m "fix: polish claw session verification"
```

If no code changes were required, do not create an empty commit.

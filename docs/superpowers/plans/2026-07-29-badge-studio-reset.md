# Badge Studio Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bilingual, confirmed “Reset all” action that safely clears the current Badge Studio project and its IndexedDB draft.

**Architecture:** Keep the dialog as a focused presentation component, put storage-and-URL cleanup in a small tested reset service, and let `BadgeStudioPage` own the React state reset. Cancel the autosave timer before clearing storage to prevent stale draft recreation.

**Tech Stack:** React, IndexedDB, Node test runner, CSS, Vite.

## Global Constraints

- Show Reset all only when at least one badge design exists.
- No must preserve the entire project.
- Yes must clear IndexedDB before clearing visible state.
- A storage failure must preserve the project and show a localized error.
- Do not allow reset during an active order upload.
- English and Chinese copy must both be complete.

---

### Task 1: Tested reset behavior and localized copy

**Files:**
- Create: `src/playroom/games/badge-studio/badgeStudioReset.js`
- Create: `src/playroom/games/badge-studio/badgeStudioReset.test.js`
- Modify: `src/playroom/games/badge-studio/badgeStudioCopy.js`
- Modify: `src/playroom/games/badge-studio/badgeStudioCopy.test.js`

**Interfaces:**
- Consumes: `clearBadgeDraft()` and the page’s current design array.
- Produces: `clearBadgeStudioProject({ designs, clearDraft, revokeObjectUrl })`.

- [ ] **Step 1: Add failing copy tests**

Assert that Chinese provides `全部重置`, `否，保留设计`, `是，全部重置`, and a reset failure message while English retains equivalent English copy.

- [ ] **Step 2: Run the focused copy test**

Run: `node --test src/playroom/games/badge-studio/badgeStudioCopy.test.js`

Expected: FAIL because the reset copy does not exist.

- [ ] **Step 3: Add failing reset-service tests**

Use stateful test callbacks to prove that IndexedDB clearing occurs before `blob:` URLs are revoked and that a rejected clear does not revoke any URL.

- [ ] **Step 4: Run the focused reset test**

Run: `node --test src/playroom/games/badge-studio/badgeStudioReset.test.js`

Expected: FAIL because `clearBadgeStudioProject` does not exist.

- [ ] **Step 5: Implement the minimal reset service and copy**

```js
export async function clearBadgeStudioProject({ designs, clearDraft, revokeObjectUrl }) {
  await clearDraft();
  designs.forEach((design) => {
    if (design.imageUrl?.startsWith('blob:')) revokeObjectUrl(design.imageUrl);
  });
}
```

Add complete `reset` copy objects to both language maps.

- [ ] **Step 6: Run both focused test files**

Run: `node --test src/playroom/games/badge-studio/badgeStudioCopy.test.js src/playroom/games/badge-studio/badgeStudioReset.test.js`

Expected: PASS.

### Task 2: Confirmation dialog and page integration

**Files:**
- Create: `src/playroom/games/badge-studio/components/ResetProjectDialog.jsx`
- Modify: `src/playroom/games/badge-studio/BadgeStudioPage.jsx`
- Modify: `src/playroom/games/badge-studio/badge-studio.css`

**Interfaces:**
- Consumes: `copy.reset`, `clearBadgeStudioProject`, and `clearBadgeDraft`.
- Produces: a conditional Reset all button and confirmed project reset.

- [ ] **Step 1: Add the dialog component**

Render a localized `role="dialog"` with No and Yes buttons, Escape cancellation, and a working/disabled state.

- [ ] **Step 2: Make the autosave timer cancellable**

Store the pending timeout in `autosaveTimerRef`; clear it before starting reset and in the autosave effect cleanup.

- [ ] **Step 3: Implement successful reset**

After `clearBadgeStudioProject` resolves, reset every project state field to its initial value and close the dialog.

- [ ] **Step 4: Implement failed reset**

If storage clearing rejects, retain current state, close the dialog, and show `copy.reset.failed`.

- [ ] **Step 5: Style desktop and mobile UI**

Add a compact header action, accessible modal backdrop, distinct destructive confirmation button, and mobile layout rules.

- [ ] **Step 6: Run rendered verification**

Test `/ashlife/play/badge-studio/` in English and Chinese:

1. Restore a saved project.
2. Open reset and choose No; confirm designs remain.
3. Open reset and choose Yes; confirm the empty Upload step.
4. Reload; confirm the cleared project does not return.
5. Check desktop and 390 × 844 mobile layouts and browser console health.

- [ ] **Step 7: Run final automated verification**

Run:

```text
npm test
npm run lint
npm run build:github
```

Expected: all tests pass, lint exits cleanly, and the GitHub Pages build succeeds.

# Badge Studio Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the DIY badge size to 58 mm, promote Badge Studio from the DIY badge product, and place the Studio after all actual games in Playroom.

**Architecture:** Keep the existing route and Badge Studio implementation unchanged. Add a small badge-only promotional component in `DIY.jsx`, style it within the existing DIY stylesheet, and reorder the existing Playroom JSX without changing its game state.

**Tech Stack:** React, React Router, Lucide icons, CSS, Node test runner, Vite.

## Global Constraints

- The product size is 58 mm everywhere.
- The Badge Studio route remains `/play/badge-studio/`.
- The DIY promotion appears only for the badge product.
- Badge Studio appears after every game-related section in Playroom.
- Preserve existing WhatsApp ordering and unrelated user changes.

---

### Task 1: Define the DIY badge promotion content

**Files:**
- Create: `src/pages/diyBadgeStudioContent.js`
- Modify: `src/pages/DIY.jsx`
- Modify: `public/diy/badge-info-en.svg`
- Modify: `public/diy/badge-info-zh.svg`
- Test: `src/pages/diyBadgeStudioContent.test.js`

**Interfaces:**
- Produces: `getBadgeStudioPromotion(language)` returning localized title, description, feature labels, and CTA.
- Consumes: `language` from `useLanguage`.

- [ ] **Step 1: Write the failing test**

Create a test that imports `getBadgeStudioPromotion` and asserts the English output contains `58 mm`, uses the Studio CTA, and that the Chinese output has non-empty localized fields.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/pages/diyBadgeStudioContent.test.js`

Expected: FAIL because `diyBadgeStudioContent.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `src/pages/diyBadgeStudioContent.js` with a pure localized content function, then consume it from a badge-only `BadgeStudioPromo` component in `DIY.jsx`. Replace all 25 mm badge references in the product copy and both information-card SVGs with 58 mm, then insert the promotion after the badge description.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/pages/diyBadgeStudioContent.test.js`

Expected: PASS.

### Task 2: Style the DIY callout

**Files:**
- Modify: `src/pages/DIY.css`

**Interfaces:**
- Consumes: `.diy-badge-studio-promo` markup from Task 1.
- Produces: responsive desktop and mobile presentation.

- [ ] **Step 1: Add the existing-design-system styling**

Use a teal-tinted surface, gold accent, rounded corners, existing badge imagery, clear feature rows, and a prominent internal navigation button. Stack the content and make the CTA full-width below 480 px.

- [ ] **Step 2: Verify responsive CSS**

Inspect at desktop and 375 px width; confirm no horizontal overflow and no collision with the product price or WhatsApp CTA.

### Task 3: Move Badge Studio below the games

**Files:**
- Modify: `src/playroom/pages/PlayroomPage.jsx`
- Modify: `src/playroom/styles/playroom.css` only if spacing needs adjustment.

**Interfaces:**
- Preserves: existing Badge Studio feature card and route.
- Changes: document order only.

- [ ] **Step 1: Reorder the existing section**

Move the Badge Studio heading and feature card from before the claw-machine section to after `.coming-soon-grid`. Keep all existing labels, images, and links.

- [ ] **Step 2: Verify keyboard and visual order**

Tab through the Playroom landing view and confirm Claw Machine, Memory Match, Coming Soon, then Badge Studio.

### Task 4: Complete verification

**Files:**
- Verify: all modified files

- [ ] **Step 1: Run focused and full tests**

Run `node --test src/pages/diyBadgeStudioContent.test.js`, then `npm test`.

- [ ] **Step 2: Run static and production checks**

Run `npm run lint`, `npm run build:github`, and `git diff --check`.

- [ ] **Step 3: Perform browser QA**

Verify `/ashlife/diy` initially displays a 58 mm badge listing and Studio CTA, the CTA opens `/ashlife/play/badge-studio/`, and Playroom displays Badge Studio last at desktop and mobile widths.

# Badge Wrap Area and Front Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Badge Studio clearly distinguish the 70 mm cut artwork, 58 mm finished front, 54 mm safe content area, and the wrap band while preserving the full-bleed print export.

**Architecture:** Add one geometry helper derived from centralized badge dimensions, consume it through CSS custom properties in `BadgeArtwork`, and render an editor-only finished-front preview from the same design state. The A4 export path remains unchanged and continues clipping at the 70 mm cut diameter.

**Tech Stack:** React, CSS custom properties, Node test runner, Vite.

## Global Constraints

- Keep `productSizeMm: 58`, `artworkDiameterMm: 70`, and `safeAreaDiameterMm: 54` centralized in `badgeStudioConfig.js`.
- Extend the image through the full 70 mm print/cut circle.
- Do not render editor guides or the finished-front preview into exported PNG/PDF files.
- Provide complete English and Simplified Chinese copy.
- Do not add dependencies or change unrelated pages.

---

### Task 1: Guide Geometry Contract

**Files:**
- Modify: `src/playroom/games/badge-studio/badgeStudioLogic.test.js`
- Modify: `src/playroom/games/badge-studio/badgeStudioLogic.js`

**Interfaces:**
- Produces: `getBadgeGuideGeometry({ artworkDiameterMm, productSizeMm, safeAreaDiameterMm })` returning `frontInsetPercent`, `safeInsetPercent`, `frontScale`, and `wrapWidthMm`.

- [ ] **Step 1: Write the failing geometry test** with hand-derived expectations: 8.5714% front inset, 11.4286% safe inset, 70/58 front scale, and 6 mm radial wrap width.
- [ ] **Step 2: Run `node --test src/playroom/games/badge-studio/badgeStudioLogic.test.js`** and verify failure because the helper is missing.
- [ ] **Step 3: Implement the geometry helper** with validated positive diameters and centralized defaults.
- [ ] **Step 4: Re-run the focused test** and verify it passes.

### Task 2: Bilingual Badge-Zone Copy

**Files:**
- Modify: `src/playroom/games/badge-studio/badgeStudioCopy.test.js`
- Modify: `src/playroom/games/badge-studio/badgeStudioCopy.js`

**Interfaces:**
- Produces: `canvas.cutEdge`, `canvas.frontFace`, `canvas.safeArea`, `canvas.wrapArea`, `canvas.wrapExplanation`, `canvas.frontPreviewTitle`, and `canvas.frontPreviewDescription` in English and Chinese.

- [ ] **Step 1: Extend copy tests first** to require the three guide names, wrap explanation, and preview description in both languages.
- [ ] **Step 2: Run the focused copy test** and verify the new assertions fail.
- [ ] **Step 3: Add concise bilingual copy** explaining what prints, what remains on the front, and what wraps around the side.
- [ ] **Step 4: Re-run the focused copy test** and verify it passes.

### Task 3: Three-Zone Editor and Finished Preview

**Files:**
- Modify: `src/playroom/games/badge-studio/components/BadgeArtwork.jsx`
- Modify: `src/playroom/games/badge-studio/components/BadgeCanvas.jsx`
- Modify: `src/playroom/games/badge-studio/badge-studio.css`

**Interfaces:**
- Consumes: `getBadgeGuideGeometry()` and the new `canvas` copy fields.
- Produces: editor-only cut, front-face, safe-area, and wrap-zone overlays plus a 58 mm finished-front preview.

- [ ] **Step 1: Pass guide geometry through CSS custom properties** so no percentage is hardcoded in component markup.
- [ ] **Step 2: Add the 58 mm front guide and wrap-band overlay** while keeping the image visible through the 70 mm cut edge.
- [ ] **Step 3: Expand the legend and instruction card** to explain all three zones without relying on color alone.
- [ ] **Step 4: Render a centered 58 mm finished-front preview** using the same image transform and a scaled copy of the 70 mm artwork.
- [ ] **Step 5: Add desktop and mobile styling** with large enough labels and no overlap with editing controls.

### Task 4: Rendered and Regression Verification

**Files:**
- No committed test artifacts.

**Interfaces:**
- Verifies the complete user-facing workflow.

- [ ] **Step 1: Run the focused tests** for geometry and copy.
- [ ] **Step 2: Start the Vite site at the configured GitHub Pages base path.**
- [ ] **Step 3: Browser-test `/ashlife/play/badge-studio/`** with a restored or uploaded design: verify the 70 mm cut guide, 58 mm finished-front guide, 54 mm safe guide, wrap explanation, and finished-front preview.
- [ ] **Step 4: Repeat at a mobile viewport** and confirm no clipping or overlap.
- [ ] **Step 5: Check browser warnings/errors and capture screenshot evidence.**
- [ ] **Step 6: Run `npm test`, `npm run lint`, `npm run build:github`, and `git diff --check`.**

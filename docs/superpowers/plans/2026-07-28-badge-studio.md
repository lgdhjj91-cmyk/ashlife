# Ashlife Badge Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Playroom-integrated, mobile-first badge editor that produces accurate A4 print files and can submit completed orders to private Google Drive storage through Apps Script.

**Architecture:** React owns the five-step workflow and design collection. Pure helpers own print math, validation, quality, quantity expansion, and order IDs; an off-screen Canvas service owns image rendering; IndexedDB owns drafts; a small Apps Script web app owns private Drive writes.

**Tech Stack:** React 19, React Router 7, Vite 5, Canvas 2D, jsPDF, IndexedDB, Node test runner, Google Apps Script.

## Global Constraints

- Preserve existing pages and the user's modified `public/brand/shop-poster-optimized.webp`.
- Keep editor work in the browser; do not use Firebase, paid APIs, or AI features.
- Support 58 mm badges with centralized 70 mm artwork and 54 mm safe-area defaults.
- Render A4 at 300 DPI and never export the visible HTML as the print file.
- Submit only generated print files, preview, and JSON metadata.
- The studio must remain usable when Apps Script is not configured.

---

### Task 1: Pure Badge and Order Rules

**Files:**
- Create: `src/playroom/games/badge-studio/badgeStudioLogic.test.js`
- Create: `src/playroom/games/badge-studio/badgeStudioLogic.js`
- Create: `src/playroom/games/badge-studio/badgeStudioConfig.js`

**Interfaces:**
- Produces `mmToPx`, `getCoverTransform`, `classifyImageQuality`, `expandDesignQuantities`, `paginateSlots`, `moveSlot`, `createOrderId`, `sanitizeFileName`, and `validateImageFile`.

- [ ] Write tests with hand-checked A4 dimensions, quantity order, pagination, quality thresholds, order pattern, and file validation.
- [ ] Run the focused test and confirm it fails because the module does not exist.
- [ ] Add the minimal pure implementation and centralized configuration.
- [ ] Run the focused test and confirm it passes.

### Task 2: Editor Workflow and Playroom Entry

**Files:**
- Create: `src/playroom/games/badge-studio/BadgeStudioPage.jsx`
- Create: `src/playroom/games/badge-studio/components/BadgeCanvas.jsx`
- Create: `src/playroom/games/badge-studio/components/DesignCollection.jsx`
- Create: `src/playroom/games/badge-studio/components/A4SheetPreview.jsx`
- Create: `src/playroom/games/badge-studio/badge-studio.css`
- Modify: `src/App.jsx`
- Modify: `src/playroom/pages/PlayroomPage.jsx`
- Modify: `src/playroom/styles/playroom.css`

**Interfaces:**
- `BadgeCanvas` consumes a design and emits transform patches.
- `DesignCollection` consumes designs and emits edit, duplicate, delete, and quantity actions.
- `A4SheetPreview` consumes expanded slots and emits reorder actions.

- [ ] Add the lazy `/play/badge-studio` route and featured Playroom card.
- [ ] Implement upload validation and one-design-per-photo creation.
- [ ] Implement pointer drag, pinch zoom, sliders, rotation, reset, replace, duplicate, delete, and quantity.
- [ ] Implement the five-step responsive shell and A4 arrangement screen.
- [ ] Verify keyboard focus, touch targets, and reduced motion.

### Task 3: Draft Persistence and Print Export

**Files:**
- Create: `src/playroom/games/badge-studio/draftStorage.js`
- Create: `src/playroom/games/badge-studio/badgeExportService.js`
- Modify: `src/playroom/games/badge-studio/BadgeStudioPage.jsx`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- `saveBadgeDraft({ designs, orderDetails, step })`
- `loadBadgeDraft()`
- `clearBadgeDraft()`
- `exportBadgeOrder({ designs, slots, order })` returns `{ pngFiles, pdfFile, previewFile, jsonFile, manifest }`.

- [ ] Add `jspdf`.
- [ ] Persist image blobs and serializable design data in IndexedDB.
- [ ] Restore object URLs from stored blobs on load.
- [ ] Render clipped, transformed source images to off-screen 300 DPI A4 canvases.
- [ ] Generate PNG sheets, true-A4 PDF, preview JPEG, and JSON.
- [ ] Add individual and bundled download actions.

### Task 4: Apps Script Submission

**Files:**
- Create: `src/playroom/games/badge-studio/appsScriptSubmission.js`
- Create: `google-apps-script/Code.gs`
- Create: `google-apps-script/appsscript.json`
- Create: `google-apps-script/README.md`
- Create: `google-apps-script/SETUP.md`
- Modify: `.env.example`

**Interfaces:**
- `submitBadgeOrder({ endpoint, appKey, order, files, onProgress, signal })`
- Apps Script actions: `startOrder`, `uploadFile`, `completeOrder`, `checkOrder`.

- [ ] Implement sequential simple-request JSON posting without custom headers.
- [ ] Add retry-safe order initialization and file upload progress.
- [ ] Validate Script Properties, order IDs, MIME types, extensions, sizes, count, duplicates, cooldown, and submission switch.
- [ ] Create private year/month/order folders and return only order ID/status.
- [ ] Document deployment, GitHub Pages environment variables, logs, testing, and the static-key limitation.

### Task 5: Details, Finish, and Fallback

**Files:**
- Modify: `src/playroom/games/badge-studio/BadgeStudioPage.jsx`
- Modify: `src/playroom/games/badge-studio/badge-studio.css`

**Interfaces:**
- Order form produces normalized customer, channel, notes, honeypot, and acknowledgement fields.
- Finish screen consumes export files and submission status.

- [ ] Validate name, Malaysian-friendly WhatsApp number, design check, and conditional low-resolution acknowledgement.
- [ ] Generate one stable order ID for retries.
- [ ] Show export/submission stage progress and block duplicate submission.
- [ ] Keep backup downloads available on every failure path.
- [ ] Build the WhatsApp confirmation link from `VITE_WHATSAPP_NUMBER`.

### Task 6: Verification

**Files:**
- Modify only when verification reveals a defect.

- [ ] Run `npm test`, `npm run lint`, `npm run build:github`, and `git diff --check`.
- [ ] Verify `/play` and `/play/badge-studio` in the in-app browser.
- [ ] Exercise upload, transform, duplicate, quantity, arrangement, details, export, retry, and download.
- [ ] Verify at desktop and 390 px mobile viewport.
- [ ] Capture screenshots outside source folders and inspect them with `view_image`.
- [ ] Compare implementation with both accepted concept images across layout, copy, palette, typography, controls, spacing, and responsive behavior.


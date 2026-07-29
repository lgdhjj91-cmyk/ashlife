# Homepage Spacing Rhythm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten three homepage section transitions so the lower page reads as a continuous shopping flow.

**Architecture:** Keep the existing JSX and section structure unchanged. Adjust only the outer spacing declarations in `Home.css`, then verify the rendered distances with a temporary Playwright browser contract at desktop and mobile widths.

**Tech Stack:** React, native CSS, Vite, Node test runner, ESLint, Playwright

## Global Constraints

- Modify only homepage spacing and implementation documentation.
- Preserve section order, content, colors, typography, imagery, interactions, and internal component padding.
- Desktop targets at 1502px width use a 2px tolerance: 96px, 72px, and 72px.
- Mobile targets at 390px width use a 2px tolerance: 56px, 48px, and 48px.
- Keep zero horizontal overflow and zero browser errors.

---

### Task 1: Tighten homepage section rhythm

**Files:**
- Modify: `src/pages/Home.css`
- Test: `C:/Users/hjj/AppData/Local/Temp/playwright-audit-home-spacing.js`

**Interfaces:**
- Consumes: Existing `.home-products`, `.home-ordering`, `.home-playroom`, and `.home-closing` section classes.
- Produces: The same public page structure with tighter computed gaps between those sections.

- [ ] **Step 1: Turn the browser audit into a failing spacing contract**

Add assertions after collecting the existing metrics:

```js
const targets = viewport.name === 'desktop'
  ? {
      productsContentToOrdering: 96,
      orderingToPlayroom: 72,
      playroomToClosing: 72,
    }
  : {
      productsContentToOrdering: 56,
      orderingToPlayroom: 48,
      playroomToClosing: 48,
    };

for (const [key, expected] of Object.entries(targets)) {
  if (Math.abs(metrics[key] - expected) > 2) {
    failures.push(
      `${viewport.name} ${key}: expected ${expected}px, received ${metrics[key]}px`
    );
  }
}
```

Initialize `const failures = [];` before the viewport loop and throw after closing the browser when any failures exist.

- [ ] **Step 2: Run the spacing contract and verify it fails**

Run:

```powershell
$env:TARGET_URL='http://localhost:5173'
node run.js 'C:\Users\hjj\AppData\Local\Temp\playwright-audit-home-spacing.js'
```

Working directory: `C:\Users\hjj\.codex\skills\playwright-skill`

Expected: FAIL because desktop currently measures 160px, 112px, and 112px, while mobile measures 88px, 64px, and 64px.

- [ ] **Step 3: Apply the minimal CSS spacing changes**

In `src/pages/Home.css`, use:

```css
.container.home-products {
  padding-top: clamp(2.5rem, 5vw, 4rem);
  padding-bottom: clamp(3rem, 5vw, 4rem);
}

.home-ordering {
  margin-block: clamp(1.5rem, 2.5vw, 2rem);
  padding-block: clamp(2.75rem, 5vw, 4rem);
  border-block: 1px solid rgba(22, 122, 114, 0.14);
  background: #eaf5f2;
}

.container.home-playroom {
  margin-block: clamp(3rem, 5vw, 4.5rem);
}
```

Inside `@media (max-width: 640px)`, use:

```css
.container.home-products {
  padding-top: 2.5rem;
  padding-bottom: 2.5rem;
}

.home-ordering {
  margin-block: 1rem;
  padding-block: 3rem;
}

.container.home-playroom {
  margin-block: 3rem;
}
```

Retain all other declarations in those rules unchanged.

- [ ] **Step 4: Run the browser contract and inspect screenshots**

Run the Step 2 command again.

Expected:

- Desktop: 96px, 72px, 72px
- Mobile: 56px, 48px, 48px
- Exit code 0
- Updated screenshots at:
  - `C:/Users/hjj/AppData/Local/Temp/ashlife-home-spacing-before-desktop.png`
  - `C:/Users/hjj/AppData/Local/Temp/ashlife-home-spacing-before-mobile.png`

Inspect both screenshots and confirm the page remains breathable, each background transition is clear, and no content is clipped.

- [ ] **Step 5: Run the complete verification**

Run:

```powershell
npm test
npm run lint
npm run build
git diff --check
```

Expected:

- 70 tests pass with 0 failures
- ESLint exits 0
- Vite production build exits 0
- `git diff --check` exits 0

- [ ] **Step 6: Commit the spacing adjustment**

```powershell
git add -- src/pages/Home.css
git commit -m "style: tighten homepage section rhythm"
```

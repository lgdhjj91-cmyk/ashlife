# Homepage Spacing Rhythm Design

## Goal

Tighten the lower half of the homepage so it reads as a continuous shopping flow while preserving clear section boundaries and the existing calm ASHLIFE visual language.

## Current audit

At a 1502px desktop viewport:

- Product grid to ordering section: 160px
- Ordering section to playroom panel: 112px
- Playroom panel to closing section: 112px

At a 390px mobile viewport:

- Product grid to ordering section: 88px
- Ordering section to playroom panel: 64px
- Playroom panel to closing section: 64px

The gaps are individually valid for an editorial landing page, but their repetition makes this ecommerce homepage feel disconnected and longer than necessary.

## Approved direction

Use a balanced storefront rhythm:

- Desktop product grid to ordering section: 96px, with a 2px measurement tolerance
- Desktop ordering section to playroom panel: 72px, with a 2px measurement tolerance
- Desktop playroom panel to closing section: 72px, with a 2px measurement tolerance
- Mobile product grid to ordering section: 56px, with a 2px measurement tolerance
- Mobile ordering section to playroom panel: 48px, with a 2px measurement tolerance
- Mobile playroom panel to closing section: 48px, with a 2px measurement tolerance

## Implementation

Make a CSS-only adjustment in `src/pages/Home.css`:

1. Reduce the bottom padding of `.container.home-products`.
2. Reduce the outer margin of `.home-ordering`.
3. Reduce the outer margin of `.container.home-playroom`.
4. Apply explicit mobile values inside the existing `max-width: 640px` media query.

Do not change:

- Section order or content
- Internal ordering-section padding
- Product card spacing
- Playroom panel padding
- Colors, typography, imagery, or interactions
- Other pages

## Responsive behavior

Desktop keeps the largest gaps, tablet continues to use fluid clamp values, and mobile uses tighter fixed spacing. The page must retain zero horizontal overflow at all tested widths.

## Verification

- Measure the three section transitions in a real browser at desktop and mobile widths.
- Compare before and after screenshots.
- Confirm no horizontal overflow or browser errors.
- Run the full automated test suite, lint, production build, and `git diff --check`.

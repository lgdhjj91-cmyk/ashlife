# ASHLIFE Shopping UX Audit

Date: 2026-06-30

## Scope

Reviewed the shopping path on the local Ashlife site at `http://localhost:5175/ashlife/`:

1. Product listing / shop discovery
2. Product detail for a variant-heavy product
3. Cart
4. Checkout details, review, and payment screens
5. Mobile shop and checkout viewports

Research references used:

- Baymard: Product List UX 2025
- Baymard: Product Page UX 2026
- Nielsen Norman Group: Ecommerce Product Pages
- Nielsen Norman Group: Ecommerce Homepages, Category Pages, and Product Listing Pages

## Screenshots

- `01-shop-list-desktop.png`
- `02-product-detail-before-variant.png`
- `03-cart-desktop.png`
- `04-checkout-details-desktop.png`
- `05-checkout-review-desktop.png`
- `06-checkout-payment-desktop.png`
- `09-shop-mobile-viewport.png`
- `10-checkout-mobile-viewport.png`

## Step Notes

1. Shop listing: Healthy. Product imagery is strong, discount and variant badges are visible, and the category cards support browsing. Risk: category cards take a lot of vertical space on mobile before products appear.

2. Product detail: Healthy but dense. Variant buttons are exposed, which is good for ecommerce UX. Risk: a product with 21 variations creates a long decision block, and on mobile the add-to-cart area can be pushed far down.

3. Cart: Healthy. Order summary is clear, the selected variation is preserved, and WhatsApp ordering is explained. Risk: Pay Online and WhatsApp are both primary-looking choices, so the preferred path is not fully obvious.

4. Checkout details/review/payment: Mostly clear. The step flow is understandable and the payment upload model is visible. Risk: the payment step can show "QR Code not configured", which is a trust break if seen by real customers.

5. Mobile viewport: Usable. No horizontal overflow was detected at a 390px phone viewport. Risk: the checkout stepper labels are small/crowded, and the shop category area delays product browsing.

## Recommended Redesign Pass

Keep the existing functionality and visual identity. Improve the flow with a restrained ecommerce polish pass:

1. Shop: Turn category cards into a compact horizontal category rail on mobile and add a small "Popular / New / Sale" sort or filter control if product metadata supports it.

2. Product cards: Add one more decision signal where available, such as stock status, quick variant count text, or "View options" copy beside the icon. Keep the current image-led cards.

3. Product detail: Group long variation lists into a more scannable control. For many options, use a searchable or collapsible variation area while keeping buttons visible for shorter option sets.

4. Cart: Make the choice between online payment and WhatsApp clearer by visually separating "Pay now" from "Reserve via WhatsApp", with short copy under each.

5. Checkout: Hide or downgrade the online payment route when QR settings are missing, or show a friendly setup/state message before the customer reaches a dead-looking QR placeholder.

6. Mobile checkout: Simplify the stepper labels at small widths, possibly showing only the active step label plus numbered circles.

## Accessibility Risks From Screenshots

- Some small labels and secondary text may be low contrast against pale backgrounds; verify with computed contrast checks before launch.
- Icon-only cart/action controls need accessible names; some are present in code, but full keyboard/focus testing was not completed in this screenshot audit.
- The dense variation section is keyboard-focusable but could be tiring with 20+ options; a grouped or searchable model would reduce effort.

## Evidence Limits

Screenshots and DOM checks do not prove full accessibility compliance. I did not submit a live order, upload a receipt, or test Firebase order creation. Payment QR configuration depends on live admin settings and was observed as missing in this local run.

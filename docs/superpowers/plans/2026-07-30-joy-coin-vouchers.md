# Joy Coin Vouchers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build guest-friendly, Firebase-controlled Joy Coin vouchers with optional accounts and one-voucher checkout discounts.

**Architecture:** A React wallet provider silently authenticates guests, migrates the current local coin balance, synchronizes wallet state, and shares voucher selection across Playroom, cart, and checkout. Callable Firebase Functions own balance and voucher mutations, while a database trigger settles reserved vouchers from admin order status changes.

**Tech Stack:** React 19, Firebase Authentication, Firebase Realtime Database, Firebase callable/database Cloud Functions, Node test runner, Vite.

## Global Constraints

- No sign-in is required to shop, play, redeem, or manually apply a voucher.
- Only one voucher may apply to an order.
- Tiers are exactly 100 coins/RM1/minimum RM10, 200 coins/RM2/minimum RM15, and 500 coins/RM5/minimum RM20.
- Minimum spend excludes delivery and the discount never reduces delivery fees.
- Pending orders reserve; confirmed/completed orders consume; rejected/cancelled orders restore.
- Existing Badge Studio working-tree changes must not be edited or staged.

---

### Task 1: Shared Voucher Rules

**Files:**
- Create: `src/joy/joyVoucherRules.js`
- Test: `src/joy/joyVoucherRules.test.js`

**Interfaces:**
- Produces: `JOY_VOUCHER_TIERS`, `normalizeVoucherCode(code)`, `getVoucherEligibility(voucher, subtotalSen)`, `selectBestVoucher(vouchers, subtotalSen)`, and `calculateVoucherTotals({ subtotalSen, deliveryFeeSen, voucher })`.

- [ ] **Step 1: Write failing tests for exact eligibility boundaries, best-voucher selection, and delivery-safe totals.**
- [ ] **Step 2: Run `node --test src/joy/joyVoucherRules.test.js` and confirm missing-module failure.**
- [ ] **Step 3: Implement the smallest pure rule module satisfying the tests.**
- [ ] **Step 4: Re-run the focused test and confirm all cases pass.**

### Task 2: Firebase Voucher Lifecycle

**Files:**
- Create: `functions/package.json`
- Create: `functions/lib/joyVoucherCore.js`
- Create: `functions/lib/joyVoucherCore.test.js`
- Create: `functions/index.js`
- Create: `firebase.json`
- Modify: `firebase.database.rules.json`

**Interfaces:**
- Callable functions: `migrateLegacyJoyCoins`, `awardJoyCoins`, `resetJoyCoins`, `redeemJoyVoucher`, `previewJoyVoucher`, `reserveJoyVoucher`, and `releaseJoyVoucher`.
- Database triggers: mirror global voucher status into its owner wallet and settle a voucher when an order status changes.

- [ ] **Step 1: Write failing core tests proving fixed tiers, idempotent redemption, single reservation, confirmed/completed consumption, and rejected/cancelled restoration.**
- [ ] **Step 2: Run `node --test functions/lib/joyVoucherCore.test.js` and confirm the missing implementation fails.**
- [ ] **Step 3: Implement the pure lifecycle core, callable wrappers, and database triggers.**
- [ ] **Step 4: Lock client writes with database rules while preserving public order creation and admin control.**
- [ ] **Step 5: Install function dependencies and run `npm --prefix functions test`.**

### Task 3: Guest Wallet and Optional Account

**Files:**
- Create: `src/context/JoyWalletContext.jsx`
- Create: `src/components/JoyRewardsPanel.jsx`
- Create: `src/components/JoyRewardsPanel.css`
- Modify: `src/firebase.js`
- Modify: `src/App.jsx`
- Modify: `src/context/AdminAuthContext.jsx`
- Modify: `src/pages/AdminLogin.jsx`
- Modify: `src/playroom/hooks/usePlayroomProgress.js`
- Modify: `src/playroom/pages/PlayroomPage.jsx`

**Interfaces:**
- `useJoyWallet()` supplies wallet identity, balance, vouchers, account actions, redemption, preview, reservation/release, selection, and auto-apply suppression.
- `usePlayroomProgress()` continues its public API while routing positive coin deltas and resets through the cloud wallet.

- [ ] **Step 1: Add a wallet-state reducer test covering cloud synchronization and selection state.**
- [ ] **Step 2: Run the test and confirm it fails before implementation.**
- [ ] **Step 3: Implement silent anonymous auth, one-time local migration, wallet subscription, callable actions, account linking/login/logout, and voucher selection.**
- [ ] **Step 4: Add the bilingual Joy Rewards panel with redeem buttons, copyable codes, statuses, and optional account forms.**
- [ ] **Step 5: Require the admin custom claim before treating any Firebase user as an admin.**
- [ ] **Step 6: Run focused and existing Playroom tests.**

### Task 4: Cart and Checkout Discounts

**Files:**
- Create: `src/components/JoyVoucherCard.jsx`
- Create: `src/components/JoyVoucherCard.css`
- Modify: `src/pages/Cart.jsx`
- Modify: `src/pages/Checkout.jsx`
- Modify: `src/context/OrderContext.jsx`
- Modify: `src/pages/AdminDashboard.jsx`
- Modify: `src/pages/Cart.css`
- Modify: `src/pages/Checkout.css`
- Modify: `src/locales/translations.js`

**Interfaces:**
- The cart and checkout consume the selected voucher from `useJoyWallet()`.
- `createOrder(orderData, screenshotFile)` accepts a caller-provided `orderId` and persists voucher snapshots and discount totals.

- [ ] **Step 1: Add focused pure tests for order voucher snapshots and total calculation.**
- [ ] **Step 2: Run the tests and confirm they fail before implementation.**
- [ ] **Step 3: Add automatic best-voucher selection, manual code entry, alternate voucher selection, and “keep for later.”**
- [ ] **Step 4: Reserve the selected voucher before order creation and release it after a failed order write.**
- [ ] **Step 5: Display voucher and discount details in checkout review, payment, confirmation, WhatsApp receipt, and admin order details.**
- [ ] **Step 6: Add `cancelled` to admin order statuses and show voucher settlement information.**

### Task 5: Verification and Operations

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

**Interfaces:**
- Documents Firebase Anonymous Auth enablement, function deployment, rules deployment, and optional customer email/password setup.

- [ ] **Step 1: Document setup and deployment without exposing project secrets.**
- [ ] **Step 2: Run `npm test`.**
- [ ] **Step 3: Run `npm --prefix functions test`.**
- [ ] **Step 4: Run `npm run lint`.**
- [ ] **Step 5: Run `npm run build`.**
- [ ] **Step 6: Review `git diff --check` and confirm unrelated Badge Studio changes remain untouched.**


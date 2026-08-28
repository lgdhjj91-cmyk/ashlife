# Joy Vouchers on Firestore Spark

**Date:** 2026-08-28

## Goal

Keep the existing Joy Coin reward and RM1/RM2/RM5 voucher experience while removing the paid Cloud Functions dependency. The replacement must work on Firebase's no-cost Spark plan, preserve anonymous guest wallets, prevent accidental duplicate redemption and voucher reuse, and keep the current storefront UI.

## Constraints

- Do not require the Firebase Blaze plan, Cloud Functions, Cloud Run, Cloud Build, or a payment method.
- Keep Realtime Database for products, orders, settings, and existing admin data.
- Use one Cloud Firestore Standard database for Joy wallets, reward claims, and vouchers.
- Keep voucher tiers exactly: 100 coins/RM1/minimum RM10, 200 coins/RM2/minimum RM15, and 500 coins/RM5/minimum RM20.
- Delivery fees are never discounted.
- Only one Joy voucher may be used per order.
- A voucher is reserved during checkout, consumed for confirmed/completed orders, and restored for rejected/cancelled orders.
- Keep the current anonymous Firebase Authentication flow and optional email/password account linking.
- No visual redesign is included.
- The browser game remains a trusted source of reward claims. A determined user may manufacture game claims; this is an accepted limitation of the free architecture.

## Architecture

The frontend will use the Firebase Web SDK directly against Cloud Firestore. Firestore transactions replace callable functions for wallet migration, reward claims, coin reset, voucher redemption, voucher preview, reservation, release, and settlement. Firestore Security Rules enforce authentication, wallet ownership, fixed voucher fields, and legal status transitions.

Realtime Database remains the order system. Checkout reserves a voucher in Firestore before writing the order to Realtime Database and releases it if order creation fails. The admin client settles the Firestore voucher immediately after updating an order status. Cross-database writes cannot be atomic, so the UI must report voucher synchronization failures distinctly and make the same settlement operation safe to retry.

## Data Model

### `joyWallets/{uid}`

```text
coins: integer >= 0
legacyMigrated: boolean
legacyMigratedAt: timestamp | absent
updatedAt: timestamp
lastMutationId: string
lastMutationType: migrate | award | reset | redeem
lastVoucherCode: string | absent
```

Only the authenticated owner can read the wallet. Wallet writes occur through transactions. Mutation metadata gives rules and diagnostics enough context to identify the intended operation.

### `joyWallets/{uid}/claims/{claimId}`

```text
amount: integer from 1 through 500
createdAt: timestamp
```

Creating a claim and increasing the wallet balance happen in the same transaction. An existing claim ID makes the operation idempotent.

### `joyVouchers/{code}`

```text
code: normalized voucher code
tierId: rm1 | rm2 | rm5
coinCost: 100 | 200 | 500
valueSen: 100 | 200 | 500
minSubtotalSen: 1000 | 1500 | 2000
ownerUid: Firebase UID that redeemed the coins
status: available | reserved | used
reservedByUid: UID | absent
reservedOrderId: string | absent
createdAt: timestamp
updatedAt: timestamp
reservedAt: timestamp | absent
usedAt: timestamp | absent
restoredAt: timestamp | absent
```

The document ID is the voucher code. An authenticated user may fetch one known code for checkout. Collection listing is restricted to an owner's query so visitors cannot enumerate voucher codes.

## Voucher Code Generation

Codes use the format `JOY-RM1-7K4P9T6D2H`, `JOY-RM2-M8Q3W7N5RA`, or `JOY-RM5-X6B9C4TY2K`.

The ten-character suffix is generated with `crypto.getRandomValues()` and the 32-character alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`. Ambiguous `I`, `O`, `0`, and `1` are excluded. The resulting space contains 32^10 combinations. A redemption transaction also reads the candidate voucher document and refuses to overwrite an existing code. A collision triggers a new candidate and up to five retries.

The readable `RM1`, `RM2`, or `RM5` prefix never determines the discount. Checkout trusts only the fields in the Firestore voucher document.

## Operations

### Guest migration

After anonymous or customer authentication, migrate the locally stored coin balance once. The transaction creates or updates `joyWallets/{uid}` only when `legacyMigrated` is false. Repeated page loads cannot add the same legacy balance again.

### Award coins

Read the wallet and claim document in one transaction. If the claim exists, return the current balance. Otherwise create the claim, add the normalized reward amount, and update mutation metadata.

### Redeem coins

Generate a candidate code before the transaction. Read the wallet and candidate voucher documents. Reject an unknown tier or insufficient balance. When the code is unused, deduct the fixed coin cost and create an `available` voucher in the same transaction. Retry only code collisions.

### Preview and reserve

Normalize the entered code, fetch its document, and check that it is available and meets the item-subtotal minimum. Reservation uses a transaction so only the first order can change `available` to `reserved`. Repeating the reservation for the same UID and order ID succeeds idempotently.

### Release and settlement

If Realtime Database order creation fails, release a matching reservation. Admin status changes settle vouchers as follows:

- `confirmed` or `completed`: `reserved` becomes `used`.
- `rejected` or `cancelled`: a matching `reserved` voucher becomes `available` and reservation fields are removed.
- Repeating an already applied settlement is a successful no-op.

## Security Model

Firestore rules require Firebase Authentication for every wallet and voucher operation. Wallet reads are owner-only. Voucher creation requires a recognized tier, exact fixed values, an owner matching the authenticated UID, `available` status, a previously absent voucher document, and a paired wallet balance decrease in the same atomic operation. Voucher reservation preserves immutable voucher fields and permits only the legal status transition. Settlement follows the project's existing admin policy for non-anonymous Firebase accounts.

The rules protect stored balances, collisions, and voucher reuse from accidental or ordinary client mistakes. They do not prove that a browser game was genuinely completed before a claim was submitted. That accepted limitation must remain documented.

## Error Handling

- Authentication not ready: show that the guest session is still loading.
- Firestore unavailable/offline: show a retryable Joy Rewards service message; transactions do not silently fall back to a successful redemption.
- Invalid or missing code: return an invalid voucher result without changing state.
- Insufficient coins: keep wallet and voucher collection unchanged.
- Code collision: regenerate and retry up to five times, then report a retryable error.
- Voucher already reserved/used: reject checkout with a clear unavailable message.
- Realtime Database order failure: release the matching Firestore reservation.
- Admin settlement failure after an order status update: report that the order changed but voucher synchronization needs retry; the settlement remains idempotent.

## Configuration and Migration

- Initialize and export Firestore from `src/firebase.js`.
- Add `firestore.rules` and the Firestore section to `firebase.json`.
- Remove the Functions deployment section and frontend Functions region setting.
- Remove callable Function usage from `JoyWalletContext`.
- Remove the obsolete `functions/` source and root scripts that deploy or test it after its pure behavior has equivalent frontend tests.
- Keep existing locked Realtime Database Joy paths untouched during migration so old data is not exposed.
- Update README setup instructions for creating the one free Firestore Standard database and deploying Firestore rules.

## Testing

Pure tests cover code format, alphabet, deterministic injected randomness, normalization, fixed tiers, collision retries, voucher eligibility, and legal status transitions. Firestore-facing logic is structured behind a small service module so transaction behavior can be tested with controlled transaction doubles and exact document fixtures. Existing cart, order, wallet, and Playroom tests remain in the full suite.

Verification consists of focused red-green tests, the complete unit test suite, lint, production build, `git diff --check`, Firestore rules deployment, and a live anonymous-user redemption/reservation check against the Spark project.

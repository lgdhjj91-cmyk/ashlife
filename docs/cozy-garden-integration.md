# Cozy Garden gifts — Ashlife integration

Implemented locally on 4 October 2026. Nothing has been deployed or seeded into production.

## Customer experience

- Play Room introduces the real Garden game and links to https://garden.ashlife.org/ in a new tab. Joy Coins / My rewards also introduces it.
- Garden gift redemption is labelled **coming soon** until the separate Garden implementation is ready.
- Guest shoppers can paste a CG gift code in the existing voucher box. No Garden/Ashlife account linking is required.
- An order can include one nano block toy, one cartoon keychain, one small plushie, and one eligible cash voucher. JOY and CG codes share the per-category limit. A gift requires a purchase, without an additional minimum spend.
- Plushies are Garden-only. Existing Joy gift prices remain 500 Joy Coins. The proposed Garden price is 5,000 coins for nano toys/keychains; the plushie price remains undecided.
- Seri Kembangan pickup: choose among available designs in the redeemed category. Delivery: random design, normal delivery fees.

## Launch order

1. In Firebase Console, grant each real shop administrator `rewardAdmins/{authUid}` with `{ enabled: true }` (or a trusted `rewardAdmin: true` custom claim). Do this before using managed gift stock. Ordinary customer accounts cannot manage Garden stock or settle Garden gifts.
2. Deploy the updated Firestore rules **before** deploying this frontend. The new frontend reads gift stock, which older rules deny.
3. Create `giftStock/nanotoy`, `giftStock/keychain`, and `giftStock/plushie` with `available` set to the actual nonnegative integer quantity allocated to free gifts. Do not invent quantities. This is available stock, excluding existing reservations. Once a category is configured, JOY and CG gifts both use it. Existing JOY gifts retain legacy behavior when their stock document is absent; Garden gifts fail closed when it is absent.
4. Create `giftCatalog/{tierId}` for the same IDs with `enabled: false` and `coinCost` (5,000 for the two proposed Garden gifts; plushie can remain null while disabled). Do not enable until Garden issuance is implemented and tested.
5. Implement the separate Garden plan, enable the chosen catalogue entries with positive integer prices and real stock, then replace the coming-soon copy in `src/joy/gardenPromotion.js` and `src/components/JoyGiftSelection.jsx`.

Stock and catalogue setup currently use Firebase Console. No production settings are changed by installing this code.

## Shared Garden contract

Both sites use the same Firebase project and `joyVouchers` collection, with anonymous authentication. The Garden's local coin balance is deliberately not an authoritative cloud economy; export/import farming is an accepted promotion tradeoff.

Code forms are `CG-NANOTOY-XXXXXXXXXX`, `CG-KEYCHAIN-XXXXXXXXXX`, and `CG-PLUSHIE-XXXXXXXXXX`. The ten-character suffix uses `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.

A new voucher has `code`, `tierId`, `coinCost`, `valueSen: 0`, `minSubtotalSen: 0`, `ownerUid`, `status: 'available'`, `source: 'garden'`, `currency: 'garden'`, `requestId`, `createdAt`, and `updatedAt`. Timestamps must be server timestamps. Issue it atomically with:

- `gardenRewardGuests/{uid}/requests/{requestId}`: `code`, `tierId`, `coinCost`, `debitRequired: true`, `createdAt`.
- `gardenRewardGuests/{uid}/openGifts/{tierId}`: `code` and `updatedAt`.

An existing outstanding code is reused rather than issuing another of that category. A new request receipt for reuse has `debitRequired: false`. A new code is allowed after the previous code is used. Receipts are immutable and owner-private. See `tests/garden-firestore.rules.test.mjs` for executable transaction examples.

Ashlife accepts a known code from a different guest identity. Issuance does not allocate physical stock. Checkout atomically reserves each code and decrements its gift stock. Rejected/cancelled reservations return stock once; confirmed/completed gifts become used and are never reopened by a later cancellation. The shared transaction supports all three gifts plus cash.

## Abandoned payment checkouts

Normal navigation releases unsubmitted reservations, but closing a browser or losing the connection can prevent that cleanup. There is deliberately no automatic expiry after a customer might have paid.

In Admin → Orders, use **Recover an abandoned gift checkout** with the customer's code (or a reserved code found in Firebase Console). First confirm that no payment is waiting to be submitted. The action requires a reservation older than 24 hours and checks that its order ID does not exist in the order database. It then uses the normal atomic cancellation transaction to return stock exactly once. If an order exists, use the order's normal status controls instead. A reward administrator grant is required for managed gifts.

This is manual recovery, not a scheduled cleanup service. Firestore rewards and Realtime Database orders remain separate stores; the age check and operator verification avoid reclaiming an active payment checkout.

## Verification

- Application tests: `node --test --test-concurrency=1 "src/**/*.test.js"`.
- Lint: `npm run lint`. Production bundle: `npm run build`.
- Rules tests require Java 21+ and Firebase CLI: `firebase emulators:exec --only firestore --project demo-ashlife-gifts --config firebase.emulators.json "npm run test:rules"`.
- Emulator checks cover guest issuance, disabled/wrong-price gifts, cross-guest redemption, stock exhaustion and concurrency, release idempotency, explicit admin access, private receipts, legacy JOY cash, and a four-reward bundle.
- Local browser checks cover desktop/mobile promotion rendering, English/Chinese copy, loaded artwork, and the Garden link. No real orders or gifts were redeemed for UI testing.

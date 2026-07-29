# Joy Coin Vouchers Design

## Goal

Turn game-earned Joy Coins into centrally controlled RM1, RM2, and RM5 vouchers that work for guest checkout on any browser, while keeping customer accounts optional.

## Customer Rules

- Shopping, playing, redeeming coins, and applying a voucher must not show a mandatory sign-in gate.
- Every browser receives an invisible Firebase anonymous identity so its wallet can be stored safely.
- Customers may optionally create or sign in to an email/password account.
- A newly created account links to the current guest identity and preserves its wallet.
- A voucher code is a bearer credential: anyone with the code may enter it on another browser without signing in.
- Only one Joy voucher can apply to an order.
- Checkout automatically selects the highest-value eligible available voucher from the current wallet.
- The customer may keep the suggested voucher for later, select a smaller eligible voucher, or enter another code manually.
- Minimum spend uses item subtotal before delivery fees.
- Voucher discounts apply only to the item subtotal and never to delivery fees.

## Voucher Tiers

| Coin cost | Discount | Minimum item subtotal |
| ---: | ---: | ---: |
| 100 | RM1 | RM10 |
| 200 | RM2 | RM15 |
| 500 | RM5 | RM20 |

Vouchers do not expire in the first release.

## Voucher Lifecycle

```text
available -> reserved -> used
                    \-> available
```

- Redeeming coins creates an `available` Firebase voucher and deducts the coins once.
- Submitting an order atomically changes that voucher to `reserved`.
- A second browser attempting to reserve the same code receives an unavailable message.
- `pending_verification` keeps the voucher reserved.
- `confirmed` and `completed` change it to `used`.
- `rejected` and `cancelled` restore it to `available`.
- A failed order write releases its reservation when no order exists.

## Architecture

### Frontend

- `JoyWalletProvider` owns anonymous/customer authentication, wallet synchronization, voucher actions, and the current checkout selection.
- Existing Playroom progress remains responsible for stickers, records, and settings. Coin increases are mirrored through the wallet provider and cloud balance becomes authoritative after migration.
- A Joy Rewards panel in the Playroom presents the three redemption tiers, copyable voucher codes, statuses, and optional email/password account controls.
- The cart and checkout share one voucher selection and display subtotal, discount, delivery, and final total consistently.

### Firebase

- Firebase Authentication supplies invisible anonymous identities and optional email/password accounts.
- Callable Cloud Functions are the only writers for Joy Coin balances and global voucher state.
- Realtime Database stores per-user wallets and a global voucher registry.
- An order-status database trigger consumes or restores the order voucher.
- Realtime Database rules allow a user to read only their own wallet. Global vouchers cannot be listed or directly edited by clients.
- Admin access requires the existing `admin: true` custom claim; ordinary customer sessions never count as admin sessions.

## Data Shape

```text
joyWallets/{uid}
  coins
  legacyMigrated
  vouchers/{code}
    valueSen
    minSubtotalSen
    coinCost
    status
    reservedOrderId
    createdAt
    updatedAt
  claims/{claimId}
  redemptions/{requestId}

joyVouchers/{code}
  ownerUid
  valueSen
  minSubtotalSen
  coinCost
  status
  reservedByUid
  reservedOrderId
  createdAt
  updatedAt
```

Orders store a voucher snapshot containing code, discount amount, minimum subtotal, and lifecycle status, plus separate `subtotal`, `discount`, `deliveryFee`, and `total` money fields.

## Migration

- On the first anonymous/customer wallet load, the browser sends its existing `ashlife-playroom-v1` coin balance to a one-time migration function.
- The wallet records `legacyMigrated`, preventing repeated migration for that Firebase identity.
- The local Playroom coin cache is then synchronized to the Firebase balance.
- Clearing browser data before creating an account can still lose access to the anonymous wallet; the UI explains this limitation.

## Failure Handling

- If Firebase guest identity or wallet services are temporarily unavailable, shopping remains usable without a voucher.
- Voucher validation distinguishes invalid, below-minimum, reserved, and used codes.
- Reservation is released if checkout fails before the Firebase order exists.
- Duplicate game reward and redemption requests use caller-generated idempotency IDs.
- The order confirmation and WhatsApp receipt show the applied code and discount.

## Security Boundary

Firebase transactions prevent duplicate redemption requests and double reservation of a voucher. Game outcomes are produced by a browser game, so this is a loyalty feature rather than a tamper-proof financial ledger. Allowed reward sizes, idempotency claims, App Check readiness, fixed voucher tiers, minimum spend, one-voucher-per-order, and manual order verification limit abuse.

## Testing

- Unit tests cover voucher tier eligibility, automatic selection, money calculations, code normalization, and lifecycle transitions.
- Existing Playroom storage tests cover voucher-compatible coin migration.
- Backend core tests cover redeem, reserve, consume, restore, and duplicate-request behavior.
- The full frontend test suite, function tests, lint, and production build must pass.


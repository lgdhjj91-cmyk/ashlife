# Ashlife Gift Rush Design

**Status:** Planning proposal. The user selected Gift Rush and requested an implementation plan. The values below are proposed first-release defaults, not implemented behavior.

## Purpose and success criteria

Add a lively gift-packing game to Ashlife Playroom that complements Memory Match, Swing & Win, and Merge & Joy. Players should understand the basic interaction within one short tutorial, complete a round in 90 seconds, and want to replay because serving cute customers feels satisfying. Mobile is the primary layout; desktop and keyboard controls receive the same complete game.

The core fantasy is working at a tiny Ashlife gift counter: a bunny, bear, or chick requests products and wrapping, the player assembles the parcel, and the customer reacts. Products appear as playful objects, without requiring shopping or checkout during the game.

## First-release scope

- Three customers: bunny, bear, and chick, each with waiting, happy, and disappointed expressions.
- Six products: Bear Notebook, Bunny Pencil Case, Heart Keychain, Bubble Tea Keychain, Paw Squishy, and Kawaii Washi Tape. Use their existing Memory Match artwork; the game owns a separate catalogue so its rules never depend on the whole sticker album.
- Three wrapping choices: pink hearts, lavender stars, and mint dots. Every choice has a pattern, icon, and localized label, so color is never the only clue.
- Unlimited Practice and repeatable Daily rounds; only Daily can award coins.
- A score, current combo, remaining round time, customer patience, personal records, one daily objective, and one collectible sticker.
- English and Simplified Chinese, shared sound/reduced-motion preferences, pause, tutorial, results, replay, and return to Playroom.

Defer shop decoration, inventory management, purchases, persistent campaigns, leaderboards, multiplayer, additional currencies, drag-only controls, and changes to shared streak rewards. These are not required for the first satisfying game.

## Interaction and game rules

1. Select a waiting customer. Their request shows exact product icons, quantities, and a wrapping pattern.
2. Tap shelf products to add them to that customer's tray. A tray holds at most three items. Tapping a tray slot removes that item; Clear Tray removes items and wrapping.
3. Select wrapping, then press Pack Gift. A valid parcel requires an exact product multiset and exact wrapping ID: missing, extra, or wrong quantities fail.
4. A correct parcel leaves the counter, awards points, and shows a happy reaction. It is immediately removed from active orders so a second Pack action cannot serve it again.
5. A wrong Pack attempt removes three seconds of that customer's patience, resets the combo, and marks that order imperfect. The tray remains editable. Choosing then removing an incorrect item alone carries no penalty.
6. Expired customers leave, reset the combo, and show a brief disappointed reaction. There is no life counter or premature game-over; the round always lasts 90 seconds of active play.

Each customer owns an independent tray. Switching customers preserves their tray. When the selected customer leaves, select the oldest remaining order, or show an empty counter until the next arrival. Product supply is unlimited.

### Difficulty curve

| Active round time | Maximum waiting customers | Requested items | Starting patience | Scheduled arrival interval |
|---|---:|---:|---:|---:|
| 0–19.999 seconds | 1 | 2 distinct products | 25 seconds | 8 seconds |
| 20–49.999 seconds | 2 | 2 distinct products | 22 seconds | 6 seconds |
| 50–89.999 seconds | 3 | 3 products; maximum 2 of one product | 20 seconds | 5 seconds |

Spawn the first order at time zero. Further arrival attempts occur at absolute active-time deadlines. At each phase boundary, replace the next arrival deadline with boundary time plus the new interval; do not create an immediate boundary arrival. When the counter is full, skip that attempt without consuming the next order from the seeded sequence. A customer's patience and request do not change when the phase changes.

Advance time and expire orders before accepting an input at that timestamp. An order with zero patience cannot be served. At 90 seconds, close the round before accepting further input and stop all arrivals; customers still waiting count as unfinished, not expired. A large frame delay must process deadlines in chronological order and give the same result as multiple smaller advances.

### Scoring

A perfect order is delivered without any failed Pack attempt for that customer. For a correct delivery:

- Base points: 100.
- Speed bonus: `floor(50 * remainingPatienceMs / initialPatienceMs)`, clamped to 0–50.
- Perfect delivery increments the consecutive-perfect combo. Multiplier is `min(3, 1 + 0.25 * (combo - 1))` using the new combo value.
- Imperfect delivery resets combo to zero and uses multiplier 1.
- Award: `floor((100 + speedBonus) * multiplier)`.
- Wrong attempts and expiry reduce neither the accumulated score nor the round duration.

Statistics are score, served orders, perfect orders, failed Pack attempts, expired orders, unfinished orders, and maximum combo. Results show the score, served/perfect counts, maximum combo, personal best, daily objective, coin status, and newly unlocked sticker.

## Daily mode, rewards, and persistence

Use the existing browser-local `getLocalDateKey` convention and capture the date once at round start. A round crossing midnight keeps its starting date. Practice uses a fresh random seed; Daily uses `gift-rush:<dateKey>`. Same seed produces the same ordered customer/product/wrapping stream; actual arrivals still depend on available counter space. No competitive fairness or leaderboard claim is made.

Select one daily objective by summing the character codes of the date key and taking modulo three, in this order:

1. `perfect-five`: deliver at least 5 perfect orders in one round.
2. `serve-ten`: deliver at least 10 orders in one round.
3. `combo-four`: reach a consecutive-perfect combo of at least 4 in one round.

Completing that day's objective awards exactly **20 Joy Coins once per wallet and date**, using claim ID `gift-rush-daily:<dateKey>`. Better scores and repeated rounds award no additional coins. Practice awards zero coins. Reuse `usePlayroomProgress().syncCoinReward(amount, claimId)` and the existing transactional claim repository. This provides retry deduplication; it does not introduce server-side gameplay validation or protection against manipulating the browser's date or game code.

The `gift-rush-happy-parcel` sticker unlocks once when either mode reaches 5 perfect orders in one completed round. It belongs to Cute Gifts, rarity uncommon, product category Cute Accessories. Add it only to the album's complete `stickers` array, never to `memoryMatchStickers`; provide its English and Chinese album names.

Keep storage key `ashlife-playroom-v1` and version 1. Add a normalized `giftRush` branch:

- `tutorialCompleted: false`, `selectedMode: 'practice'`.
- `bestScore: 0`, `bestCombo: 0`, `totalOrdersServed: 0`, `lastCompletedSessionId: ''`.
- `dailyByDate: {}`; each date holds `{ challengeId, completed, bestScore, coinsClaimed }`, with `coinsClaimed` restricted to 0 or 20. Retain the latest 30 valid dates.
- `pendingRewardClaims: {}`; each key is the deterministic claim ID and holds `{ dateKey, amount: 20, ownerUid }`. Pending claims are not removed by date pruning.

Persist a qualifying claim before attempting the wallet call. Never add coins optimistically in the Gift Rush result reducer. Show Reward Pending when the wallet is loading or the request fails; offer retry after the round and when revisiting the game. On success, mark the matching date claimed and remove that pending claim. Repeating a request after a lost response is safe because the wallet claim ID is unchanged. Do not show a pending reward as credited.

Bind a pending reward to the wallet UID that earned it. Use the existing `useJoyWallet().user` value. If no UID exists when the result is finalized, retain the daily completion but leave the claim unbound and require a user-initiated claim once a wallet is ready. Never silently transfer an already bound pending claim after an account switch. Claim preparation is keyed to the current UID; completion must verify the same UID remains current before changing local claim state. Tests must cover account switches and lost responses.

Session results apply once: duplicate callbacks with the same completed session ID must not increment totals or requeue rewards. UI lifecycle guards reject callbacks from older sessions after replay or unmount. The active round is deliberately not saved; reload or leaving the page abandons that round, but completed records and pending rewards persist.

Normalization must recover from malformed Gift Rush fields while preserving Memory Match, Claw Machine, Merge & Joy, existing coins, album unlocks, settings, and unknown top-level data. Keep normalization in a Gift Rush module imported by the shared storage normalizer; avoid a circular dependency.

## Architecture

Use React 19, semantic HTML controls, and CSS animation. Gift Rush requires no collision simulation, so it introduces no Phaser or Three.js runtime and no new product dependencies. Keep rules in pure JavaScript modules and let a focused hook coordinate state, timers, sound, progress, and claims. CSS controls the visual feedback; animation completion is never necessary for scoring or reward correctness.

The engine exposes a pure state transition with a serializable seeded generator state and stable order IDs. Its phases are idle, running, paused, and finished. Actions carry session IDs and order IDs so obsolete actions are ignored. The clock uses `performance.now()` deltas while running. Pause, page visibility changes, and hidden tabs freeze round and customer clocks; returning requires explicit Resume. No timing penalty accumulates while hidden. The first Start opens a four-step tutorial whose final Start Game action starts the selected mode; subsequent Start clicks begin immediately. Opening a tutorial in an active round pauses it.

Lazy-load the React page at `/play/gift-rush/` and `/play/gift-rush`, following the existing route aliases. Add its Playroom card after Merge & Joy and before Swing & Win. Keep the shared rewards dashboard and Badge Studio in their existing positions. Asset paths use `import.meta.env.BASE_URL` so both the custom domain and `/ashlife/` hosting work.

## Visual direction, assets, and accessibility

Use a cream gift counter, berry-pink main action, lavender/mint wrapping, rounded silhouettes, and white sticker outlines. Desktop arranges the customer queue above a counter, with the product shelf and wrapping nearby. Phones keep a compact three-customer strip, selected request, tray, six-product grid, wrapping choices, and Pack Gift in a clear vertical flow. The counter and characters should dominate the screen; avoid filling it with separate statistic cards.

Reuse the six existing product images. Prepare nine transparent customer expressions, one finished-parcel sticker, and one game-card preview under `public/assets/playroom/gift-rush/`. Generate or commission customer artwork in one consistent style during implementation; record its source in an asset manifest. Wrapping patterns and the counter can be made with CSS. No external asset generation occurs during planning. Use existing synthesized Playroom tones for item selection, wrong Pack, happy delivery, sticker unlock, and round completion.

Controls are real buttons with at least 44 × 44 CSS-pixel touch targets, visible keyboard focus, text labels, and keyboard activation through Tab/Enter/Space. Include textual patience cues and a polite live region for deliveries, mistakes, expiry, and results; do not announce every timer update. Modal dialogs need focus entry/return and Escape handling. Support shared sound preferences, `prefers-reduced-motion`, the Playroom reduced-motion setting, and phone safe areas. Request icons must remain distinguishable at 320 CSS pixels wide.

Missing customer/product artwork must show a labeled fallback instead of disabling play. Audio unavailability must not break input. There must be no horizontal overflow at 320/390/768/1440 widths. Load images with dimensions and reserve space to avoid shifting interactive targets.

## Verification and release acceptance

- Pure Node tests cover seeded content, phase/deadline timing, multiset validation, all scoring boundaries, wrong attempts, expiry, pause, stale actions, and single round completion.
- Storage/reward tests cover old-save migration, malformed input, repeated completion, Practice zero payout, all daily objectives, deterministic claim IDs, failed/retried claims, midnight, and wallet changes.
- Use existing repository tests with the Gift Rush claim ID to prove successful calls and lost-response retries credit exactly once. Mock wallet calls for UI failure cases; do not reset or spend a real customer balance during QA.
- Browser playthroughs prove a valid delivery, wrong wrapping, duplicate quantity, switching trays, expiry, game finish, replay, keyboard play, hidden-tab pause, localized UI, pending retry, and album persistence.
- Capture and inspect desktop 1440 × 1000 and phone 390 × 844 screenshots, plus 320-pixel-width overflow checks. Check portrait phone play and the delivery animation in actual gameplay.
- Run the project test suite, lint, domain build, and GitHub Pages build. Record pre-existing failures separately and require no new failures. Verify the built game under both `/` and `/ashlife/`, including route entry, navigation, and asset requests.
- Implementation completion requires browser evidence and a short balance playtest; unit tests alone cannot establish that the game is fun.

## Proposed build checkpoints

1. Testable game rules and a functional plain counter.
2. Customer artwork, localized responsive interface, and interaction feedback.
3. Saved progress, daily reward claims, album integration, and Playroom discovery.
4. Browser playtesting, visual inspection, balance tuning, and production build verification.

This document describes the proposed game; this request only creates planning documents.

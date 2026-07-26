# Claw Machine Session Flow Design

Date: 2026-07-27

## Goal

Fix the Ashlife Swing & Win prize-chute, mode-switching, exhausted-tries, and timer bugs while replacing per-prize interruptions with a continuous session flow.

## Current Problems

- Chute awards are restricted to the exact prize most recently released by the claw. Prizes pushed or stacked into the chute can remain there and block later prizes.
- The first awarded prize moves the game into `SUCCESS`, preventing additional chute prizes from being processed.
- Every award opens a modal and interrupts the session.
- Classic mode enters `FAILED` at zero tries without producing a useful end state.
- Mode and difficulty changes recreate the Phaser game because React callback dependencies change, temporarily invalidating the control bridge.
- The HUD time counts upward from the first input instead of providing a per-attempt countdown.

## Session Rules

### Practice

- Practice has unlimited tries.
- Each aiming turn starts with a 10-second countdown.
- If the player does not drop before zero, the claw automatically begins its normal drop-and-grab sequence.
- Every prize entering the chute is awarded once, removed from physics, and added to the session collection.
- Practice never opens a per-prize or end-of-session modal.
- Restart clears the current Practice session collection and rebuilds the prize field.

### Classic

- Classic uses the existing difficulty limits: Easy has 7 tries, Normal has 5, and Hard has 4.
- Every aiming turn uses the same 10-second countdown and automatic drop behavior.
- Winning a prize does not end the current Classic session.
- The session continues until the final attempt fully resolves.
- At zero tries, a single combined summary opens. It shows the collected prize images and names, total dolls won, total Joy Coins earned, and tries used.
- A zero-prize session still opens the summary with zero totals.
- Resolving the final attempt marks Classic as played for the current local calendar day before the summary opens.
- Classic cannot start again in the same browser until the local date changes or the authenticated admin clears the testing lock.
- Practice remains available while Classic is locked.
- After the first Classic attempt starts, mode, difficulty, and Restart controls remain unavailable until the session ends so they cannot reset the daily attempt allowance.

## Prize Chute

- Any active, unwon prize whose body enters the valid chute zone is eligible, regardless of which prize was deliberately released.
- A prize is marked won before animation or reward events begin so repeated collisions cannot double-award it.
- Each won prize is immediately made non-physical, sinks through the chute, is destroyed, and appears in the machine's won-prize shelf.
- Multiple prizes can be collected during one attempt.
- Chute collection updates the React session state through a per-prize event without changing the scene to a terminal success state.

## State and Event Design

The Phaser scene remains responsible for physics, turn timing, attempts, and chute detection. React remains responsible for persistent rewards, daily eligibility, session totals, and overlays.

The scene will emit:

- `game-ready` and `attempt-updated` for HUD state.
- `prize-collected` for each unique prize entering the chute.
- `classic-session-ended` once the final Classic attempt resolves.

The React page will:

- Apply each `prize-collected` reward immediately so coins and stickers remain durable.
- Append an immutable session-result entry containing the prize and awarded coin count.
- Show session totals in the side panel.
- Open the combined summary only for `classic-session-ended`.
- Record the local completion date when Classic ends.

The Phaser instance will initialize once per page mount. The latest event callback will be held through a ref, while mode and difficulty changes will update the existing scene through the control bridge. This avoids destroying the canvas and invalidating movement controls.

## Daily Eligibility and Admin Testing Reset

The playroom progress schema will gain a normalized `classicLastPlayedDate` string in `clawMachine`.

Classic is locked when `classicLastPlayedDate` equals today's local date key. The Classic selector communicates that it is completed for today and cannot start a new round.

The authenticated Admin Dashboard will include a Playroom Testing section with a `Reset Classic Daily Test` button. The button clears only this browser's `classicLastPlayedDate` in `ashlife-playroom-v1`. It does not write Firebase data or affect visitors on other browsers or devices.

## Interface

- Replace the individual-prize success modal with a combined Classic summary modal.
- Add a compact session card above the existing control instructions in the side panel.
- The card shows mode, `Dolls won`, `Session coins`, and a small list or strip of collected prize thumbnails.
- The in-cabinet won shelf remains as immediate visual feedback.
- The HUD Time pill displays `10s` down to `0s` for the active aiming turn.
- When Classic is locked, its mode button is disabled and labelled as completed today.

## Error and Edge Handling

- Ignore duplicate collision events for bodies already marked won.
- Ignore late timer callbacks after a manual drop, pause, mode change, restart, or scene destruction.
- Pausing freezes the Phaser clock and countdown.
- Before a Classic attempt starts, a mode or difficulty change clears current session UI state and current scene prizes.
- Classic end emits exactly once, after no active captured or released prize remains unresolved.
- Daily eligibility defaults to available when old storage does not contain the new field.

## Testing

Unit regression tests will cover:

- Any valid unwon chute prize can be collected, including a prize other than the released body.
- Duplicate collisions cannot award the same prize twice.
- Classic ends only when the final attempt has resolved.
- Practice never produces a terminal session end.
- The per-turn timer returns 10 through 0 and triggers automatic drop once.
- Manual drop prevents a second timer-triggered drop.
- Daily Classic eligibility changes after completion and returns after local reset.
- Admin reset clears only the local Classic date without erasing coins or collections.

Rendered browser verification will cover:

- Practice-to-Classic and difficulty switching preserves movement controls.
- The HUD countdown reaches zero and starts an automatic drop.
- Collected prizes disappear from the chute and appear in the won shelf/session card.
- Classic continues after individual wins and opens one combined summary at zero tries.
- Classic is locked after completion and unlocked by the admin browser reset.
- Desktop and mobile layouts remain usable with no relevant console errors.

## Out of Scope

- Cross-device playroom accounts or cloud synchronization.
- A global admin reset affecting all visitors.
- Persisting and resuming a partially completed Classic session after refresh.
- Changing the existing difficulty attempt counts or reward calculations.

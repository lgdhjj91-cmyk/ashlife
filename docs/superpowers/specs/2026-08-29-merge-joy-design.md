# Ashlife Merge & Joy Design

## Goal

Add a lazy-loaded physics merge game at `/play/merge-joy/` that feels native to Ashlife Playroom, works comfortably on phones, and extends the shared Joy Coin, sticker, streak, and local-storage systems without changing the existing games.

## Visual specification

The source references are `Games/New Game Asset/image1.png` and `image2.png`. The accepted full-screen concept is the generated image `C:/Users/lgdhj/.codex/generated_images/01a04bde-a08b-7d12-a58e-c3489628945b/exec-1b2faaf2-f570-4547-8199-f06c36a1605d.png`.

The screen uses one dominant cream-interior glass display box, open supporting HUD rails, berry-pink primary controls, lavender secondary accents, deep berry text, white sticker outlines, and low-detail cloud/gingham decoration. UI text and controls remain HTML; only game pieces are raster artwork. Desktop places score and balance left, previews and challenge right, and the board in the center. Mobile prioritizes the board, compresses the HUD, and keeps Hold and Drop within thumb reach.

## Game loop

Phaser 3.90 is dynamically imported only from the Merge & Joy route. A Matter scene owns bodies, input, animation, merges, danger detection, and the active piece queue. React owns mode selection, HUD, tutorial, collection, persistent progress, rewards, and session summaries.

Only equal tiers merge. A merge locks both source IDs, removes each exactly once after a short squash/pop, creates the next tier at the midpoint with inherited momentum and a small upward impulse, then permits immediate chain reactions. The queue spawns tiers 1–4, with a rare tier 5; daily mode uses a seeded local-date sequence and test mode uses a fixed sequence.

The danger line ends a round only when a slow or sleeping body remains above it for 2.5 seconds. Hold allows one swap and locks until the next drop. A merge within 1.8 seconds of another increases the combo multiplier. A dropped piece that participates in a merge within 1.4 seconds receives a Perfect Drop bonus.

## Progression and rewards

The 11-tier chain is Star Charm, Heart Keychain, Kawaii Bow, Cream Glue, Washi Tape, Bunny Notebook, Kawaii Pencil Case, Chick Plush, Bunny Plush, Mystery Gift Box, and Golden Ashlife Bunny. Diameter grows from 34 to 176 scene pixels. Merge scores are configured per tier; combo and Perfect Drop are separate bonuses.

Daily challenges are selected deterministically by local date and define their own Bronze, Silver, Gold, and Perfect thresholds. The daily Merge & Joy payout is capped at 30 Joy Coins and is claimed idempotently by date. Endless mode never awards daily coins. Shared Playroom streak data records unique completion dates; modest 3-, 5-, and 7-day milestones award coins and collection stickers once. Creating the Golden Bunny unlocks its sticker once but does not grant repeatable Joy Coins.

## Storage

`ashlife-playroom-v1` remains the storage key. Its normalizer gains a `mergeJoy` branch and shared `dailyStreak` branch with safe defaults, preserving all unknown and existing Memory Match, Claw Machine, wallet, sticker, cart, and preference data. Discoveries store first date and creation count by tier. Daily progress stores date, completion, medal, claimed coins, and challenge ID.

## Accessibility and resilience

The game supports pointer/touch drag and release, keyboard arrows/A-D plus Space, and HTML Hold/Drop controls. It pauses when the tab hides, destroys its Phaser instance on route exit, prevents duplicate canvases, has a saved sound preference, respects reduced motion, and exposes a polite live status. Missing assets fail visibly during loading rather than creating black placeholder textures.

## Verification

Pure Node tests cover seed determinism, merge eligibility/locking, score/combo behavior, danger timing, challenge evaluation, idempotent daily rewards, storage migration, and preservation of existing progress. Browser verification covers the deterministic test route, asset requests, console, merge/chain behavior, score and discovery persistence, daily reward lock, refresh, and responsive layouts at 1440×1000 and 390×844.

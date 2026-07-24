# Claw Motion Polish Design

## Goal

Make the claw machine feel playful and mechanically believable while preserving the existing left/right controls, grabbing rules, swing-building gameplay, and prize release behavior.

## Problems Confirmed

1. The cabinet artwork already contains the prize chute. `ClawMachineScene` draws a second chute over that artwork, producing the doubled hole shown in the supplied screenshots.
2. The claw sprite uses the raw Matter body angle. The cable constraint attaches to the body's center and does not restrict body rotation, so collisions and constraint forces can rotate the claw through 360 degrees.
3. The sprite rotates around its center even though a real claw hangs from its top connector. This makes modest sway look detached from the cable.
4. The claw texture remains closed after release, weakening the visual feedback for the player's release action.

## Motion Design

- Keep the Matter body as the pendulum mass but fix its physical rotation.
- Calculate a separate visual tilt from horizontal claw lag and relative velocity.
- Clamp visual tilt to 0.24 radians (about 14 degrees).
- Smooth the tilt with exponential damping so direction changes create a soft follow-through instead of snapping.
- Pivot the claw sprite at its upper cable connector and draw the cable to the same point.
- Use state-driven textures:
  - open while aiming, dropping, released, or resolving;
  - partial while closing;
  - closed while lifting or swinging.
- Add a short scale pulse when the claw closes and a gentler settling pulse when it opens.
- Use only the chute embedded in the cabinet artwork. Keep the invisible Matter sensor and win-zone calculations unchanged.

## Architecture

Add a small pure `ClawMotion` system containing the visual tilt, damping, cable attachment, and state-to-texture rules. Keep Phaser-specific body, sprite, tween, and drawing work in `ClawMachineScene`.

This boundary makes the motion limits deterministic and testable without booting Phaser, while the existing game-flow and grip systems remain unchanged.

## Acceptance Criteria

- The prize chute appears once at initial load and after restart, mode changes, and difficulty changes.
- The claw never visually rotates beyond 0.24 radians in either direction and cannot tumble 360 degrees.
- The cable continuously meets the top of the claw sprite throughout the swing.
- Starting, stopping, and counter-swinging produce smooth, damped follow-through.
- Closing visibly progresses from open to partial to closed with a small snap.
- Releasing visibly opens the claw.
- Existing left/right, drop/grab, capture, swing-power, release, scoring, and win-zone behavior still works.
- Unit tests, lint, production build, and desktop rendered interaction checks pass.

## Scope

No asset replacement, scoring changes, prize physics redesign, new controls, dependency additions, or unrelated layout changes.

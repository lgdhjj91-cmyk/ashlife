# Claw Motion Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace uncontrolled claw tumbling and the doubled prize chute with a controlled, playful arcade motion treatment.

**Architecture:** Put deterministic visual-motion rules in a pure system module and integrate them into the existing Phaser scene. Keep Matter responsible for pendulum position and prize interaction while decoupling sprite orientation from raw body rotation.

**Tech Stack:** JavaScript ES modules, Node test runner, Phaser 3.90 Matter physics, Vite, React.

## Global Constraints

- Preserve existing left/right movement, capture, release, scoring, and win-zone behavior.
- Clamp visual claw tilt to 0.24 radians.
- Do not add dependencies or replace existing art assets.
- Keep the cabinet artwork as the only visible prize chute.

---

### Task 1: Deterministic claw motion rules

**Files:**
- Create: `src/playroom/games/claw-machine/systems/ClawMotion.js`
- Create: `src/playroom/games/claw-machine/systems/ClawMotion.test.js`

**Interfaces:**
- Consumes: numeric anchor/claw positions, horizontal velocities, delta time, and game-state strings.
- Produces: `getClawTiltTarget(input): number`, `dampClawTilt(current, target, deltaMs): number`, `getClawCableEnd(claw): {x, y}`, and `getClawTextureForState(state): string`.

- [ ] **Step 1: Write failing unit tests**

Cover the 0.24-radian clamp, opposite lag directions, return-to-center damping, cable endpoint, and open/partial/closed texture states.

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- src/playroom/games/claw-machine/systems/ClawMotion.test.js`

Expected: FAIL because `ClawMotion.js` does not exist.

- [ ] **Step 3: Implement the pure helpers**

Use position lag plus relative velocity for the target, state-specific motion scaling, exponential interpolation for damping, and explicit state sets for texture selection.

- [ ] **Step 4: Verify the tests pass**

Run: `npm test -- src/playroom/games/claw-machine/systems/ClawMotion.test.js`

Expected: all `ClawMotion` tests pass.

### Task 2: Phaser rig integration and chute cleanup

**Files:**
- Modify: `src/playroom/games/claw-machine/phaser/scenes/ClawMachineScene.js`

**Interfaces:**
- Consumes: all four helpers exported by `ClawMotion.js`.
- Produces: fixed physical claw rotation, top-pivot sprite tilt, aligned cable rendering, and state-change scale pulses.

- [ ] **Step 1: Remove the duplicate visual chute**

Keep `holeZone` and `holeSensor`; remove `holeGraphics`, `drawHole()`, and all overlay drawing.

- [ ] **Step 2: Lock physical rotation and configure the sprite pivot**

Set the Matter body's inertia to `Infinity`, reset body angle/angular velocity on restart, set the sprite origin near the top connector, and store its base scales.

- [ ] **Step 3: Integrate damped visual tilt**

Compute the target from the pure helper, damp it using frame delta, position the sprite at the cable endpoint, and never copy `clawBody.angle` to the sprite.

- [ ] **Step 4: Add state-based texture pulses**

Update the texture only when it changes. Tween from a small close squash or open stretch back to the stored base scale.

- [ ] **Step 5: Run the complete automated suite**

Run: `npm test`

Expected: all tests pass with zero failures.

Run: `npm run lint`

Expected: ESLint exits successfully.

Run: `npm run build`

Expected: Vite production build exits successfully.

### Task 3: Rendered interaction verification

**Files:**
- No committed files.

**Interfaces:**
- Consumes: the local Vite route `/ashlife/play/claw-machine/?clawTest=1`.
- Produces: visual and interaction evidence for the acceptance criteria.

- [ ] **Step 1: Reload the game and inspect page health**

Confirm the intended route/title, meaningful DOM, no framework overlay, and no relevant browser console errors.

- [ ] **Step 2: Verify the initial scene**

Capture a desktop screenshot showing one prize chute and a vertically settled claw with an attached cable.

- [ ] **Step 3: Exercise movement and grab/release states**

Move the trolley, counter-move it, trigger drop/grab, and inspect screenshots/debug state for controlled tilt and correct claw textures.

- [ ] **Step 4: Verify restart**

Trigger restart and confirm the prize chute remains single and the claw settles upright.

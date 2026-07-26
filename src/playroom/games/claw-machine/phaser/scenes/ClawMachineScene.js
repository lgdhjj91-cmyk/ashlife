import { getClawDifficulty } from '../../data/difficultyConfig';
import { clamp, machineConfig } from '../../data/machineConfig';
import { clawPrizeConfig, getPrizeConfig, initialPrizeLayout, testPrizeLayout } from '../../data/prizeConfig';
import {
  cabinetForegroundCrops,
  getCabinetCropPlacement,
  joystickPrizeGuard,
} from '../../systems/CabinetPresentation';
import {
  dampClawTilt,
  getClawCableEnd,
  getClawTextureForState,
  getClawTiltTarget,
} from '../../systems/ClawMotion';
import { formatAttemptsRemaining, getPauseTarget } from '../../systems/GameFlow';
import { evaluateGripQuality, getGripLabel, shouldGripSlip } from '../../systems/GripSystem';
import {
  buildCaptureRegion,
  getCaptureContactPoints,
  getEffectiveHoleSensorWidth,
  getPrizeHoleSensorZone,
  isPrizeInWinZone,
} from '../../systems/PhysicsRules';
import {
  getCapturedPrizeDistance,
  getWonPrizeDisplaySize,
  getWonPrizeShelfLayout,
  getWonPrizeTransition,
  isCollectiblePrize,
} from '../../systems/PrizePresentation';
import {
  getTurnSecondsRemaining,
  isAttemptResolved,
  shouldAutoDrop,
  shouldEndClassicSession,
  TURN_DURATION_MS,
} from '../../systems/SessionFlow';

const stateMessages = {
  READY: 'Move the claw',
  AIMING: 'Press Drop',
  DROPPING: 'Close the claw',
  GRABBING: 'Checking grip',
  CLOSING: 'Closing claw',
  LIFTING: 'Lifting',
  SWINGING: 'Build momentum!',
  RELEASED: 'Prize released',
  RESOLVING: 'So close!',
  SUCCESS: 'Prize won!',
  FAILED: 'Try again',
  PAUSED: 'Paused',
};

const clawMachineAsset = (filename) => `${import.meta.env.BASE_URL}assets/playroom/claw-machine/${filename}`;

const canvasColors = {
  pink: 0xfaa2bf,
  deepPink: 0xe86f9a,
  cream: 0xfff4df,
  lavender: 0xd7c4ff,
  peach: 0xffc7a8,
  mint: 0xbfe8df,
  text: 0x6b355c,
  glass: 0xdff3ff,
};

const emit = (bridge, type, detail = {}) => {
  bridge?.(type, detail);
};

export const createClawMachineScene = (Phaser, { events, settings, controlState }) =>
  class ClawMachineScene extends Phaser.Scene {
    constructor() {
      super('ClawMachineScene');
      this.bridge = events;
      this.externalSettings = settings;
      this.controlState = controlState;
      this.gameState = 'READY';
      this.mode = settings.mode || 'practice';
      this.difficulty = settings.difficulty || 'normal';
      this.trolleyVelocity = 0;
      this.startedAt = 0;
      this.lastUiEmit = 0;
      this.releaseStartedAt = 0;
      this.attemptsUsed = 0;
      this.bonuses = [];
      this.prizes = [];
      this.wonPrizeShelf = [];
      this.testMode = Boolean(settings.testMode);
      this.lastWonPrize = null;
      this.turnDeadline = 0;
      this.autoDropTriggered = false;
      this.classicSessionEnded = false;
      this.lastPrizeCollectedAt = 0;
      this.collectedDuringAttempt = false;
    }

    preload() {
      this.load.image('claw-cabinet', clawMachineAsset('cabinet/kawaii-cafe-cabinet.png'));
      this.load.image('claw-joystick-foreground', clawMachineAsset('cabinet/joystick-foreground.png'));
      this.load.image('claw-open', clawMachineAsset('claw/claw-open.png'));
      this.load.image('claw-partial', clawMachineAsset('claw/claw-partial.png'));
      this.load.image('claw-closed', clawMachineAsset('claw/claw-closed.png'));
      this.load.image('claw-trolley', clawMachineAsset('claw/trolley.png'));
      this.load.image('grip-sparkle', clawMachineAsset('effects/grip-sparkle.png'));
      clawPrizeConfig.forEach((prize) => {
        this.load.image(`claw-prize-${prize.id}`, prize.image);
      });
    }

    create() {
      this.matter.world.setBounds(0, 0, machineConfig.width, machineConfig.height, 40, true, true, false, true);
      this.drawStaticMachine();
      this.createCabinetPhysics();
      this.createPrizeHole();
      this.createPrizes();
      this.createClawRig();
      this.createDecorations();
      this.matter.world.on('collisionstart', this.handleCollisionStart, this);
      this.input.keyboard?.on('keydown', () => this.markStarted());
      this.resetRoundCounters();
      emit(this.bridge, 'game-ready', this.getUiPayload());
    }

    resetRoundCounters() {
      const difficulty = getClawDifficulty(this.difficulty);
      this.attemptsRemaining = this.mode === 'practice' ? Infinity : difficulty.attempts;
      this.attemptsUsed = 0;
      this.score = 0;
      this.bonuses = [];
      this.startedAt = 0;
      this.classicSessionEnded = false;
      this.startTurnClock();
      this.setGameState('READY');
    }

    startTurnClock() {
      this.turnDeadline = this.time.now + TURN_DURATION_MS;
      this.autoDropTriggered = false;
    }

    setDifficulty(difficulty) {
      if (this.difficulty === difficulty) return;
      this.difficulty = difficulty;
      this.restartRound();
    }

    setMode(mode) {
      if (this.mode === mode) return;
      this.mode = mode;
      this.restartRound();
    }

    markStarted() {
      if (!this.startedAt) this.startedAt = this.time.now;
      if (this.gameState === 'READY') this.setGameState('AIMING');
    }

    setPaused(isPaused) {
      if (isPaused && this.gameState !== 'PAUSED') {
        this.previousState = this.gameState;
        this.setGameState('PAUSED');
        this.scene.pause();
        emit(this.bridge, 'game-paused', this.getUiPayload());
        return;
      }

      if (!isPaused && this.scene.isPaused()) {
        this.scene.resume();
        this.setGameState(this.previousState || 'AIMING');
        emit(this.bridge, 'game-resumed', this.getUiPayload());
      }
    }

    togglePause() {
      const target = getPauseTarget({
        isPaused: this.gameState === 'PAUSED' || this.scene.isPaused(),
        currentState: this.gameState,
        previousState: this.previousState,
      });
      this.setPaused(target.shouldPause);
    }

    setGameState(nextState, extra = {}) {
      this.gameState = nextState;
      emit(this.bridge, 'attempt-updated', {
        ...this.getUiPayload(),
        ...extra,
      });
    }

    getUiPayload() {
      const elapsedSeconds = this.startedAt ? Math.floor((this.time.now - this.startedAt) / 1000) : 0;
      return {
        state: this.gameState,
        statusMessage: this.gripLabel || stateMessages[this.gameState],
        gripStatus: this.gripLabel || '',
        swingPower: Math.round(this.swingPower || 0),
        attemptsRemaining: formatAttemptsRemaining(this.attemptsRemaining),
        attemptsUsed: this.attemptsUsed,
        score: this.score || 0,
        elapsedSeconds,
        turnSecondsRemaining: getTurnSecondsRemaining({
          now: this.time.now,
          deadline: this.turnDeadline,
        }),
        mode: this.mode,
        difficulty: this.difficulty,
        classicSessionEnded: this.classicSessionEnded,
        debugState: this.testMode ? this.getDebugState() : undefined,
      };
    }

    getDebugState() {
      return {
        state: this.gameState,
        trolleyX: Math.round(this.anchorBody?.position.x || 0),
        clawX: Math.round(this.clawBody?.position.x || 0),
        clawY: Math.round(this.clawBody?.position.y || 0),
        cableLength: Math.round(this.cableConstraint?.length || 0),
        visualTiltDegrees: Math.round(Phaser.Math.RadToDeg(this.clawVisualTilt || 0)),
        capturedPrizeId: this.capturedPrize?.prize.id || '',
        releasedPrizeId: this.releasedPrize?.prize.id || '',
        wonPrizeId: this.lastWonPrize?.id || '',
        wonShelfPrizeIds: this.wonPrizeShelf.map((entry) => entry.prize.id),
        swingPower: Math.round(this.swingPower || 0),
        prizePositions: this.prizes.map(({ prize, gameObject }) => ({
          id: prize.id,
          x: Math.round(gameObject.x),
          y: Math.round(gameObject.y),
        })),
      };
    }

    drawStaticMachine() {
      const cabinet = this.add.image(500, 380, 'claw-cabinet').setDisplaySize(1000, 760).setDepth(0);
      this.add.rectangle(500, 388, 724, 388, canvasColors.glass, 0.08).setDepth(1);
      this.staticFx = this.add.graphics().setDepth(2);
      const cabinetSource = cabinet.texture.getSourceImage();
      cabinetForegroundCrops.forEach((crop) => {
        const placement = getCabinetCropPlacement({
          crop,
          sourceWidth: cabinetSource.width,
          sourceHeight: cabinetSource.height,
          displayWidth: machineConfig.width,
          displayHeight: machineConfig.height,
        });
        this.add
          .image(
            placement.x + (crop.width * placement.scaleX) / 2,
            placement.y + (crop.height * placement.scaleY) / 2,
            'claw-joystick-foreground'
          )
          .setDisplaySize(crop.width * placement.scaleX, crop.height * placement.scaleY)
          .setDepth(crop.depth);
      });
      const { playArea } = machineConfig;
      this.prizeMaskSource = this.make.graphics({ add: false });
      this.prizeMaskSource.fillStyle(0xffffff, 1);
      this.prizeMaskSource.fillRect(playArea.x, playArea.y - 8, playArea.width, playArea.height + 8);
      this.prizeMask = this.prizeMaskSource.createGeometryMask();
    }

    createCabinetPhysics() {
      const { playArea, hole } = machineConfig;
      const floorY = playArea.y + playArea.height;
      this.matter.add.rectangle(playArea.x - 18, playArea.y + playArea.height / 2, 36, playArea.height, {
        isStatic: true,
        restitution: 0.18,
        label: 'left-wall',
      });
      this.matter.add.rectangle(playArea.x + playArea.width + 18, playArea.y + playArea.height / 2, 36, playArea.height, {
        isStatic: true,
        restitution: 0.18,
        label: 'right-wall',
      });
      this.matter.add.rectangle(playArea.x + 294, floorY + 20, 588, 40, {
        isStatic: true,
        friction: 0.92,
        label: 'floor-left',
      });
      this.matter.add.rectangle(
        joystickPrizeGuard.x,
        joystickPrizeGuard.y,
        joystickPrizeGuard.width,
        joystickPrizeGuard.height,
        {
          isStatic: true,
          friction: 0.82,
          restitution: 0.12,
          label: 'joystick-prize-guard',
        }
      );
      this.matter.add.rectangle(hole.x - 78, floorY - 8, 26, 42, {
        isStatic: true,
        restitution: 0.24,
        label: 'hole-left-rim',
      });
      this.matter.add.rectangle(hole.x + 78, floorY - 8, 26, 42, {
        isStatic: true,
        restitution: 0.24,
        label: 'hole-right-rim',
      });
    }

    createPrizeHole() {
      const difficulty = getClawDifficulty(this.difficulty);
      const { hole } = machineConfig;
      const sensorWidth = getEffectiveHoleSensorWidth({
        holeWidth: difficulty.holeWidth,
        sensorWidth: difficulty.holeSensorWidth,
      });
      this.holeZone = getPrizeHoleSensorZone({
        x: hole.x,
        rimY: hole.y,
        width: sensorWidth,
      });
      this.holeSensor = this.matter.add.rectangle(this.holeZone.x, this.holeZone.y, this.holeZone.width, this.holeZone.height, {
        isStatic: true,
        isSensor: true,
        label: 'prize-hole-sensor',
      });
    }

    createPrizes() {
      this.prizes.forEach((entry) => entry.gameObject.destroy());
      const layout = this.testMode ? testPrizeLayout : initialPrizeLayout;
      this.prizes = layout.map(([id, x, y, rotation]) => {
        const prize = getPrizeConfig(id);
        const options = {
          label: `prize:${id}`,
          friction: prize.friction,
          frictionAir: prize.frictionAir,
          restitution: prize.restitution,
        };
        if (prize.shape === 'circle') {
          options.shape = { type: 'circle', radius: prize.width / 2 };
        }
        const gameObject = this.matter.add.image(x, y, `claw-prize-${id}`, null, options);
        gameObject.setDisplaySize(prize.width, prize.height);
        if (prize.shape === 'circle') {
          gameObject.setCircle(prize.width * 0.42);
        } else if (prize.shape === 'long') {
          gameObject.setRectangle(prize.width * 0.86, prize.height * 0.7);
        } else if (prize.shape === 'keychain') {
          gameObject.setRectangle(prize.width * 0.72, prize.height * 0.72);
        } else {
          gameObject.setRectangle(prize.width * 0.74, prize.height * 0.78);
        }
        gameObject.setAngle(Phaser.Math.RadToDeg(rotation));
        gameObject.setMass(prize.mass);
        gameObject.setFriction(prize.friction, 0.02, prize.frictionAir);
        gameObject.body.plugin = { prizeId: id, won: false };
        gameObject.setData('prize', prize);
        gameObject.setDepth(12);
        gameObject.setMask(this.prizeMask);
        return { prize, gameObject };
      });
    }

    createClawRig() {
      const difficulty = getClawDifficulty(this.difficulty);
      const startX = 500;
      this.anchorBody = this.matter.add.rectangle(startX, machineConfig.trolley.y, 24, 20, {
        isStatic: true,
        isSensor: true,
        label: 'trolley-anchor',
      });
      this.clawBody = this.matter.add.rectangle(startX, machineConfig.trolley.y + difficulty.cableLength, 62, 48, {
        frictionAir: 0.018,
        restitution: 0.16,
        label: 'claw-body',
      });
      Phaser.Physics.Matter.Matter.Body.setInertia(this.clawBody, Infinity);
      this.cableConstraint = this.matter.add.constraint(this.anchorBody, this.clawBody, difficulty.cableLength, 0.92, {
        damping: 0.08,
      });
      this.clawGraphics = this.add.graphics().setDepth(20);
      this.trolleySprite = this.add.image(startX, machineConfig.trolley.y - 4, 'claw-trolley').setDisplaySize(116, 58).setDepth(22);
      this.clawSprite = this.add
        .image(startX, machineConfig.trolley.y + difficulty.cableLength, 'claw-open')
        .setOrigin(0.5, 0.035)
        .setDisplaySize(126, 154)
        .setDepth(24);
      this.clawBaseScaleX = this.clawSprite.scaleX;
      this.clawBaseScaleY = this.clawSprite.scaleY;
      this.currentClawTexture = 'claw-open';
      this.clawVisualTilt = 0;
    }

    createDecorations() {
      this.add.text(500, 728, 'Swing, release, drop it in!', {
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#c94f7c',
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(25);
      this.wonShelfLabel = this.add
        .text(520, 644, 'WON PRIZES', {
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#8d3d75',
          backgroundColor: '#fff4df',
          padding: { x: 9, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(26)
        .setVisible(false);
    }

    dropGrab() {
      if (this.classicSessionEnded || this.gameState === 'FAILED') return;
      this.markStarted();
      if (this.gameState === 'READY' || this.gameState === 'AIMING') {
        this.autoDropTriggered = true;
        this.collectedDuringAttempt = false;
        if (Number.isFinite(this.attemptsRemaining)) {
          this.attemptsRemaining = Math.max(0, this.attemptsRemaining - 1);
        }
        this.attemptsUsed += 1;
        this.setGameState('DROPPING');
        emit(this.bridge, 'attempt-started', this.getUiPayload());
        return;
      }
      if (this.gameState === 'DROPPING') {
        this.tryGrab();
      }
    }

    tryGrab() {
      if (this.gameState === 'CLOSING' || this.gameState === 'LIFTING') return;
      this.setGameState('CLOSING');
      const clawPosition = this.clawBody.position;
      const clawVelocity = this.clawBody.velocity;
      const captureRegion = buildCaptureRegion(clawPosition, this.testMode ? 118 : 96);
      const candidates = this.prizes
        .filter(({ gameObject }) => !gameObject.body.plugin?.won)
        .map(({ prize, gameObject }) => {
          const contactPoints = getCaptureContactPoints(captureRegion, {
            x: gameObject.x,
            y: gameObject.y,
            width: prize.width,
            height: prize.height,
          });
          const distance = Phaser.Math.Distance.Between(captureRegion.centerX, captureRegion.centerY, gameObject.x, gameObject.y);
          const grip = evaluateGripQuality({
            claw: { x: captureRegion.centerX, y: captureRegion.centerY, velocityX: clawVelocity.x },
            prize: {
              ...prize,
              x: gameObject.x,
              y: gameObject.y,
              velocityX: gameObject.body.velocity.x,
            },
            contactPoints,
          });
          return { prize, gameObject, grip, distance };
        })
        .filter((candidate) => candidate.grip.state !== 'missed')
        .sort((a, b) => b.grip.score - a.grip.score || a.distance - b.distance);

      const best = candidates[0];
      this.gripLabel = getGripLabel(best?.grip.state);
      emit(this.bridge, 'grip-changed', { ...this.getUiPayload(), gripStatus: this.gripLabel });

      if (best && best.grip.state !== 'missed') {
        this.capturedPrize = best;
        best.originalInertia = best.gameObject.body.inertia;
        Phaser.Physics.Matter.Matter.Body.setAngularVelocity(best.gameObject.body, 0);
        Phaser.Physics.Matter.Matter.Body.setAngle(best.gameObject.body, 0);
        Phaser.Physics.Matter.Matter.Body.setInertia(best.gameObject.body, Infinity);
        this.gripStartedAt = this.time.now;
        this.gripConstraint = this.matter.add.constraint(
          this.clawBody,
          best.gameObject.body,
          getCapturedPrizeDistance(best.prize),
          best.grip.state === 'weak' ? 0.34 : 0.68,
          {
            damping: best.grip.state === 'hooked' ? 0.1 : 0.18,
          }
        );
        if (best.grip.state === 'hooked') this.bonuses.push('hook-master');
        if (best.grip.state === 'secure') this.bonuses.push('perfect-grip');
      } else {
        this.capturedPrize = null;
      }

      this.time.delayedCall(360, () => this.setGameState('LIFTING'));
    }

    releasePrize() {
      if (this.gameState !== 'SWINGING' || !this.capturedPrize) return;
      const released = this.capturedPrize;
      const velocity = this.clawBody.velocity;
      const isApexRelease = Math.abs(velocity.y) < 0.75 && Math.abs(this.swingPower) > 35;
      if (isApexRelease) this.bonuses.push('apex-release');
      this.matter.world.removeConstraint(this.gripConstraint);
      this.gripConstraint = null;
      this.capturedPrize = null;
      if (Number.isFinite(released.originalInertia)) {
        Phaser.Physics.Matter.Matter.Body.setInertia(released.gameObject.body, released.originalInertia);
      }
      if (this.testMode) {
        released.gameObject.setVelocity(16, -7);
      } else {
        released.gameObject.setVelocity(velocity.x * 1.08, velocity.y * 0.84 - (isApexRelease ? 1.5 : 0.25));
      }
      released.gameObject.setAngularVelocity(released.gameObject.body.angularVelocity + velocity.x * 0.012);
      this.releasedPrize = released;
      this.releaseStartedAt = this.time.now;
      this.setGameState('RELEASED');
      emit(this.bridge, 'prize-released', this.getUiPayload());
      this.time.delayedCall(280, () => this.setGameState('RESOLVING'));
    }

    restartRound() {
      if (this.gripConstraint) {
        this.matter.world.removeConstraint(this.gripConstraint);
      }
      this.gripConstraint = null;
      this.capturedPrize = null;
      this.releasedPrize = null;
      this.lastWonPrize = null;
      this.gripLabel = '';
      this.trolleyVelocity = 0;
      this.controlState.left = false;
      this.controlState.right = false;
      this.clearWonPrizeShelf();
      this.createPrizes();
      if (this.anchorBody) {
        const difficulty = getClawDifficulty(this.difficulty);
        Phaser.Physics.Matter.Matter.Body.setPosition(this.anchorBody, { x: 500, y: machineConfig.trolley.y });
        Phaser.Physics.Matter.Matter.Body.setPosition(this.clawBody, {
          x: 500,
          y: machineConfig.trolley.y + difficulty.cableLength,
        });
        Phaser.Physics.Matter.Matter.Body.setVelocity(this.clawBody, { x: 0, y: 0 });
        Phaser.Physics.Matter.Matter.Body.setAngularVelocity(this.clawBody, 0);
        Phaser.Physics.Matter.Matter.Body.setAngle(this.clawBody, 0);
        this.cableConstraint.length = difficulty.cableLength;
        this.clawVisualTilt = 0;
      }
      if (this.holeSensor) this.matter.world.remove(this.holeSensor);
      this.createPrizeHole();
      this.resetRoundCounters();
    }

    clearWonPrizeShelf() {
      this.wonPrizeShelf.forEach((entry) => entry.sprite.destroy());
      this.wonPrizeShelf = [];
      this.wonShelfLabel?.setVisible(false);
    }

    handleCollisionStart(event) {
      event.pairs.forEach((pair) => {
        const sensorBody = pair.bodyA.label === 'prize-hole-sensor' ? pair.bodyA : pair.bodyB.label === 'prize-hole-sensor' ? pair.bodyB : null;
        const prizeBody = pair.bodyA.label.startsWith('prize:') ? pair.bodyA : pair.bodyB.label.startsWith('prize:') ? pair.bodyB : null;
        if (sensorBody && prizeBody) {
          this.checkPrizeWon(prizeBody);
        }

        if (this.gameState === 'RESOLVING' && prizeBody && (pair.bodyA.label.includes('wall') || pair.bodyB.label.includes('wall'))) {
          this.bonuses.push('wall-bounce');
        }
      });
    }

    checkPrizeWon(prizeBody) {
      const position = prizeBody.position;
      const inWinZone = isPrizeInWinZone(position, {
          x: this.holeZone.x,
          rimY: machineConfig.hole.y,
          sensorWidth: this.holeZone.width,
          sensorHeight: this.holeZone.height + 10,
        });
      if (
        !isCollectiblePrize({
          isWon: prizeBody.plugin?.won,
          inWinZone,
          collectionWindowOpen: ['RELEASED', 'RESOLVING'].includes(this.gameState),
        })
      ) {
        return;
      }

      prizeBody.plugin.won = true;
      const prize = getPrizeConfig(prizeBody.plugin.prizeId);
      this.lastWonPrize = prize;
      this.lastPrizeCollectedAt = this.time.now;
      this.collectedDuringAttempt = true;
      this.score += 500 + prize.rewardCoins * 8;
      const winPayload = {
        ...this.getUiPayload(),
        prize,
        attemptsUsed: this.attemptsUsed,
        remainingAttempts: Number.isFinite(this.attemptsRemaining) ? this.attemptsRemaining : 0,
        bonuses: [...new Set(this.bonuses)],
      };
      emit(this.bridge, 'attempt-updated', {
        ...this.getUiPayload(),
        statusMessage: `${prize.name} collected!`,
      });
      emit(this.bridge, 'prize-collected', winPayload);
      const transition = getWonPrizeTransition({
        holeX: machineConfig.hole.x,
        holeY: machineConfig.hole.y,
      });
      const wonEntry = this.prizes.find((entry) => entry.gameObject.body === prizeBody);
      if (wonEntry) {
        if (this.releasedPrize === wonEntry) {
          this.releasedPrize = null;
        }
        Phaser.Physics.Matter.Matter.Body.setStatic(prizeBody, true);
        wonEntry.gameObject.setSensor(true);
        wonEntry.gameObject.setAngularVelocity(0);
        this.tweens.add({
          targets: wonEntry.gameObject,
          x: transition.sink.x,
          y: transition.sink.y,
          angle: 0,
          alpha: 0,
          scaleX: wonEntry.gameObject.scaleX * 0.55,
          scaleY: wonEntry.gameObject.scaleY * 0.55,
          duration: transition.sink.duration,
          ease: 'Sine.In',
          onComplete: () => {
            wonEntry.gameObject.destroy();
            this.prizes = this.prizes.filter((entry) => entry !== wonEntry);
            this.addWonPrizeToShelf(prize, transition);
          },
        });
      } else {
        this.addWonPrizeToShelf(prize, transition);
      }
    }

    addWonPrizeToShelf(prize, transition = getWonPrizeTransition({
      holeX: machineConfig.hole.x,
      holeY: machineConfig.hole.y,
    })) {
      if (this.wonPrizeShelf.length >= 5) {
        const oldest = this.wonPrizeShelf.shift();
        oldest?.sprite.destroy();
      }

      const displaySize = getWonPrizeDisplaySize(prize);
      const sprite = this.add
        .image(transition.reveal.x, transition.reveal.y, `claw-prize-${prize.id}`)
        .setDisplaySize(displaySize.width, displaySize.height)
        .setAlpha(0)
        .setDepth(27);
      const finalScaleX = sprite.scaleX;
      const finalScaleY = sprite.scaleY;
      sprite.setScale(finalScaleX * 0.3, finalScaleY * 0.3);
      this.wonPrizeShelf.push({ prize, sprite });
      this.wonShelfLabel?.setVisible(true);

      const layout = getWonPrizeShelfLayout(this.wonPrizeShelf.length);
      this.wonPrizeShelf.forEach((entry, index) => {
        const target = layout[index];
        this.tweens.killTweensOf(entry.sprite);
        this.tweens.add({
          targets: entry.sprite,
          x: target.x,
          y: target.y,
          alpha: 1,
          scaleX: entry.sprite === sprite ? finalScaleX : entry.sprite.scaleX,
          scaleY: entry.sprite === sprite ? finalScaleY : entry.sprite.scaleY,
          delay: entry.sprite === sprite ? transition.reveal.delay : 0,
          duration: entry.sprite === sprite ? transition.reveal.duration : 240,
          ease: entry.sprite === sprite ? 'Back.Out' : 'Sine.Out',
        });
      });
    }

    update(_time, delta) {
      if (!this.anchorBody || this.gameState === 'PAUSED') return;
      const difficulty = getClawDifficulty(this.difficulty);
      this.updateTurnTimer();
      this.updateTrolley(difficulty);
      this.updateCableLength(difficulty);
      this.updateGripStability();
      this.updateChuteCollections();
      this.updateResolving();
      this.drawRig(delta);
      if (this.time.now - this.lastUiEmit > 160) {
        this.lastUiEmit = this.time.now;
        emit(this.bridge, 'attempt-updated', this.getUiPayload());
      }
      this.matter.world.engine.timing.timeScale = delta > 24 ? 0.92 : 1;
    }

    updateTurnTimer() {
      if (
        shouldAutoDrop({
          state: this.gameState,
          now: this.time.now,
          deadline: this.turnDeadline,
          autoDropTriggered: this.autoDropTriggered,
        })
      ) {
        this.autoDropTriggered = true;
        this.dropGrab();
      }
    }

    updateChuteCollections() {
      this.prizes.forEach(({ gameObject }) => {
        if (gameObject.body && !gameObject.body.plugin?.won) {
          this.checkPrizeWon(gameObject.body);
        }
      });
    }

    updateTrolley(difficulty) {
      if (!['READY', 'AIMING', 'DROPPING', 'SWINGING'].includes(this.gameState)) return;
      const direction = (this.controlState.right ? 1 : 0) - (this.controlState.left ? 1 : 0);
      this.trolleyVelocity += direction * difficulty.trolleyAcceleration;
      this.trolleyVelocity *= direction ? difficulty.damping : 0.9;
      this.trolleyVelocity = clamp(this.trolleyVelocity, -difficulty.trolleyMaxSpeed, difficulty.trolleyMaxSpeed);
      const nextX = clamp(
        this.anchorBody.position.x + this.trolleyVelocity,
        machineConfig.trolley.minX,
        machineConfig.trolley.maxX
      );
      Phaser.Physics.Matter.Matter.Body.setPosition(this.anchorBody, { x: nextX, y: machineConfig.trolley.y });
      Phaser.Physics.Matter.Matter.Body.setVelocity(this.anchorBody, { x: this.trolleyVelocity, y: 0 });
      this.swingPower = clamp(
        Math.abs(this.clawBody.position.x - this.anchorBody.position.x) * 0.82 + Math.abs(this.clawBody.velocity.x) * 10,
        0,
        100
      );
    }

    updateCableLength(difficulty) {
      if (this.gameState === 'DROPPING') {
        this.cableConstraint.length = Math.min(difficulty.maxCableLength, this.cableConstraint.length + machineConfig.claw.dropSpeed);
        if (this.cableConstraint.length >= difficulty.maxCableLength - 1) {
          this.tryGrab();
        }
      }
      if (this.gameState === 'LIFTING') {
        this.cableConstraint.length = Math.max(difficulty.cableLength, this.cableConstraint.length - machineConfig.claw.liftSpeed);
        if (this.cableConstraint.length <= difficulty.cableLength + 2) {
          if (this.capturedPrize) {
            this.setGameState('SWINGING');
          } else {
            emit(this.bridge, 'attempt-failed', this.getUiPayload());
            this.finishAttempt('Try again');
          }
        }
      }
    }

    updateGripStability() {
      if (!this.capturedPrize || !this.gripConstraint || !['LIFTING', 'SWINGING'].includes(this.gameState)) return;
      if (this.testMode) return;
      if (this.time.now - (this.gripStartedAt || 0) < 1600) return;
      const angle = Phaser.Math.RadToDeg(this.capturedPrize.gameObject.rotation);
      if (this.capturedPrize.grip.state === 'weak' && this.swingPower < 58 && this.capturedPrize.gameObject.body.speed < 5) {
        return;
      }
      const shouldSlip = shouldGripSlip({
        grip: this.capturedPrize.grip,
        swingPower: this.swingPower,
        impactSpeed: this.capturedPrize.gameObject.body.speed,
        prizeAngle: angle,
        directionChange: Math.abs(this.trolleyVelocity),
      });
      if (shouldSlip && this.gameState === 'SWINGING') {
        this.bonuses.push('save-the-slip');
        this.matter.world.removeConstraint(this.gripConstraint);
        this.gripConstraint = null;
        this.releasedPrize = this.capturedPrize;
        this.capturedPrize = null;
        this.releaseStartedAt = this.time.now;
        this.setGameState('RESOLVING', { statusMessage: 'Prize slipping!' });
      }
    }

    updateResolving() {
      if (!['RELEASED', 'RESOLVING'].includes(this.gameState)) return;
      const body = this.releasedPrize?.gameObject?.body;
      if (body && !body.plugin?.won) this.checkPrizeWon(body);
      const resolvingFor = this.time.now - this.releaseStartedAt;
      const settled = isAttemptResolved({
        hasReleasedBody: Boolean(body),
        bodySpeed: body?.speed || 0,
        resolvingFor,
        millisecondsSinceCollection: this.time.now - this.lastPrizeCollectedAt,
      });
      const timedOut = this.time.now - this.releaseStartedAt > 5200;
      if (settled || timedOut) {
        emit(this.bridge, 'attempt-failed', this.getUiPayload());
        this.finishAttempt(this.collectedDuringAttempt ? 'Prize collected!' : 'So close!');
      }
    }

    finishAttempt(statusMessage) {
      this.releasedPrize = null;
      const activePrize = this.capturedPrize;
      if (
        shouldEndClassicSession({
          mode: this.mode,
          attemptsRemaining: this.attemptsRemaining,
          activePrize,
        })
      ) {
        this.endClassicSession();
        return;
      }

      this.gripLabel = '';
      this.startTurnClock();
      this.setGameState('AIMING', { statusMessage });
    }

    endClassicSession() {
      if (this.classicSessionEnded) return;
      this.classicSessionEnded = true;
      this.turnDeadline = 0;
      this.releasedPrize = null;
      this.capturedPrize = null;
      this.gripLabel = '';
      this.setGameState('FAILED', { statusMessage: 'Classic complete!' });
      emit(this.bridge, 'classic-session-ended', this.getUiPayload());
    }

    updateClawTexture(texture) {
      if (!this.clawSprite || this.currentClawTexture === texture) return;
      this.currentClawTexture = texture;
      this.tweens.killTweensOf(this.clawSprite);
      this.clawSprite.setTexture(texture);
      this.clawSprite.setScale(this.clawBaseScaleX, this.clawBaseScaleY);

      if (texture === 'claw-closed') {
        this.clawSprite.setScale(this.clawBaseScaleX * 1.06, this.clawBaseScaleY * 0.92);
        this.tweens.add({
          targets: this.clawSprite,
          scaleX: this.clawBaseScaleX,
          scaleY: this.clawBaseScaleY,
          duration: 170,
          ease: 'Back.Out',
        });
        return;
      }

      if (texture === 'claw-open') {
        this.clawSprite.setScale(this.clawBaseScaleX * 0.96, this.clawBaseScaleY * 1.04);
        this.tweens.add({
          targets: this.clawSprite,
          scaleX: this.clawBaseScaleX,
          scaleY: this.clawBaseScaleY,
          duration: 150,
          ease: 'Sine.Out',
        });
      }
    }

    drawRig(delta) {
      const anchor = this.anchorBody.position;
      const claw = this.clawBody.position;
      const cableEnd = getClawCableEnd(claw);
      const tiltTarget = getClawTiltTarget({
        anchorX: anchor.x,
        clawX: claw.x,
        trolleyVelocity: this.trolleyVelocity,
        clawVelocityX: this.clawBody.velocity.x,
        state: this.gameState,
      });
      this.clawVisualTilt = dampClawTilt(this.clawVisualTilt || 0, tiltTarget, delta);

      this.clawGraphics.clear();
      this.clawGraphics.lineStyle(5, 0x493642, 0.95);
      this.clawGraphics.lineBetween(anchor.x, anchor.y - 6, cableEnd.x, cableEnd.y);
      this.clawGraphics.fillStyle(0x493642, 1);
      this.clawGraphics.fillCircle(cableEnd.x, cableEnd.y, 3);
      this.trolleySprite?.setPosition(anchor.x, anchor.y - 12);
      if (this.clawSprite) {
        this.updateClawTexture(getClawTextureForState(this.gameState));
        this.clawSprite.setPosition(cableEnd.x, cableEnd.y);
        this.clawSprite.setRotation(this.clawVisualTilt);
      }
    }
  };

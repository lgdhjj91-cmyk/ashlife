import { mergeTiers, getMergeTier, getPieceDiameter } from '../../data/mergeTiers.js';
import { createPieceSequence } from '../../utils/seededRandom.js';
import { canMerge, lockMergePair } from '../../systems/mergeRules.js';
import { calculateMergeAward, getComboCount, PERFECT_DROP_WINDOW_MS } from '../../systems/scoring.js';
import { isDangerousBody, updateDangerState } from '../../systems/dangerRules.js';
import { destroyMatterPieceSafely } from '../../systems/phaserPieceCleanup.js';

const BOARD = { left: 46, right: 574, top: 18, bottom: 752, dangerY: 240 };
const PREVIEW_Y = 78;
const SPAWN_Y = 92;
const WALL_SIZE = 34;

export const getMergedVelocity = (first, second) => ({
  x: Math.min(0.45, Math.max(-0.45, ((first?.x || 0) + (second?.x || 0)) * 0.09)),
  y: Math.min(0.5, Math.max(0, ((first?.y || 0) + (second?.y || 0)) * 0.06)),
});

export const getRepeatedDropPressure = ({ previousX, x, streak = 0 }) => {
  if (previousX === null || Math.abs(x - previousX) >= 24) return { streak: 0, velocityX: 0 };
  const nextStreak = streak + 1;
  return { streak: nextStreak, velocityX: nextStreak < 2 ? 0 : nextStreak % 2 === 0 ? 0.65 : -0.65 };
};

export const getContainedPosition = ({ x, y, halfWidth = 0, halfHeight = 0 }) => ({
  x: Math.min(BOARD.right - halfWidth, Math.max(BOARD.left + halfWidth, x)),
  y: Math.min(BOARD.bottom - halfHeight, Math.max(BOARD.top + halfHeight, y)),
});

const bodySizeForTier = (tier, size = tier.diameter) => {
  if (tier.shape === 'wide') return { width: size * 0.9, height: size * 0.54 };
  if (tier.shape === 'tall') return { width: size * 0.62, height: size * 0.88 };
  if (tier.shape === 'square') return { width: size * 0.78, height: size * 0.78 };
  return { radius: size * 0.42 };
};

export const createMergeJoyScene = (Phaser, { events, settings }) =>
  class MergeJoyScene extends Phaser.Scene {
    constructor() {
      super('MergeJoyScene');
      this.settings = settings;
      this.eventsBridge = events;
      this.mode = settings.mode || 'endless';
      this.testMode = Boolean(settings.testMode);
      this.dateKey = settings.dateKey;
      this.nextPieceId = 1;
      this.roundToken = 0;
    }

    preload() {
      mergeTiers.forEach((tier) => this.load.image(tier.textureKey, tier.image));
      this.load.on('loaderror', (file) => this.eventsBridge('asset-error', { key: file.key, src: file.src }));
    }

    create() {
      this.createBoard();
      this.createRoundState();
      this.bindInput();
      this.matter.world.on('collisionstart', this.handleCollisionStart, this);
      this.spawnPreview();
      this.eventsBridge('ready', this.getPublicState());
    }

    createBoard() {
      this.add.rectangle(310, 386, BOARD.right - BOARD.left, BOARD.bottom - BOARD.top, 0xfffbf4, 0.18);
      const rim = this.add.graphics();
      rim.lineStyle(8, 0xffffff, 0.72);
      rim.strokeRoundedRect(BOARD.left, BOARD.top, BOARD.right - BOARD.left, BOARD.bottom - BOARD.top, 28);
      rim.lineStyle(2, 0xe8a4bb, 0.7);
      rim.strokeRoundedRect(BOARD.left + 5, BOARD.top + 5, BOARD.right - BOARD.left - 10, BOARD.bottom - BOARD.top - 10, 24);

      const danger = this.add.graphics();
      danger.lineStyle(2, 0xf17696, 0.65);
      for (let x = BOARD.left + 16; x < BOARD.right - 16; x += 20) danger.lineBetween(x, BOARD.dangerY, x + 10, BOARD.dangerY);
      this.dangerLabel = this.add.text(310, BOARD.dangerY - 16, 'DANGER', {
        fontFamily: 'Arial, sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#d85d7f',
        backgroundColor: '#fff9f5', padding: { x: 8, y: 2 },
      }).setOrigin(0.5);

      this.matter.add.rectangle(BOARD.left - WALL_SIZE / 2, 390, WALL_SIZE, 760, { isStatic: true, friction: 0.2 });
      this.matter.add.rectangle(BOARD.right + WALL_SIZE / 2, 390, WALL_SIZE, 760, { isStatic: true, friction: 0.2 });
      this.matter.add.rectangle(310, BOARD.top - WALL_SIZE / 2, 560, WALL_SIZE, { isStatic: true, friction: 0.2 });
      this.matter.add.rectangle(310, BOARD.bottom + WALL_SIZE / 2, 560, WALL_SIZE, { isStatic: true, friction: 0.32 });
    }

    createRoundState() {
      this.roundToken += 1;
      this.pieces = new Map();
      this.pairLocks = new Set();
      this.sequence = createPieceSequence(this.mode === 'daily' ? this.dateKey : `${Date.now()}-${this.roundToken}`, {
        count: 512,
        testMode: this.testMode,
      });
      this.sequenceIndex = 0;
      this.currentTier = null;
      this.heldTier = null;
      this.holdLocked = false;
      this.preview = null;
      this.aimX = 310;
      this.score = 0;
      this.comboCount = 0;
      this.previousMergeAt = 0;
      this.lastDropToken = 0;
      this.lastDropAt = 0;
      this.lastDropX = null;
      this.sameLaneDropStreak = 0;
      this.dangerState = { elapsedMs: 0, warningLevel: 0, gameOver: false };
      this.isGameOver = false;
      this.isPaused = false;
      this.stats = { score: 0, highestTier: 1, maxCombo: 0, perfectDrops: 0, createdByTier: {} };
    }

    bindInput() {
      this.input.on('pointermove', (pointer) => {
        if (pointer.isDown || pointer.pointerType === 'touch') this.movePreviewTo(pointer.x);
      });
      this.input.on('pointerdown', (pointer) => this.movePreviewTo(pointer.x));
      this.input.on('pointerup', (pointer) => {
        this.movePreviewTo(pointer.x);
        if (pointer.y < BOARD.bottom) this.dropCurrentPiece();
      });
    }

    nextTierFromQueue() {
      const tier = this.sequence[this.sequenceIndex % this.sequence.length];
      this.sequenceIndex += 1;
      return tier;
    }

    spawnPreview(forcedTier = null) {
      if (this.isGameOver || this.preview) return;
      this.currentTier = forcedTier || this.nextTierFromQueue();
      const tier = getMergeTier(this.currentTier);
      const size = getPieceDiameter(tier, true);
      this.preview = this.add.image(this.aimX, PREVIEW_Y, tier.textureKey)
        .setDisplaySize(size, size)
        .setDepth(20);
      this.tweens.add({ targets: this.preview, y: PREVIEW_Y - 4, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.emitState();
    }

    movePreviewTo(x) {
      if (!this.preview || this.isGameOver || this.isPaused) return;
      const tier = getMergeTier(this.currentTier);
      const size = getPieceDiameter(tier, true);
      this.aimX = Phaser.Math.Clamp(x, BOARD.left + size / 2, BOARD.right - size / 2);
      this.preview.x = this.aimX;
    }

    nudgePreview(direction) {
      this.movePreviewTo(this.aimX + (direction === 'left' ? -24 : 24));
    }

    dropCurrentPiece() {
      if (!this.preview || this.isGameOver || this.isPaused) return false;
      const tier = this.currentTier;
      const x = this.aimX;
      this.tweens.killTweensOf(this.preview);
      this.preview.destroy();
      this.preview = null;
      this.currentTier = null;
      this.lastDropToken += 1;
      this.lastDropAt = this.time.now;
      const pressure = getRepeatedDropPressure({ previousX: this.lastDropX, x, streak: this.sameLaneDropStreak });
      this.lastDropX = x;
      this.sameLaneDropStreak = pressure.streak;
      this.addPiece(tier, x, SPAWN_Y, {
        dropToken: this.lastDropToken,
        isDrop: true,
        velocity: pressure.velocityX ? { x: pressure.velocityX, y: 0 } : null,
      });
      this.holdLocked = false;
      this.eventsBridge('drop', { tier, x });
      const token = this.roundToken;
      this.time.delayedCall(420, () => {
        if (token === this.roundToken && !this.isGameOver) this.spawnPreview();
      });
      this.emitState();
      return true;
    }

    holdCurrentPiece() {
      if (!this.preview || this.holdLocked || this.isGameOver || this.isPaused) return false;
      const outgoing = this.currentTier;
      const incoming = this.heldTier;
      this.heldTier = outgoing;
      this.holdLocked = true;
      this.tweens.killTweensOf(this.preview);
      this.preview.destroy();
      this.preview = null;
      this.currentTier = null;
      this.spawnPreview(incoming || this.nextTierFromQueue());
      this.eventsBridge('hold', { heldTier: this.heldTier, currentTier: this.currentTier });
      this.emitState();
      return true;
    }

    addPiece(tierNumber, x, y, { velocity = null, dropToken = 0, bornAt = null, isDrop = false } = {}) {
      const tier = getMergeTier(tierNumber);
      const size = getPieceDiameter(tier, isDrop);
      const piece = this.matter.add.image(x, y, tier.textureKey);
      piece.setDisplaySize(size, size);
      const bodySize = bodySizeForTier(tier, size);
      if (bodySize.radius) piece.setCircle(bodySize.radius);
      else piece.setRectangle(bodySize.width, bodySize.height, { chamfer: { radius: Math.min(bodySize.width, bodySize.height) * 0.22 } });
      piece.setFriction(0.12, 0.02, 0.08);
      piece.setFrictionAir(0.006);
      piece.setBounce(0.08);
      piece.setDensity(0.001 + tier.tier * 0.00008);
      if (velocity) piece.setVelocity(velocity.x, velocity.y);
      const id = this.nextPieceId++;
      piece.setDataEnabled();
      piece.setData({ mergePiece: true, id, tier: tier.tier, merging: false, dropToken, bornAt: bornAt ?? this.time.now });
      this.pieces.set(id, piece);
      return piece;
    }

    handleCollisionStart(event) {
      if (this.isGameOver) return;
      event.pairs.forEach(({ bodyA, bodyB }) => {
        const first = bodyA.gameObject;
        const second = bodyB.gameObject;
        if (!first?.getData('mergePiece') || !second?.getData('mergePiece')) return;
        const firstData = { id: first.getData('id'), tier: first.getData('tier'), merging: first.getData('merging') };
        const secondData = { id: second.getData('id'), tier: second.getData('tier'), merging: second.getData('merging') };
        if (!canMerge(firstData, secondData)) return;
        const pairKey = lockMergePair(this.pairLocks, firstData, secondData);
        if (!pairKey) return;
        first.setData('merging', true);
        second.setData('merging', true);
        this.processMerge(first, second, pairKey);
      });
    }

    processMerge(first, second, pairKey) {
      const sourceTier = first.getData('tier');
      const dropToken = Math.max(first.getData('dropToken') || 0, second.getData('dropToken') || 0);
      const bornAt = Math.min(first.getData('bornAt') ?? this.time.now, second.getData('bornAt') ?? this.time.now);
      const x = (first.x + second.x) / 2;
      const y = (first.y + second.y) / 2;
      const velocity = getMergedVelocity(first.body?.velocity, second.body?.velocity);
      this.tweens.add({ targets: [first, second], scaleX: 0.78, scaleY: 0.78, alpha: 0.42, duration: 130, ease: 'Back.in' });
      this.createPopEffect(x, y, sourceTier + 1);
      const token = this.roundToken;
      this.time.delayedCall(145, () => {
        if (token !== this.roundToken || !first.active || !second.active) return;
        this.pieces.delete(first.getData('id'));
        this.pieces.delete(second.getData('id'));
        destroyMatterPieceSafely(this.tweens, first);
        destroyMatterPieceSafely(this.tweens, second);
        const nextTier = sourceTier + 1;
        const created = this.addPiece(nextTier, x, y, { velocity, dropToken, bornAt });
        created.setAngularVelocity(Phaser.Math.Clamp(velocity.x * 0.015, -0.035, 0.035));

        const now = this.time.now;
        this.comboCount = getComboCount({ previousCount: this.comboCount, previousMergeAt: this.previousMergeAt, now });
        this.previousMergeAt = now;
        const perfectDrop = Boolean(dropToken && dropToken === this.lastDropToken && now - this.lastDropAt <= PERFECT_DROP_WINDOW_MS);
        const award = calculateMergeAward({ sourceTier, comboCount: this.comboCount, perfectDrop });
        this.score += award.total;
        this.stats.score = this.score;
        this.stats.highestTier = Math.max(this.stats.highestTier, nextTier);
        this.stats.maxCombo = Math.max(this.stats.maxCombo, this.comboCount);
        this.stats.createdByTier[nextTier] = (this.stats.createdByTier[nextTier] || 0) + 1;
        if (perfectDrop) this.stats.perfectDrops += 1;
        this.showFloatingScore(x, y, award.total, this.comboCount, perfectDrop);
        this.eventsBridge('merge', { sourceTier, tier: nextTier, combo: this.comboCount, perfectDrop, award, stats: this.cloneStats() });
        if (nextTier === 11) this.eventsBridge('legendary', { tier: 11, stats: this.cloneStats() });
        this.pairLocks.delete(pairKey);
        this.emitState();
      });
    }

    createPopEffect(x, y, tier) {
      const colors = tier === 11 ? [0xffcf4d, 0xffef9a, 0xf47aa3] : [0xf47aa3, 0xa98be8, 0xffd966];
      for (let index = 0; index < 7; index += 1) {
        const dot = this.add.circle(x, y, 3 + (index % 3), colors[index % colors.length], 0.9).setDepth(30);
        const angle = (Math.PI * 2 * index) / 7;
        this.tweens.add({
          targets: dot,
          x: x + Math.cos(angle) * (22 + index),
          y: y + Math.sin(angle) * (22 + index),
          alpha: 0,
          scale: 0.2,
          duration: 260,
          ease: 'Cubic.out',
          onComplete: () => dot.destroy(),
        });
      }
    }

    showFloatingScore(x, y, amount, combo, perfectDrop) {
      const lines = [`+${amount}`];
      if (combo > 1) lines.push(`COMBO ×${combo}!`);
      if (perfectDrop) lines.push('PERFECT DROP');
      const text = this.add.text(x, y - 24, lines.join('\n'), {
        align: 'center', fontFamily: 'Arial, sans-serif', fontSize: '18px', fontStyle: 'bold',
        color: perfectDrop ? '#c65c12' : '#8f3e72', stroke: '#ffffff', strokeThickness: 5,
      }).setOrigin(0.5).setDepth(40);
      this.tweens.add({ targets: text, y: text.y - 56, alpha: 0, duration: 820, ease: 'Cubic.out', onComplete: () => text.destroy() });
    }

    update(_time, delta) {
      if (this.isGameOver || this.isPaused || !this.pieces) return;
      const hasDanger = [...this.pieces.values()].some((piece) => {
        if (!piece.active || piece.getData('merging')) return false;
        const halfWidth = (piece.body.bounds.max.x - piece.body.bounds.min.x) / 2;
        const halfHeight = (piece.body.bounds.max.y - piece.body.bounds.min.y) / 2;
        const contained = getContainedPosition({ x: piece.x, y: piece.y, halfWidth, halfHeight });
        if (contained.x !== piece.x || contained.y !== piece.y) {
          piece.setPosition(contained.x, contained.y);
          piece.setVelocity(0, 0);
        }
        return isDangerousBody({
          top: piece.body.bounds.min.y,
          dangerY: BOARD.dangerY,
          ageMs: this.time.now - (piece.getData('bornAt') ?? this.time.now),
        });
      });
      const previousWarning = this.dangerState.warningLevel;
      this.dangerState = updateDangerState({ ...this.dangerState, deltaMs: delta, hasDanger });
      if (this.dangerState.warningLevel !== previousWarning) {
        this.dangerLabel.setText(this.dangerState.warningLevel ? `WARNING ${this.dangerState.warningLevel}…` : 'DANGER');
        this.eventsBridge('danger', { ...this.dangerState });
      }
      if (this.dangerState.gameOver) this.finishGame();
    }

    finishGame() {
      if (this.isGameOver) return;
      this.isGameOver = true;
      if (this.preview) {
        this.tweens.killTweensOf(this.preview);
        this.preview.destroy();
        this.preview = null;
      }
      this.eventsBridge('game-over', { stats: this.cloneStats(), state: this.getPublicState() });
    }

    restartRound() {
      this.scene.restart({ ...this.settings, mode: this.mode });
    }

    setMode(mode) {
      if (!['endless', 'daily'].includes(mode) || mode === this.mode) return;
      this.mode = mode;
      this.settings.mode = mode;
      this.restartRound();
    }

    setPaused(paused) {
      this.isPaused = Boolean(paused);
      if (this.isPaused) this.matter.world.pause();
      else this.matter.world.resume();
      this.eventsBridge('pause', { paused: this.isPaused });
    }

    cloneStats() {
      return { ...this.stats, createdByTier: { ...this.stats.createdByTier } };
    }

    getPublicState() {
      return {
        mode: this.mode,
        score: this.score || 0,
        combo: this.comboCount || 0,
        currentTier: this.currentTier,
        heldTier: this.heldTier,
        holdLocked: this.holdLocked,
        nextTier: this.sequence?.[this.sequenceIndex % this.sequence.length] || 1,
        afterTier: this.sequence?.[(this.sequenceIndex + 1) % this.sequence.length] || 1,
        danger: { ...(this.dangerState || {}) },
        gameOver: this.isGameOver,
        stats: this.cloneStats?.() || {},
      };
    }

    getDebugState() {
      return {
        ...this.getPublicState(),
        pieces: [...this.pieces.values()].filter((piece) => piece.active).map((piece) => ({
          id: piece.getData('id'), tier: piece.getData('tier'), x: Math.round(piece.x), y: Math.round(piece.y),
        })),
      };
    }

    emitState() {
      this.eventsBridge('state', this.getPublicState());
    }
  };

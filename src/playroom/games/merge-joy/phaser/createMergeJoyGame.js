import { createMergeJoyScene } from './scenes/MergeJoyScene.js';

export const createMergeJoyGame = async ({ parent, events, settings }) => {
  const PhaserModule = await import('phaser');
  const Phaser = PhaserModule.default || PhaserModule;
  const scene = createMergeJoyScene(Phaser, { events, settings });
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 620,
    height: 780,
    transparent: true,
    physics: {
      default: 'matter',
      matter: {
        gravity: { y: 1.12 },
        enableSleeping: true,
        positionIterations: 8,
        velocityIterations: 6,
        constraintIterations: 3,
        debug: false,
      },
    },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene,
  });

  const getScene = () => game.scene.getScene('MergeJoyScene');
  return {
    game,
    moveTo(x) { getScene()?.movePreviewTo(x); },
    nudge(direction) { getScene()?.nudgePreview(direction); },
    drop() { getScene()?.dropCurrentPiece(); },
    hold() { getScene()?.holdCurrentPiece(); },
    restart() { getScene()?.restartRound(); },
    pause() { getScene()?.setPaused(true); },
    resume() { getScene()?.setPaused(false); },
    setMode(mode) { getScene()?.setMode(mode); },
    getDebugState() { return getScene()?.getDebugState?.() || null; },
    destroy() {
      const canvas = game.canvas;
      game.destroy(true);
      canvas?.parentNode?.removeChild(canvas);
    },
  };
};

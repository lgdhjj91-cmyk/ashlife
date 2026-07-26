import { createClawMachineScene } from './scenes/ClawMachineScene';

export const createClawGame = async ({ parent, events, settings }) => {
  const PhaserModule = await import('phaser');
  const Phaser = PhaserModule.default || PhaserModule;
  const controlState = {
    left: false,
    right: false,
  };

  const scene = createClawMachineScene(Phaser, {
    events,
    settings,
    controlState,
  });

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1000,
    height: 760,
    transparent: true,
    physics: {
      default: 'matter',
      matter: {
        gravity: { y: 1.05 },
        enableSleeping: true,
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene,
  });

  const getScene = () => game.scene.getScene('ClawMachineScene');

  return {
    game,
    setMove(direction, isPressed) {
      controlState[direction] = isPressed;
      getScene()?.markStarted();
    },
    dropGrab() {
      getScene()?.dropGrab();
    },
    releasePrize() {
      getScene()?.releasePrize();
    },
    restart() {
      getScene()?.restartRound();
    },
    pause() {
      getScene()?.setPaused(true);
    },
    resume() {
      getScene()?.setPaused(false);
    },
    togglePause() {
      getScene()?.togglePause();
    },
    setMode(mode) {
      getScene()?.setMode(mode);
    },
    setDifficulty(difficulty) {
      getScene()?.setDifficulty(difficulty);
    },
    getDebugState() {
      return getScene()?.getDebugState?.() || null;
    },
    destroy() {
      controlState.left = false;
      controlState.right = false;
      const canvas = game.canvas;
      game.destroy(true);
      canvas?.parentNode?.removeChild(canvas);
    },
  };
};

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createClawGame } from './phaser/createClawGame';
import LoadingScreen from './components/LoadingScreen';

const initialStatus = {
  state: 'READY',
  statusMessage: 'Move the claw',
  gripStatus: '',
  swingPower: 0,
  attemptsRemaining: 'Unlimited',
  attemptsUsed: 0,
  score: 0,
  elapsedSeconds: 0,
};

const gameplayKeys = new Set(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'KeyR', 'Escape', 'KeyP']);

const clearMount = (mount) => {
  if (!mount) return;
  while (mount.firstChild) {
    mount.removeChild(mount.firstChild);
  }
};

const shouldIgnoreGameplayKey = (target) => {
  const tagName = target?.tagName;
  return target?.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
};

const ClawMachineGame = ({ mode, difficulty, testMode = false, onEvent, registerControls }) => {
  const mountRef = useRef(null);
  const bridgeRef = useRef(null);
  const [status, setStatus] = useState(initialStatus);
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const emit = useCallback(
    (type, detail) => {
      if (type === 'attempt-updated' || type === 'game-ready' || type === 'grip-changed') {
        setStatus((current) => ({ ...current, ...detail }));
      }
      onEvent?.(type, detail);
    },
    [onEvent]
  );

  useEffect(() => {
    let cancelled = false;
    let bridge;
    const mountNode = mountRef.current;

    const init = async () => {
      try {
        if (!mountNode) return;
        clearMount(mountNode);
        setIsLoading(true);
        bridge = await createClawGame({
          parent: mountNode,
          settings: { mode, difficulty, testMode },
          events: emit,
        });
        if (cancelled) {
          bridge.destroy();
          return;
        }
        bridgeRef.current = bridge;
        registerControls?.(bridge);
        setIsLoading(false);
      } catch (error) {
        console.error('Unable to start Ashlife Swing & Win.', error);
        setLoadError('Phaser could not initialize. Please refresh the game route.');
        setIsLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      registerControls?.(null);
      bridge?.destroy();
      clearMount(mountNode);
      bridgeRef.current = null;
    };
  }, [difficulty, emit, mode, registerControls, testMode]);

  useEffect(() => {
    bridgeRef.current?.setMode(mode);
  }, [mode]);

  useEffect(() => {
    bridgeRef.current?.setDifficulty(difficulty);
  }, [difficulty]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) bridgeRef.current?.pause();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const handleKeyDown = (event) => {
    if (!gameplayKeys.has(event.code)) return;
    event.preventDefault();
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') bridgeRef.current?.setMove('left', true);
    if (event.code === 'ArrowRight' || event.code === 'KeyD') bridgeRef.current?.setMove('right', true);
    if (event.code === 'Space' && !event.repeat) bridgeRef.current?.dropGrab();
    if (event.code === 'KeyR' && !event.repeat) bridgeRef.current?.releasePrize();
    if ((event.code === 'Escape' || event.code === 'KeyP') && !event.repeat) bridgeRef.current?.togglePause();
  };

  const handleKeyUp = (event) => {
    if (!gameplayKeys.has(event.code)) return;
    event.preventDefault();
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') bridgeRef.current?.setMove('left', false);
    if (event.code === 'ArrowRight' || event.code === 'KeyD') bridgeRef.current?.setMove('right', false);
  };

  useEffect(() => {
    const onDocumentKeyDown = (event) => {
      if (shouldIgnoreGameplayKey(event.target)) return;
      handleKeyDown(event);
    };
    const onDocumentKeyUp = (event) => {
      if (shouldIgnoreGameplayKey(event.target)) return;
      handleKeyUp(event);
    };
    document.addEventListener('keydown', onDocumentKeyDown);
    document.addEventListener('keyup', onDocumentKeyUp);
    return () => {
      document.removeEventListener('keydown', onDocumentKeyDown);
      document.removeEventListener('keyup', onDocumentKeyUp);
    };
  });

  return (
    <div
      className="claw-canvas-shell"
      tabIndex={0}
      role="application"
      aria-label="Ashlife Swing and Win game canvas"
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      {(loadError || isLoading) && <LoadingScreen error={loadError} />}
      <div className="claw-phaser-mount" ref={mountRef} />
      <p className="sr-only" aria-live="polite">
        {status.statusMessage}
      </p>
    </div>
  );
};

export default ClawMachineGame;

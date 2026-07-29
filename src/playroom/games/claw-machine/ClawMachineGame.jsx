import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createClawGame } from './phaser/createClawGame';
import LoadingScreen from './components/LoadingScreen';
import { shouldIgnoreDocumentGameplayKey } from './systems/KeyboardControls';
import { createEventBridge } from './systems/EventBridge';

const createInitialStatus = (copy) => ({
  state: 'READY',
  statusMessage: copy.status.READY,
  gripStatus: '',
  swingPower: 0,
  attemptsRemaining: copy.unlimited,
  attemptsUsed: 0,
  score: 0,
  elapsedSeconds: 0,
});

const gameplayKeys = new Set(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'KeyR', 'Escape', 'KeyP']);

const clearMount = (mount) => {
  if (!mount) return;
  while (mount.firstChild) {
    mount.removeChild(mount.firstChild);
  }
};

const ClawMachineGame = ({
  mode,
  difficulty,
  language,
  copy,
  testMode = false,
  onEvent,
  registerControls,
}) => {
  const shellRef = useRef(null);
  const mountRef = useRef(null);
  const bridgeRef = useRef(null);
  const modeRef = useRef(mode);
  const difficultyRef = useRef(difficulty);
  const [eventBridge] = useState(() => createEventBridge(onEvent));
  const [status, setStatus] = useState(() => createInitialStatus(copy));
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    eventBridge.update(onEvent);
  }, [eventBridge, onEvent]);

  useEffect(() => {
    modeRef.current = mode;
    difficultyRef.current = difficulty;
  }, [difficulty, mode]);

  const emit = useCallback((type, detail) => {
    if (type === 'attempt-updated' || type === 'game-ready' || type === 'grip-changed') {
      setStatus((current) => ({ ...current, ...detail }));
    }
    eventBridge.emit(type, detail);
  }, [eventBridge]);

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
          settings: {
            mode: modeRef.current,
            difficulty: difficultyRef.current,
            language,
            testMode,
          },
          events: emit,
        });
        if (cancelled) {
          bridge.destroy();
          return;
        }
        bridgeRef.current = bridge;
        bridge.setMode(modeRef.current);
        bridge.setDifficulty(difficultyRef.current);
        registerControls?.(bridge);
        setIsLoading(false);
      } catch (error) {
        console.error('Unable to start Ashlife Swing & Win.', error);
        setLoadError(copy.loading.error);
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
  }, [copy, emit, language, registerControls, testMode]);

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
      if (shouldIgnoreDocumentGameplayKey(event.target, shellRef.current, event.code)) return;
      handleKeyDown(event);
    };
    const onDocumentKeyUp = (event) => {
      if (shouldIgnoreDocumentGameplayKey(event.target, shellRef.current, event.code)) return;
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
      ref={shellRef}
      className="claw-canvas-shell"
      tabIndex={0}
      role="application"
      aria-label={copy.loading.canvasAria}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      {(loadError || isLoading) && <LoadingScreen error={loadError} copy={copy.loading} />}
      <div className="claw-phaser-mount" ref={mountRef} />
      <p className="sr-only" aria-live="polite">
        {status.statusMessage}
      </p>
    </div>
  );
};

export default ClawMachineGame;

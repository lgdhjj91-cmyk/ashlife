import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createMergeJoyGame } from './phaser/createMergeJoyGame.js';
import { createEventBridge } from './systems/EventBridge.js';

const clearMount = (mount) => {
  if (!mount) return;
  while (mount.firstChild) mount.removeChild(mount.firstChild);
};

const gameplayKeys = new Set(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space']);

const MergeJoyGame = ({ mode, dateKey, testMode = false, onEvent, registerControls }) => {
  const shellRef = useRef(null);
  const mountRef = useRef(null);
  const controlsRef = useRef(null);
  const [eventBridge] = useState(() => createEventBridge(onEvent));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => eventBridge.update(onEvent), [eventBridge, onEvent]);

  const emit = useCallback((type, detail) => eventBridge.emit(type, detail), [eventBridge]);

  useEffect(() => {
    let cancelled = false;
    let controls;
    const mount = mountRef.current;
    const init = async () => {
      try {
        clearMount(mount);
        setLoading(true);
        controls = await createMergeJoyGame({ parent: mount, events: emit, settings: { mode, dateKey, testMode } });
        if (cancelled) return controls.destroy();
        controlsRef.current = controls;
        registerControls?.(controls);
        if (testMode) window.__mergeJoyGame = controls;
        setLoading(false);
      } catch (error) {
        console.error('Unable to start Ashlife Merge & Joy.', error);
        setLoadError('The game could not load. Please refresh and try again.');
        setLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
      registerControls?.(null);
      if (window.__mergeJoyGame === controls) delete window.__mergeJoyGame;
      controls?.destroy();
      controlsRef.current = null;
      clearMount(mount);
    };
  }, [dateKey, emit, mode, registerControls, testMode]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) controlsRef.current?.pause();
      else controlsRef.current?.resume();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const handleKeyDown = (event) => {
    if (!gameplayKeys.has(event.code)) return;
    event.preventDefault();
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') controlsRef.current?.nudge('left');
    if (event.code === 'ArrowRight' || event.code === 'KeyD') controlsRef.current?.nudge('right');
    if (event.code === 'Space' && !event.repeat) controlsRef.current?.drop();
  };

  useEffect(() => {
    const handleDocumentKey = (event) => {
      const target = event.target;
      if (target?.matches?.('input, textarea, select, [contenteditable="true"]')) return;
      handleKeyDown(event);
    };
    document.addEventListener('keydown', handleDocumentKey);
    return () => document.removeEventListener('keydown', handleDocumentKey);
  });

  return (
    <div ref={shellRef} className="merge-canvas-shell" tabIndex={0} role="application" aria-label="Ashlife Merge & Joy game board" onKeyDown={handleKeyDown}>
      {(loading || loadError) && (
        <div className="merge-loading" role="status">
          <span className="merge-loading-star">★</span>
          <strong>{loadError || 'Preparing your kawaii pieces…'}</strong>
        </div>
      )}
      <div className="merge-phaser-mount" ref={mountRef} />
    </div>
  );
};

export default MergeJoyGame;

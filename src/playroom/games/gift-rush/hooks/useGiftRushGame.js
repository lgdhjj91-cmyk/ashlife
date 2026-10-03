import { useCallback, useEffect, useRef, useState } from 'react';
import { createGiftRushRound, advanceGiftRushRound, reduceGiftRushAction } from '../systems/giftRushEngine.js';
import { applyGiftRushResult } from '../storage/giftRushProgress.js';
import { getLocalDateKey } from '../../../utils/dateKey.js';
import { createJoyRequestId } from '../../../../joy/joyWalletState.js';

const idleRound = () => createGiftRushRound({ sessionId: '', mode: 'practice', dateKey: getLocalDateKey(), seed: 'idle' });
export const useGiftRushGame = ({ updateProgress, ownerUid, playSound }) => {
  const [state, setState] = useState(idleRound);
  const stateRef = useRef(state);
  const lastTick = useRef(0);
  const finishedSession = useRef('');
  const roundOwner = useRef(null);
  const commit = useCallback(next => {
    const previous = stateRef.current;
    if (next === previous) return;
    stateRef.current = next;
    setState(next);
    if (next.lastEvent?.id !== previous.lastEvent?.id) {
      const sounds = { item: 'flip', wrong: 'wrong', expired: 'wrong', delivered: 'match', finished: 'complete' };
      try { if (sounds[next.lastEvent?.type]) playSound(sounds[next.lastEvent.type]); } catch { /* Sound never blocks play. */ }
    }
    if (next.result && finishedSession.current !== next.sessionId) {
      finishedSession.current = next.sessionId;
      const result = next.result;
      const earnedBy = roundOwner.current;
      updateProgress(current => applyGiftRushResult(current, result, { ownerUid: earnedBy }).nextProgress);
    }
  }, [playSound, updateProgress]);
  const tick = useCallback(() => {
    const now = performance.now();
    const delta = now - lastTick.current;
    lastTick.current = now;
    commit(advanceGiftRushRound(stateRef.current, delta));
  }, [commit]);
  const dispatch = useCallback(action => {
    if (stateRef.current.status === 'running') tick();
    commit(reduceGiftRushAction(stateRef.current, action));
  }, [commit, tick]);
  const pause = useCallback(() => {
    dispatch({ type: 'PAUSE', sessionId: stateRef.current.sessionId });
  }, [dispatch]);
  const resume = useCallback(() => {
    lastTick.current = performance.now();
    dispatch({ type: 'RESUME', sessionId: stateRef.current.sessionId });
  }, [dispatch]);
  const startRound = useCallback(mode => {
    const dateKey = getLocalDateKey();
    const sessionId = createJoyRequestId('gift-rush');
    roundOwner.current = ownerUid || null;
    finishedSession.current = '';
    lastTick.current = performance.now();
    const next = createGiftRushRound({ sessionId, mode, dateKey, seed: mode === 'daily' ? 'gift-rush:' + dateKey : sessionId });
    commit(reduceGiftRushAction(next, { type: 'START', sessionId }));
    updateProgress(current => ({ ...current, giftRush: { ...current.giftRush, selectedMode: mode } }));
  }, [commit, ownerUid, updateProgress]);
  const abandonRound = useCallback(() => commit(idleRound()), [commit]);
  useEffect(() => {
    if (state.status !== 'running') return undefined;
    lastTick.current = performance.now();
    const interval = window.setInterval(tick, 100);
    const visibility = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [state.status, tick, pause]);
  return { state, result: state.result, startRound, dispatch, pause, resume, abandonRound };
};

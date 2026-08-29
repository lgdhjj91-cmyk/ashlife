import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, HelpCircle, Pause, Play, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext.jsx';
import { usePlayroomProgress } from '../../hooks/usePlayroomProgress.js';
import { getLocalDateKey } from '../../utils/dateKey.js';
import { getDailyMergeChallenge, evaluateDailyChallenge } from './data/dailyChallenges.js';
import { getMergeTier } from './data/mergeTiers.js';
import { applyMergeSessionResult, recordMergeDiscovery } from './storage/mergeJoyProgress.js';
import { installExternalOverlayGuard } from './utils/externalOverlayGuard.js';
import MergeJoyGame from './MergeJoyGame.jsx';
import MergeHUD from './components/MergeHUD.jsx';
import {
  MergeCollectionModal,
  MergeDiscoveryToast,
  MergeGameOverModal,
  MergeTutorial,
} from './components/MergeModals.jsx';
import './styles/merge-joy.css';

const copy = {
  en: {
    back: 'Back to Playroom', title: 'Ashlife Merge & Joy', endless: 'ENDLESS', daily: 'DAILY',
    how: 'How to Play', collection: 'Collection', hold: 'HOLD', drop: 'DROP', pause: 'Pause game', resume: 'Resume game',
  },
  zh: {
    back: '返回游戏房', title: 'Ashlife 合成欢乐', endless: '无限模式', daily: '每日挑战',
    how: '玩法说明', collection: '收藏', hold: '暂存', drop: '放下', pause: '暂停游戏', resume: '继续游戏',
  },
};

const initialGameState = {
  score: 0, combo: 0, currentTier: 1, nextTier: 1, afterTier: 1, heldTier: null, holdLocked: false,
  danger: { elapsedMs: 0, warningLevel: 0, gameOver: false }, stats: { score: 0, highestTier: 1, maxCombo: 0, perfectDrops: 0, createdByTier: {} },
};

const AUTO_DROP_INTERVAL_MS = 450;

const MergeJoyPage = () => {
  const { language } = useLanguage();
  const labels = copy[language] || copy.en;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const testMode = searchParams.get('testMode') === 'true';
  const dateKey = useMemo(() => getLocalDateKey(), []);
  const challenge = useMemo(() => getDailyMergeChallenge(), []);
  const { progress, updateProgress, syncCoinReward } = usePlayroomProgress();
  const progressRef = useRef(progress);
  const controlsRef = useRef(null);
  const autoDropTimer = useRef(null);
  const seenThisRound = useRef(new Set([1, ...Object.keys(progress.mergeJoy.discoveries).map(Number)]));
  const [mode, setMode] = useState(progress.mergeJoy.selectedMode || 'endless');
  const [gameState, setGameState] = useState(initialGameState);
  const [showTutorial, setShowTutorial] = useState(!progress.mergeJoy.tutorialCompleted);
  const [showCollection, setShowCollection] = useState(false);
  const [discoveryTier, setDiscoveryTier] = useState(null);
  const [discoveryCount, setDiscoveryCount] = useState(() => new Set([1, ...Object.keys(progress.mergeJoy.discoveries).map(Number)]).size);
  const [summary, setSummary] = useState(null);
  const [paused, setPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(progress.mergeJoy.soundEnabled);

  useEffect(() => {
    return installExternalOverlayGuard({ body: document.body, Observer: window.MutationObserver });
  }, []);

  useEffect(() => { progressRef.current = progress; }, [progress]);

  useEffect(() => () => window.clearInterval(autoDropTimer.current), []);

  const challengeResult = useMemo(
    () => evaluateDailyChallenge(challenge, gameState.stats || initialGameState.stats),
    [challenge, gameState.stats]
  );

  const playTone = useCallback((kind) => {
    if (!soundEnabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = kind === 'legendary' ? 'triangle' : 'sine';
    oscillator.frequency.value = kind === 'merge' ? 520 : kind === 'perfect' ? 740 : kind === 'legendary' ? 880 : 260;
    gain.gain.setValueAtTime(0.055, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + (kind === 'legendary' ? 0.5 : 0.16));
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + (kind === 'legendary' ? 0.5 : 0.16));
    oscillator.addEventListener('ended', () => context.close());
  }, [soundEnabled]);

  const handleGameEvent = useCallback((type, detail) => {
    if (type === 'ready' || type === 'state') setGameState(detail);
    if (type === 'asset-error') console.error(`Merge & Joy asset failed to load: ${detail.src}`);
    if (type === 'merge') {
      playTone(detail.perfectDrop ? 'perfect' : 'merge');
      const nextProgress = recordMergeDiscovery(progressRef.current, { tier: detail.tier, count: 1, dateKey });
      progressRef.current = nextProgress;
      updateProgress(nextProgress);
      if (!seenThisRound.current.has(detail.tier)) {
        seenThisRound.current.add(detail.tier);
        setDiscoveryCount(Math.max(1, seenThisRound.current.size));
        setDiscoveryTier(detail.tier);
        window.setTimeout(() => setDiscoveryTier((current) => current === detail.tier ? null : current), 2_400);
      }
    }
    if (type === 'legendary') {
      playTone('legendary');
    }
    if (type === 'danger' && detail.warningLevel) playTone('warning');
    if (type === 'game-over') {
      const dailyResult = evaluateDailyChallenge(challenge, detail.stats);
      const result = applyMergeSessionResult(progressRef.current, {
        mode,
        dateKey,
        challengeId: challenge.id,
        dailyResult,
        stats: { ...detail.stats, createdByTier: {} },
      });
      progressRef.current = result.nextProgress;
      updateProgress(result.nextProgress);
      if (result.coinAward > 0) {
        const claimId = `merge-joy-${dateKey}-${result.nextProgress.mergeJoy.daily.coinsClaimed}-${result.nextProgress.dailyStreak.rewardedMilestones.length}`;
        void syncCoinReward(result.coinAward, claimId);
      }
      setSummary({ stats: detail.stats, coinAward: result.coinAward, medal: mode === 'daily' ? dailyResult.medal : null });
    }
  }, [challenge, dateKey, mode, playTone, syncCoinReward, updateProgress]);

  const registerControls = useCallback((controls) => { controlsRef.current = controls; }, []);

  const chooseMode = (nextMode) => {
    setSummary(null);
    setMode(nextMode);
    seenThisRound.current = new Set([1, ...Object.keys(progressRef.current.mergeJoy.discoveries).map(Number)]);
    setDiscoveryCount(Math.max(1, seenThisRound.current.size));
    updateProgress((current) => ({ ...current, mergeJoy: { ...current.mergeJoy, selectedMode: nextMode } }));
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    updateProgress((current) => ({ ...current, mergeJoy: { ...current.mergeJoy, tutorialCompleted: true } }));
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    updateProgress((current) => ({ ...current, mergeJoy: { ...current.mergeJoy, soundEnabled: next } }));
  };

  const togglePause = () => {
    if (paused) controlsRef.current?.resume(); else controlsRef.current?.pause();
    setPaused(!paused);
  };

  const stopAutoDrop = () => {
    window.clearInterval(autoDropTimer.current);
    autoDropTimer.current = null;
  };

  const startAutoDrop = (event) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    stopAutoDrop();
    controlsRef.current?.drop();
    autoDropTimer.current = window.setInterval(() => controlsRef.current?.drop(), AUTO_DROP_INTERVAL_MS);
  };

  const restart = () => {
    setSummary(null);
    setDiscoveryTier(null);
    seenThisRound.current = new Set([1, ...Object.keys(progressRef.current.mergeJoy.discoveries).map(Number)]);
    setDiscoveryCount(Math.max(1, seenThisRound.current.size));
    controlsRef.current?.restart();
  };

  const heldPiece = gameState.heldTier ? getMergeTier(gameState.heldTier) : null;

  return (
    <main className={`merge-page ${gameState.danger?.warningLevel ? 'has-warning' : ''}`}>
      <header className="merge-topbar">
        <Link className="merge-back-link" to="/play/"><ArrowLeft size={19} />{labels.back}</Link>
        <h1>{labels.title}</h1>
        <div className="merge-top-actions">
          <button type="button" onClick={toggleSound} aria-label={soundEnabled ? 'Turn sound off' : 'Turn sound on'}>{soundEnabled ? <Volume2 /> : <VolumeX />}</button>
          <button type="button" onClick={togglePause} aria-label={paused ? labels.resume : labels.pause}>{paused ? <Play /> : <Pause />}</button>
          <button type="button" onClick={() => setShowTutorial(true)}><HelpCircle /> <span>{labels.how}</span></button>
        </div>
      </header>

      <div className="merge-mode-tabs" aria-label="Game mode">
        <button className={mode === 'endless' ? 'is-selected' : ''} type="button" onClick={() => chooseMode('endless')}><Sparkles />{labels.endless}</button>
        <button className={mode === 'daily' ? 'is-selected' : ''} type="button" onClick={() => chooseMode('daily')}>{labels.daily}</button>
      </div>

      <section className="merge-game-layout">
        <MergeHUD gameState={gameState} progress={progress} challenge={challenge} challengeResult={challengeResult} onRestart={restart} />
        <div className="merge-board-column">
          <MergeJoyGame mode={mode} dateKey={dateKey} testMode={testMode} onEvent={handleGameEvent} registerControls={registerControls} />
          <div className="merge-bottom-controls">
            <button className="merge-hold-button" type="button" disabled={gameState.holdLocked || !gameState.currentTier} onClick={() => controlsRef.current?.hold()}>
              <span>{labels.hold}</span>
              {heldPiece ? <img src={heldPiece.image} alt={heldPiece.name} /> : <strong>↻</strong>}
            </button>
            <button
              className="merge-drop-button"
              type="button"
              disabled={gameState.gameOver}
              title={language === 'zh' ? '长按连续放下' : 'Hold to auto-drop'}
              aria-label={`${labels.drop}. ${language === 'zh' ? '长按连续放下' : 'Hold to auto-drop'}`}
              onClick={(event) => { if (event.detail === 0) controlsRef.current?.drop(); }}
              onPointerDown={startAutoDrop}
              onPointerUp={stopAutoDrop}
              onPointerCancel={stopAutoDrop}
            >
              <span>↓</span>{labels.drop}
            </button>
            <button className="merge-collection-button" type="button" onClick={() => setShowCollection(true)}><BookOpen />{labels.collection}</button>
          </div>
        </div>
      </section>

      <p className="sr-only" aria-live="polite">
        Score {gameState.score}. {gameState.combo > 1 ? `Combo times ${gameState.combo}.` : ''}
      </p>

      {showTutorial && <MergeTutorial onClose={closeTutorial} />}
      {showCollection && <MergeCollectionModal progress={progress} onClose={() => setShowCollection(false)} />}
      {discoveryTier && <MergeDiscoveryToast tier={discoveryTier} progressCount={discoveryCount} />}
      <MergeGameOverModal summary={summary} onReplay={restart} onCollection={() => { setSummary(null); setShowCollection(true); }} onBack={() => navigate('/play/')} />
    </main>
  );
};

export default MergeJoyPage;
